# polls/serializers.py
from rest_framework import serializers
from .models import Poll, Choice, Vote, User  # Предполагаем, что User импортирован или доступен
from django.db import transaction, models  # Импорт models для F-выражения
from django.utils import timezone


# ----------------------------------------------------------------------
# 1. СЕРИАЛИЗАТОРЫ ДЛЯ ОТОБРАЖЕНИЯ (Poll Detail & List)
# ----------------------------------------------------------------------

# 1.1. ChoiceDetailSerializer: для вывода вариантов ответа в Poll
class ChoiceDetailSerializer(serializers.ModelSerializer):
    # votes_count берется напрямую из поля-кэша модели Choice
    class Meta:
        model = Choice
        fields = ('id', 'choice_text', 'votes_count')


# 1.2. PollDetailSerializer: для GET-запроса (просмотр деталей и результатов)
class PollDetailSerializer(serializers.ModelSerializer):
    choices = ChoiceDetailSerializer(many=True, read_only=True)
    total_votes = serializers.IntegerField(read_only=True)  # Берется из @property модели

    # Дополнительные поля для фронтенда
    # owner_username = serializers.CharField(source='owner.username', read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = (
            'id', 'title', 'is_anonymous', 'multiple_answers', 'end_date',
            'created_at', 'choices', 'total_votes', 'is_active'
        )
        read_only_fields = fields  # Все поля только для чтения

    def get_is_active(self, obj):
        # Проверка: опрос активен (active=True) и дата окончания не наступила
        return obj.active and (obj.end_date is None or obj.end_date > timezone.now())


# ----------------------------------------------------------------------
# 2. СЕРИАЛИЗАТОРЫ ДЛЯ СОЗДАНИЯ (Poll Create)
# ----------------------------------------------------------------------

# 2.1. ChoiceCreateSerializer: для приема текста варианта при создании опроса
class ChoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('choice_text',)


# 2.2. PollCreateSerializer: для POST-запроса (создание опроса)
class PollCreateSerializer(serializers.ModelSerializer):
    choices = ChoiceCreateSerializer(many=True)  # Принимает список вариантов

    class Meta:
        model = Poll
        fields = ('id', 'title', 'is_anonymous', 'multiple_answers', 'end_date', 'choices')
        read_only_fields = ('id',)

    def create(self, validated_data):
        choices_data = validated_data.pop('choices')

        # Валидация: минимум один вариант ответа
        if not choices_data or len(choices_data) < 1:
            raise serializers.ValidationError({"choices": "Опрос должен содержать минимум один вариант ответа."})

        # Атомарная транзакция: либо создаем все, либо откатываем изменения
        with transaction.atomic():
            # owner должен быть передан в validated_data или context из View
            poll = Poll.objects.create(**validated_data)

            # Оптимизированное создание вариантов через bulk_create
            choices_to_create = [
                Choice(poll=poll, **choice_data)
                for choice_data in choices_data
            ]
            Choice.objects.bulk_create(choices_to_create)

            return poll


# ----------------------------------------------------------------------
# 3. СЕРИАЛИЗАТОР ДЛЯ ГОЛОСОВАНИЯ (Vote)
# ----------------------------------------------------------------------

# 3.1. VoteSerializer: для POST-запроса (голосование)
class VoteSerializer(serializers.ModelSerializer):
    choice_id = serializers.IntegerField(write_only=True)  # Принимаем ID выбранного варианта

    class Meta:
        model = Vote
        fields = ('choice_id',)

    def create(self, validated_data):
        # Параметры должны быть переданы в validated_data или context из View
        user = validated_data.pop('user', None)
        poll = validated_data.pop('poll')
        choice_id = validated_data.pop('choice_id')

        # 1. Проверка существования варианта и его принадлежности к опросу
        try:
            choice = Choice.objects.get(id=choice_id, poll=poll)
        except Choice.DoesNotExist:
            raise serializers.ValidationError({"choice_id": "Указанный вариант ответа не принадлежит этому опросу."})

        # 2. Проверка на повторное голосование (если множественный выбор запрещен)
        if user and not poll.multiple_answers and Vote.objects.filter(user=user, poll=poll).exists():
            raise serializers.ValidationError(
                {"non_field_errors": "Вы уже голосовали в этом опросе, и он не допускает множественного выбора."})

        # 3. Создание голоса и обновление кэша
        try:
            with transaction.atomic():
                # Создаем запись о голосе
                vote = Vote.objects.create(user=user, poll=poll, choice=choice)

                # Атомарное увеличение кэшированного счетчика голосов (оптимизация)
                Choice.objects.filter(id=choice.id).update(votes_count=models.F('votes_count') + 1)

                return vote
        except IntegrityError:
            raise serializers.ValidationError(
                {"non_field_errors": "Не удалось сохранить голос из-за ошибки транзакции."})



