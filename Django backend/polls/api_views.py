# Django backend/polls/api_views.py

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .serializers import PollCreateSerializer, VoteSerializer,  PollDetailSerializer
from .models import Poll, Choice
from django.db.models import F


# View для создания нового опроса
class PollCreateAPIView(generics.CreateAPIView):
    serializer_class = PollCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class PollListAPIView(generics.ListAPIView):
    """
    Возвращает список активных опросов.
    """
    queryset = Poll.objects.filter(active=True).order_by('-pub_date')
    serializer_class = PollDetailSerializer
    permission_classes = [AllowAny]

class PollDetailAPIView(generics.RetrieveAPIView):
    """
    Возвращает детали опроса (включая результаты) по ID.
    GET /api/polls/<id>/
    """
    queryset = Poll.objects.all()
    serializer_class = PollDetailSerializer
    permission_classes = [AllowAny] # Разрешаем просмотр всем (или IsAuthenticated)
    lookup_field = 'pk'
    lookup_url_kwarg = 'poll_id'


class VoteCreateAPIView(generics.CreateAPIView):
    serializer_class = VoteSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        poll_id = self.kwargs.get('poll_id')

        try:
            poll = Poll.objects.get(pk=poll_id)
        except Poll.DoesNotExist:
            return Response({"detail": "Опрос не найден."}, status=status.HTTP_404_NOT_FOUND)

        # Проверяем права на голосование
        if not poll.user_can_vote(request.user) and not poll.multiple_answers:
            return Response({"detail": "Вы уже проголосовали в этом опросе."}, status=status.HTTP_403_FORBIDDEN)

        # Стандартная валидация сериализатора (choice_id)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Сохраняем голос. Обратите внимание: в VoteSerializer.create нужно будет
        # добавить логику инкремента choice.votes_count (см. пункт ниже про важность логики)
        serializer.save(user=request.user, poll=poll)

        # Обновляем счетчик в модели Choice (это критично для производительности)
        # Мы берем choice из validated_data, но так как VoteSerializer.create сложный,
        # проще сделать это прямо тут или убедиться что Vote.save() это делает.
        # Самый простой вариант - инкремент здесь, если он не сделан в сериализаторе:
        choice_id = serializer.validated_data['choice_id']
        from .models import Choice
        Choice.objects.filter(id=choice_id).update(votes_count=models.F('votes_count') + 1)

        # --- ГЛАВНОЕ ИЗМЕНЕНИЕ ---
        # Возвращаем ОБНОВЛЕННЫЙ опрос, чтобы фронт перерисовал проценты
        updated_poll = Poll.objects.get(pk=poll_id)
        result_serializer = PollDetailSerializer(updated_poll)

        return Response(result_serializer.data, status=status.HTTP_201_CREATED)