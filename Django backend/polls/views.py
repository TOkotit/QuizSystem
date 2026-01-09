from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db import transaction
from django.db.models import F

from .models import Choice, Poll, Test, TestAttempt, Vote
from .serializers import (
    PollCreateSerializer,
    PollDetailSerializer,
    VoteSerializer,
    TestSerializer,
    TestAttemptSerializer,
)

from .permissions import IsOwnerOrReadOnly
# --- CSRF ---
def set_csrf_cookie(request):
    get_token(request)
    return JsonResponse({"message": "CSRF cookie set"})


@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})


# --- POLLS ---
class PollListCreateAPIView(generics.ListCreateAPIView):
    queryset = Poll.objects.filter(active=True).order_by('-created_at')
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PollCreateSerializer
        return PollDetailSerializer

    def perform_create(self, serializer):
        # Берем owner из запроса, если его нет - Anonymous
        owner_name = self.request.data.get('owner', 'Anonymous')
        serializer.save(owner=owner_name)


class PollRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Poll.objects.all()
    serializer_class = PollDetailSerializer
    permission_classes = [IsOwnerOrReadOnly]


class VoteCreateAPIView(generics.CreateAPIView):
    serializer_class = VoteSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Просто передаем данные в сериализатор
        user_name = self.request.data.get('user', 'Anonymous')
        poll = get_object_or_404(Poll, id=self.kwargs.get('poll_id'))
        serializer.save(user=user_name, poll=poll)

    def create(self, request, *args, **kwargs):
        # Стандартное создание + возврат обновленного опроса
        response = super().create(request, *args, **kwargs)
        poll_id = self.kwargs.get('poll_id')
        updated_poll = Poll.objects.get(pk=poll_id)
        return Response(
            PollDetailSerializer(updated_poll, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

class VoteCancelAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, poll_id):
        # Получаем ID пользователя из тела запроса
        user_id = request.data.get('user')
        
        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Находим опрос
        poll = get_object_or_404(Poll, id=poll_id)

        # Находим все голоса этого пользователя в этом опросе
        votes = Vote.objects.filter(poll=poll, user=user_id)

        if not votes.exists():
            return Response({"message": "Голоса не найдены"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # Проходим по голосам, чтобы уменьшить счетчики
            for vote in votes:
                # Уменьшаем счетчик голосов у варианта (Choice)
                # Используем F expression для атомарности (защита от гонки потоков)
                Choice.objects.filter(id=vote.choice.id).update(votes_count=F('votes_count') - 1)
            
            # Удаляем записи о голосах
            votes.delete()

        # Возвращаем обновленные данные опроса, чтобы фронтенд сразу перерисовался
        return Response(
            PollDetailSerializer(poll, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

# --- TESTS ---
class TestListCreateAPIView(generics.ListCreateAPIView):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Принудительно пишем owner из body запроса
        owner_name = self.request.data.get('owner', 'Anonymous')
        serializer.save(owner=owner_name)


class TestRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [AllowAny]


class TestAttemptCreateAPIView(generics.CreateAPIView):
    queryset = TestAttempt.objects.all()
    serializer_class = TestAttemptSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        print("DEBUG: Данные попытки теста:", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("DEBUG: Ошибки валидации:", serializer.errors)
        return super().post(request, *args, **kwargs)