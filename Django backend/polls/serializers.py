from rest_framework import serializers
from .models import Poll, Choice, Vote
from django.db import transaction, IntegrityError
from django.utils import timezone


# ----------------------------------------------------------------------
# 1. Сериализаторы для создания/редактирования опроса
# ----------------------------------------------------------------------

# A. Используется для приема списка вариантов ответов при создании нового опроса.
class ChoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        # Имя поля в модели - 'choice_text'
        fields = ('choice_text',)


# B. Сериализатор для создания нового опроса вместе с его вариантами ответов.
class PollCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='text')  # Фронтенд: 'title', Модель: 'text'
    choices = ChoiceCreateSerializer(many=True)

    class Meta:
        model = Poll
        # 'title' используется вместо 'text' в полях
        fields = ('id', 'title', 'is_anonymous', 'multiple_answers', 'end_date', 'choices')
        read_only_fields = ('id',)

    def create(self, validated_data):
        choices_data = validated_data.pop('choices')

        if not choices_data or len(choices_data) < 1:
            raise serializers.ValidationError({"choices": "Опрос должен содержать минимум один вариант ответа."})

        # В представлении (view) мы передадим сюда 'owner'
        owner = validated_data.pop('owner')

        with transaction.atomic():
            poll = Poll.objects.create(owner=owner, **validated_data)
            for choice_data in choices_data:
                Choice.objects.create(poll=poll, **choice_data)
            return poll


# ----------------------------------------------------------------------
# 2. Сериализаторы для отображения результатов
# ----------------------------------------------------------------------

# C1. Сериализатор для отображения Choice в составе Poll (включая количество голосов).
class ChoiceDetailSerializer(serializers.ModelSerializer):
    votes_count = serializers.SerializerMethodField()

    class Meta:
        model = Choice
        fields = ('id', 'choice_text', 'votes_count')

    def get_votes_count(self, obj):
        return obj.get_vote_count


# C2. Сериализатор для отображения Poll.
class PollDetailSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='text')  # Модель: 'text', Сериализатор: 'title'
    choices = ChoiceDetailSerializer(many=True, read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    total_votes = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ('id', 'title', 'is_anonymous', 'multiple_answers', 'end_date',
                  'created_at', 'owner_username', 'choices', 'total_votes', 'is_active')
        read_only_fields = fields  # Все поля только для чтения, так как это детали/результаты

    def get_total_votes(self, obj):
        # Используем существующий метод из модели
        return obj.get_vote_count

    def get_is_active(self, obj):
        # Проверка, активен ли опрос и не истекла ли дата окончания
        return obj.active and (obj.end_date is None or obj.end_date > timezone.now())


# ----------------------------------------------------------------------
# 3. Сериализатор для голосования
# ----------------------------------------------------------------------

# D. Сериализатор для приема голоса (ожидаем ID выбранного варианта).
class VoteSerializer(serializers.ModelSerializer):
    choice_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Vote
        fields = ('choice_id',)
        # user, poll, choice будут установлены в представлении (view)
        # Мы добавляем unique_together в модель, чтобы запретить повторное голосование

    def create(self, validated_data):
        # В представлении мы передадим сюда `user` и `poll`
        user = validated_data.pop('user')
        poll = validated_data.pop('poll')
        choice_id = validated_data.pop('choice_id')

        # Проверяем, существует ли вариант ответа и принадлежит ли он текущему опросу
        try:
            choice = Choice.objects.get(id=choice_id, poll=poll)
        except Choice.DoesNotExist:
            raise serializers.ValidationError({"choice_id": "Указанный вариант ответа не принадлежит этому опросу."})

        # Если опрос не допускает множественного выбора, проверяем, голосовал ли пользователь
        if not poll.multiple_answers and Vote.objects.filter(user=user, poll=poll).exists():
             raise serializers.ValidationError({"non_field_errors": "Вы уже голосовали в этом опросе, и он не допускает множественного выбора."})

        # Создаем голос
        try:
            return Vote.objects.create(user=user, poll=poll, choice=choice)
        except IntegrityError:
            # Это может произойти, если пользователь пытается проголосовать дважды
            # за один и тот же вариант (хотя это должна предотвращать модель Vote).
            raise serializers.ValidationError({"non_field_errors": "Не удалось сохранить голос из-за ошибки уникальности."})