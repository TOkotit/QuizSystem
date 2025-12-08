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
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = (
            'id', 'title', 'is_anonymous', 'multiple_answers', 'end_date',
            'created_at', 'owner_username', 'choices', 'total_votes', 'is_active'
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