from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.db import transaction, models, IntegrityError
from django.utils import timezone
from .models import (
    Poll, Choice, Vote, User,
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

    class Meta:
        model = Poll
        fields = (
            'id', 'title', 'is_anonymous', 'multiple_answers', 'end_date',
            'created_at', 'choices', 'total_votes', 'is_active'
        )
        read_only_fields = fields

    def get_is_active(self, obj):
        return obj.active and (obj.end_date is None or obj.end_date > timezone.now())


class ChoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('choice_text',)


class PollCreateSerializer(serializers.ModelSerializer):
    choices = ChoiceCreateSerializer(many=True)

    class Meta:
        model = Poll
        fields = ('id', 'title', 'is_anonymous', 'multiple_answers', 'end_date', 'choices')
        read_only_fields = ('id',)

    def create(self, validated_data):
        choices_data = validated_data.pop('choices')
        if not choices_data:
            raise ValidationError({"choices": "Минимум один вариант ответа."})

        with transaction.atomic():
            poll = Poll.objects.create(**validated_data)
            Choice.objects.bulk_create([Choice(poll=poll, **c) for c in choices_data])
            return poll


class VoteSerializer(serializers.ModelSerializer):
    choice_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Vote
        fields = ('choice_id',)

    def create(self, validated_data):
        user = validated_data.pop('user', None)
        poll = validated_data.pop('poll')
        choice_id = validated_data.pop('choice_id')

        try:
            choice = Choice.objects.get(id=choice_id, poll=poll)
        except Choice.DoesNotExist:
            raise ValidationError({"choice_id": "Вариант не найден в этом опросе."})

        if user and not poll.multiple_answers and Vote.objects.filter(user=user, poll=poll).exists():
            raise ValidationError({"non_field_errors": "Вы уже голосовали."})

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
    options = TaskOptionSerializer(many=True)

    class Meta:
        model = Task
        fields = ['id', 'question', 'task_type', 'score', 'options']


class TestSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True)

    class Meta:
        model = Test
        fields = ['id', 'owner', 'title', 'created_at', 'completion_time', 'attempt_number', 'end_date', 'tasks']
        read_only_fields = ['id', 'created_at']

    @transaction.atomic
    def create(self, validated_data):
        tasks_data = validated_data.pop('tasks')
        test = Test.objects.create(**validated_data)

        for t_data in tasks_data:
            opts_data = t_data.pop('options', [])
            task = Task.objects.create(test=test, **t_data)
            # Оптимизация создания вариантов
            TaskOption.objects.bulk_create([TaskOption(task=task, **o) for o in opts_data])
        return test


class TaskAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskAnswer
        fields = ['task', 'answer_text', 'selected_options']


class TestAttemptSerializer(serializers.ModelSerializer):
    answers = TaskAnswerSerializer(many=True, write_only=True)

    class Meta:
        model = TestAttempt
        fields = ['id', 'test', 'user', 'score_obtained', 'total_score', 'started_at', 'completed_at', 'answers']
        read_only_fields = ['user', 'score_obtained', 'total_score', 'completed_at']

    def validate(self, data):
        user = self.context['request'].user
        test = data['test']
        if user.is_authenticated:
            if TestAttempt.objects.filter(user=user, test=test).count() >= test.attempt_number:
                raise ValidationError("Лимит попыток исчерпан.")
        if test.end_date and timezone.now() > test.end_date:
            raise ValidationError("Время теста истекло.")
        return data

    @transaction.atomic
    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        test = validated_data['test']
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None

        attempt = TestAttempt.objects.create(user=user, test=test)
        total_score, obtained_score = 0, 0

        for ans in answers_data:
            task = ans['task']
            sel_options = ans.get('selected_options', [])
            text_ans = ans.get('answer_text', '')

            # Сохраняем ответ
            ans_obj = TaskAnswer.objects.create(attempt=attempt, task=task, answer_text=text_ans)
            if sel_options: ans_obj.selected_options.set(sel_options)

            total_score += task.score

            # Проверка логики (используем task_type из модели)
            if task.task_type == 'text':
                if text_ans.strip().lower() == (task.correct_text or "").strip().lower():
                    obtained_score += task.score

            elif task.task_type == 'single':
                if len(sel_options) == 1 and sel_options[0].is_correct:
                    obtained_score += task.score

            elif task.task_type == 'multiple':
                correct_ids = set(task.options.filter(is_correct=True).values_list('id', flat=True))
                selected_ids = set([opt.id for opt in sel_options])
                if correct_ids == selected_ids and correct_ids:
                    obtained_score += task.score

        attempt.total_score = total_score
        attempt.score_obtained = obtained_score
        attempt.completed_at = timezone.now()
        attempt.save()
        return attempt