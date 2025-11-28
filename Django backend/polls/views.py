from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Poll, Choice, Vote
from .serializers import (
    PollCreateSerializer,
    PollDisplaySerializer,
    VoteSerializer
)


# ----------------------------------------------------------------------
# Разрешения (Permissions)
# ----------------------------------------------------------------------

class IsCreatorOrReadOnly(permissions.BasePermission):
    """
    Разрешает доступ на чтение всем, но на изменение/удаление — только создателю.
    """

    def has_object_permission(self, request, view, obj):
        # Разрешение на чтение (GET, HEAD, OPTIONS) разрешено всем
        if request.method in permissions.SAFE_METHODS:
            return True

        # Разрешение на запись (PUT, PATCH, DELETE) разрешено только создателю
        return obj.creator == request.user


# ----------------------------------------------------------------------
# 1. ViewSet для управления опросами (Polls)
# ----------------------------------------------------------------------

class PollViewSet(viewsets.ModelViewSet):
    """
    Предоставляет API для создания, просмотра, обновления и удаления опросов.
    """
    # По умолчанию отображаем все опросы
    queryset = Poll.objects.all().order_by('-created_at')

    # Устанавливаем разные сериализаторы для разных действий
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PollCreateSerializer
        return PollDisplaySerializer

    # Устанавливаем разные разрешения для разных действий
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            # Создавать и просматривать могут только аутентифицированные
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Изменять и удалять может только создатель
            self.permission_classes = [IsCreatorOrReadOnly]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in self.permission_classes]

    # Автоматически устанавливаем creator при создании опроса
    def perform_create(self, serializer):
        # Проверяем, что end_date не в прошлом
        end_date = serializer.validated_data.get('end_date')
        if end_date and end_date < timezone.now():
            raise serializers.ValidationError({"end_date": "Дата окончания не может быть в прошлом."})

        serializer.save(creator=self.request.user)


# ----------------------------------------------------------------------
# 2. View для голосования (Votes)
# ----------------------------------------------------------------------

class VoteCreateAPIView(APIView):
    """
    API для записи голоса в конкретном опросе.
    URL: /api/polls/{poll_id}/vote/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, poll_pk):
        # 1. Получаем опрос
        poll = get_object_or_404(Poll, pk=poll_pk)
        user = request.user

        # 2. Проверяем, не закончился ли опрос
        if poll.end_date and poll.end_date < timezone.now():
            return Response(
                {"detail": "Этот опрос уже завершен."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Проверяем, голосовал ли пользователь ранее в этом опросе
        has_voted_previously = Vote.objects.filter(poll=poll, user=user).exists()

        # 4. Если опрос не позволяет несколько ответов и пользователь уже голосовал, запрещаем
        if has_voted_previously and not poll.multiple_answers:
            return Response(
                {"detail": "Вы уже проголосовали в этом опросе и множественный выбор не разрешен."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Используем VoteSerializer для валидации данных и создания голоса
        # NOTE: VoteSerializer ожидает {'choice_id': N}
        serializer = VoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 6. Создаем голос, передавая в метод create() сериализатора poll и user
        try:
            serializer.save(user=user, poll=poll)
            return Response(
                {"detail": "Голос успешно записан."},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            # Сюда попадем, если возникнет IntegrityError (например, при двойном голосовании за одну опцию)
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )