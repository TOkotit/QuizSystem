# Django backend/polls/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Poll, Choice, Vote
from .serializers import (
    PollCreateSerializer,
    PollDetailSerializer,  # Создайте его, если нет: PollSerializer с Choices
    VoteSerializer
)


# --- 1. ВЬЮХА ДЛЯ СОЗДАНИЯ И СПИСКА ОПРОСОВ (/polls/api/list/) ---
class PollListCreateAPIView(generics.ListCreateAPIView):
    queryset = Poll.objects.filter(active=True).order_by('-pub_date')

    # При создании используем PollCreateSerializer (для приема choices)
    # При просмотре списка можем использовать PollDetailSerializer (для полной информации)
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PollCreateSerializer
        return PollDetailSerializer  # Предполагается, что вы создадите PollDetailSerializer

    def perform_create(self, serializer):
        # При создании опроса устанавливаем владельца
        # Предполагаем, что пользователь аутентифицирован (IsAuthenticated)
        if not self.request.user.is_authenticated:
            # Это произойдет, если разрешено IsAuthenticatedOrReadOnly, но пользователь пытается POST
            raise PermissionDenied("Требуется аутентификация для создания опроса.")

        serializer.save(owner=self.request.user)


# --- 2. ВЬЮХА ДЛЯ ДЕТАЛЕЙ, ОБНОВЛЕНИЯ И УДАЛЕНИЯ ОПРОСА (/polls/api/detail/<int:pk>/) ---
class PollRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Poll.objects.all()
    serializer_class = PollDetailSerializer  # Используем для GET/PUT/PATCH

    def get_permissions(self):
        # Разрешить изменение/удаление только владельцу
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [IsAuthenticated]  # Требуется аутентификация
        return super().get_permissions()

    def update(self, request, *args, **kwargs):
        # Дополнительная проверка, что обновляет только владелец
        poll = self.get_object()
        if poll.owner != request.user:
            return Response({"detail": "Вы не являетесь владельцем этого опроса."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    # ... аналогично для destroy


# --- 3. ВЬЮХА ДЛЯ ГОЛОСОВАНИЯ (/polls/api/<int:poll_id>/vote/) ---
class VoteCreateAPIView(generics.CreateAPIView):
    serializer_class = VoteSerializer
    permission_classes = [IsAuthenticated]  # Голосовать могут только аутентифицированные

    def perform_create(self, serializer):
        poll_id = self.kwargs.get('poll_id')
        poll = get_object_or_404(Poll, pk=poll_id)
        user = self.request.user

        # Проверка, что пользователь не голосовал (если опрос не multiple_answers)
        # Эта логика должна быть реализована в `VoteSerializer.validate`
        # или в модели `Poll.user_can_vote`

        # Передаем serializer'у необходимые поля: user и poll
        serializer.save(user=user, poll=poll)

        # Можно вернуть результаты голосования после успешного голоса
        # return Response(PollDetailSerializer(poll).data, status=status.HTTP_201_CREATED)