# --- СЕРИАЛИЗАТОРЫ ДЛЯ ТЕСТОВ ---

class TaskOptionSerializer(models.ModelSerializer):
    class Meta:
        model = TaskOption
        fields = ['id', 'text', 'is_correct']

class TaskSerializer(models.ModelSerializer):
    options = TaskOptionSerializer(many=True, required=False)

    class Meta:
        model = Task
        fields = ['id', 'question', 'type', 'score', 'correct_text', 'order', 'options']

class TestSerializer(models.ModelSerializer):
    tasks = TaskSerializer(many=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Test
        fields = [
            'id', 'owner', 'owner_username', 'title', 'created_at',
            'completion_time', 'attempt_number', 'end_date', 'active', 'tasks'
        ]
        read_only_fields = ['owner']

    @transaction.atomic
    def create(self, validated_data):
        tasks_data = validated_data.pop('tasks')
        test = Test.objects.create(**validated_data)
        for task_data in tasks_data:
            options_data = task_data.pop('options', [])
            task = Task.objects.create(test=test, **task_data)
            for option_data in options_data:
                TaskOption.objects.create(task=task, **option_data)
        return test

class TaskAnswerSerializer(models.ModelSerializer):
    class Meta:
        model = TaskAnswer
        fields = ['task', 'answer_text', 'selected_options']


class TestAttemptSerializer(serializers.ModelSerializer):
    answers = TaskAnswerSerializer(many=True)

    class Meta:
        model = TestAttempt
        fields = ['id', 'test', 'user', 'score_obtained', 'total_score', 'started_at', 'completed_at', 'answers']
        read_only_fields = ['user', 'score_obtained', 'total_score', 'completed_at']

    def validate(self, data):
        user = self.context['request'].user
        test = data['test']

        # 1. Валидация попыток
        existing_attempts = TestAttempt.objects.filter(user=user, test=test).count()
        if existing_attempts >= test.attempt_number:
            raise ValidationError(f"Вы исчерпали лимит попыток ({test.attempt_number}).")

        # 2. Валидация дедлайна
        if test.end_date and timezone.now() > test.end_date:
            raise ValidationError("Срок прохождения теста истек.")

        return data

    @transaction.atomic
    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        test = validated_data['test']
        user = self.context['request'].user

        attempt = TestAttempt.objects.create(user=user, **validated_data)

        total_score = 0
        obtained_score = 0

        for ans_data in answers_data:
            task = ans_data['task']
            selected_options = ans_data.get('selected_options', [])
            answer_text = ans_data.get('answer_text', '')

            # Создаем запись ответа
            ans_obj = TaskAnswer.objects.create(attempt=attempt, task=task, answer_text=answer_text)
            if selected_options:
                ans_obj.selected_options.set(selected_options)

            total_score += task.score

            # --- ЛОГИКА ПРОВЕРКИ ---
            if task.type == 'text':
                if answer_text.strip().lower() == (task.correct_text or "").strip().lower():
                    obtained_score += task.score

            elif task.type == 'single':
                # Проверяем, что выбран ровно один вариант и он правильный
                if len(selected_options) == 1:
                    option = selected_options[0]
                    if option.is_correct:
                        obtained_score += task.score

            elif task.type == 'multiple':
                # Для multiple считаем ответ верным, только если выбраны ВСЕ верные и НИ ОДНОГО неверного
                correct_options_ids = set(task.options.filter(is_correct=True).values_list('id', flat=True))
                selected_options_ids = set([opt.id for opt in selected_options])

                if correct_options_ids == selected_options_ids:
                    obtained_score += task.score

        # Обновляем итоги попытки
        attempt.total_score = total_score
        attempt.score_obtained = obtained_score
        attempt.completed_at = timezone.now()
        attempt.save()

        return attempt