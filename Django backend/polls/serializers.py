from rest_framework import serializers
from .models import Poll, Choice, Vote
from django.db import IntegrityError, transaction


# ----------------------------------------------------------------------
# 1. Сериализаторы для создания/редактирования опроса
# ----------------------------------------------------------------------

class ChoiceCreateSerializer(serializers.ModelSerializer):
    """
    Используется для приема списка вариантов ответов при создании нового опроса.
    """

    class Meta:
        model = Choice
        # Нам нужно только поле 'text' для создания, poll_id будет установлен в create() PollSerializer'а.
        fields = ('text',)


class PollCreateSerializer(serializers.ModelSerializer):
    """
    Используется для создания нового опроса вместе с его вариантами ответов (Choices).
    """
    # Вложенный сериализатор: при создании опроса ожидается список объектов choices.
    choices = ChoiceCreateSerializer(many=True)

    class Meta:
        model = Poll
        # 'creator' будет установлен в представлении (view) через request.user
        fields = ('id', 'title', 'is_anonymous', 'multiple_answers', 'end_date', 'choices')
        read_only_fields = ('id',)

    def create(self, validated_data):
        # Извлекаем данные вложенных вариантов ответов
        choices_data = validated_data.pop('choices')

        if not choices_data:
            raise serializers.ValidationError({"choices": "Опрос должен содержать хотя бы один вариант ответа."})

        # Создаем объект Poll (Poll object must be created first to get the ID)
        with transaction.atomic():
            poll = Poll.objects.create(**validated_data)

            # Создаем все варианты ответов, связывая их с только что созданным опросом
            for choice_data in choices_data:
                # В Django `unique_together` в модели Choice предотвратит дублирование текста в рамках одного опроса.
                Choice.objects.create(poll=poll, **choice_data)

        return poll


# ----------------------------------------------------------------------
# 2. Сериализаторы для отображения опроса и результатов
# ----------------------------------------------------------------------

class PollDisplayChoiceSerializer(serializers.ModelSerializer):
    """
    Используется для отображения вариантов ответа с подсчетом голосов.
    """
    # Добавляем read_only поле для подсчета голосов
    vote_count = serializers.SerializerMethodField()

    class Meta:
        model = Choice
        fields = ('id', 'text', 'vote_count')
        # Все поля только для чтения в режиме отображения
        read_only_fields = ('id', 'text', 'vote_count')

    # Метод для подсчета голосов для каждого варианта
    def get_vote_count(self, obj):
        # obj здесь — это объект Choice. Используем related_name 'votes' из модели Vote.
        return obj.votes.count()


class PollDisplaySerializer(serializers.ModelSerializer):
    """
    Используется для отображения полного опроса, включая результаты и статус голосования пользователя.
    """
    # Вложенный сериализатор: отображаем варианты ответов с голосами
    choices = PollDisplayChoiceSerializer(many=True, read_only=True)

    # Флаг, указывающий, проголосовал ли текущий пользователь
    has_voted = serializers.SerializerMethodField()

    # Поле для отображения имени создателя
    creator_username = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = Poll
        fields = (
            'id',
            'creator',
            'creator_username',
            'title',
            'is_anonymous',
            'multiple_answers',
            'end_date',
            'created_at',
            'choices',
            'has_voted'
        )
        # Все поля только для чтения, так как это режим отображения/результатов
        read_only_fields = fields

        # Проверяем, проголосовал ли текущий пользователь

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # obj — это объект Poll. Проверяем, есть ли голоса от этого пользователя.
            return obj.votes.filter(user=request.user).exists()
        return False


# ----------------------------------------------------------------------
# 3. Сериализатор для записи голоса
# ----------------------------------------------------------------------

class VoteSerializer(serializers.ModelSerializer):
    """
    Используется для приема ID варианта ответа при голосовании.
    """
    # Принимаем только ID варианта ответа от клиента
    choice_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Vote
        fields = ('choice_id',)
        # user и poll будут установлены в представлении (view)
        # Не включаем поля user, poll и choice, так как они будут установлены в create()

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

        # Создаем голос. Уникальное ограничение unique_together в модели Vote
        # обеспечит невозможность проголосовать за одну и ту же опцию дважды
        # (или за любую опцию, если multiple_answers=False, это проверит View).
        try:
            return Vote.objects.create(user=user, poll=poll, choice=choice)
        except IntegrityError:
            # Это может произойти, если пользователь пытается проголосовать дважды
            # за один и тот же вариант или дважды в опросе без multiple_answers
            raise serializers.ValidationError({"error": "Вы уже проголосовали в этом опросе или выбрали этот вариант."})