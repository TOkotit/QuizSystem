from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.db import transaction, models
from django.utils import timezone
from .models import (
    Poll, Choice, Vote,
    Test, Task, TaskOption, TestAttempt, TaskAnswer
)


# --- 1. ОПРOСЫ (POLLS) ---

class ChoiceDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'choice_text', 'votes_count')


class PollDetailSerializer(serializers.ModelSerializer):
    choices = ChoiceDetailSerializer(many=True, read_only=True)
    total_votes = serializers.IntegerField(read_only=True)
    is_active = serializers.SerializerMethodField()
    # НОВОЕ ПОЛЕ: список проголосовавших
    voted_users = serializers.SerializerMethodField()
    all_votes = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = (
            'id', 'title', 'owner', 'is_anonymous', 'multiple_answers', 'end_date',
            'created_at', 'choices', 'total_votes', 'is_active', 'voted_users', 'all_votes'
        )
        read_only_fields = ['id', 'created_at', 'total_votes']

    def get_is_active(self, obj):
        return obj.active and (obj.end_date is None or obj.end_date > timezone.now())
    
    # Метод для получения списка имен/ID пользователей
    def get_voted_users(self, obj):
        # Получаем все уникальные значения из поля user модели Vote, относящиеся к этому опросу
        return list(Vote.objects.filter(choice__poll=obj).values_list('user', flat=True).distinct())

    def get_all_votes(self, obj):
        # 1. Находим все голоса, которые относятся к вариантам этого опроса
        # 2. Используем .select_related() не нужно, так как мы берем данные только из Vote
        votes_queryset = Vote.objects.filter(choice__poll=obj)
        
        # 3. Возвращаем сериализованные данные
        return VoteSerializer(votes_queryset, many=True).data


class ChoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'choice_text', 'votes_count')


class PollCreateSerializer(serializers.ModelSerializer):
    choices = ChoiceCreateSerializer(many=True)

    class Meta:
        model = Poll
        fields = ('id', 'title', 'owner', 'is_anonymous', 'multiple_answers', 'end_date', 'choices')
        read_only_fields = ('id',)

    def create(self, validated_data):
        choices_data = validated_data.pop('choices')
        with transaction.atomic():
            poll = Poll.objects.create(**validated_data)
            Choice.objects.bulk_create([Choice(poll=poll, **c) for c in choices_data])
            return poll


class VoteSerializer(serializers.ModelSerializer):
    choice_id = serializers.IntegerField()
    # Разрешаем принимать строку user
    user = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Vote
        fields = ('choice_id', 'user')

    def create(self, validated_data):
        user = validated_data.pop('user', None)
        poll = validated_data.pop('poll')
        choice_id = validated_data.pop('choice_id')

        try:
            choice = Choice.objects.get(id=choice_id, poll=poll)
        except Choice.DoesNotExist:
            raise ValidationError({"choice_id": "Вариант не найден."})

        # Простая проверка на повтор (если нужно)
        if user and not poll.multiple_answers and Vote.objects.filter(user=user, poll=poll).exists():
            # Можно раскомментировать, если хочешь запретить накрутку
            # raise ValidationError("Вы уже голосовали.")
            pass

        with transaction.atomic():
            vote = Vote.objects.create(user=user, poll=poll, choice=choice)
            Choice.objects.filter(id=choice.id).update(votes_count=models.F('votes_count') + 1)
            return vote


# --- 2. ТЕСТЫ (TESTS) ---

class TaskOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskOption
        fields = ['id', 'text', 'is_correct']


class TaskSerializer(serializers.ModelSerializer):
    options = TaskOptionSerializer(many=True, required=False)

    # ВОТ ЭТО ИСПРАВЛЯЕТ ОШИБКУ СОХРАНЕНИЯ:
    # Связываем фронтенд (type) с бэкендом (task_type)
    type = serializers.CharField(source='task_type')
    # Связываем фронтенд (correctText) с бэкендом (correct_text)
    correctText = serializers.CharField(source='correct_text', required=False, allow_blank=True)

    class Meta:
        model = Task
        fields = ('id', 'question', 'type', 'score', 'options', 'correctText')


class TestSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True)
    # owner должен быть доступен для записи
    owner = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Test
        fields = ('id', 'title', 'owner', 'tasks', 'completion_time', 'attempt_number', 'end_date')
        read_only_fields = ['id', 'created_at']

    @transaction.atomic
    def create(self, validated_data):
        tasks_data = validated_data.pop('tasks')
        test = Test.objects.create(**validated_data)

        for t_data in tasks_data:
            opts_data = t_data.pop('options', [])
            task = Task.objects.create(test=test, **t_data)

            # Создаем варианты ответов
            for o in opts_data:
                TaskOption.objects.create(task=task, **o)
        return test


class TaskAnswerSerializer(serializers.ModelSerializer):
    # Принимаем ID выбранных опций
    selected_options = serializers.PrimaryKeyRelatedField(
        queryset=TaskOption.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = TaskAnswer
        fields = ['task', 'answer_text', 'selected_options']


class TestAttemptSerializer(serializers.ModelSerializer):
    answers = TaskAnswerSerializer(many=True, write_only=True)
    user = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = TestAttempt
        fields = ['id', 'test', 'user', 'score_obtained', 'total_score', 'started_at', 'completed_at', 'answers']
        read_only_fields = ['score_obtained', 'total_score', 'completed_at']

    @transaction.atomic
    def create(self, validated_data):
        answers_data = validated_data.pop('answers', [])
        test = validated_data['test']
        user = validated_data.get('user', 'Anonymous')

        attempt = TestAttempt.objects.create(user=user, test=test)
        total_score, obtained_score = 0, 0

        for ans in answers_data:
            task = ans['task']
            sel_options = ans.get('selected_options', [])
            text_ans = ans.get('answer_text', '')

            # Сохраняем ответ в базу
            ans_obj = TaskAnswer.objects.create(attempt=attempt, task=task, answer_text=text_ans)
            if sel_options:
                ans_obj.selected_options.set(sel_options)

            # --- ЛОГИКА ПОДСЧЕТА БАЛЛОВ ---
            total_score += task.score

            if task.task_type == 'text':
                # Сравниваем текст (игнорируем регистр)
                if text_ans and task.correct_text and text_ans.strip().lower() == task.correct_text.strip().lower():
                    obtained_score += task.score

            elif task.task_type == 'single':
                # Если выбран ровно 1 вариант и он верный
                if len(sel_options) == 1 and sel_options[0].is_correct:
                    obtained_score += task.score

            elif task.task_type == 'multiple':
                # Получаем ID правильных ответов
                correct_ids = set(task.options.filter(is_correct=True).values_list('id', flat=True))
                # Получаем ID выбранных
                selected_ids = set([opt.id for opt in sel_options])

                # Полное совпадение
                if correct_ids == selected_ids and len(correct_ids) > 0:
                    obtained_score += task.score

        attempt.total_score = total_score
        attempt.score_obtained = obtained_score
        attempt.completed_at = timezone.now()
        attempt.save()
        return attempt