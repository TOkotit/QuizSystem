from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView
from django.utils.decorators import method_decorator
from django.db import transaction
from django.utils import timezone
from django.middleware.csrf import get_token

from .models import Poll, Choice, Vote, Test, Task, TestAttempt
from .serializers import (
    PollCreateSerializer,
    PollDetailSerializer,
    VoteSerializer,
    TestSerializer,
    TestAttemptSerializer,
)
from .permissions import IsOwnerOrReadOnly  # Убедись, что этот файл существует


# --- 0. CSRF Эндпоинты ---

def set_csrf_cookie(request):
    """Установка CSRF-токена через простой вызов"""
    get_token(request)
    return JsonResponse({"message": "CSRF cookie set"}, status=200)


@ensure_csrf_cookie
def get_csrf(request):
    """Явный вызов для получения CSRF куки фронтендом"""
    return JsonResponse({"detail": "CSRF cookie set"})


# --- 1. ПРЕДСТАВЛЕНИЯ ДЛЯ ОПРОСОВ (POLLS) ---

class PollListCreateAPIView(generics.ListCreateAPIView):
    queryset = Poll.objects.filter(active=True).order_by('-created_at')
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PollCreateSerializer
        return PollDetailSerializer

    def perform_create(self, serializer):
        # Если пользователь не авторизован, записываем None (для анонимных опросов)
        owner = self.request.user if self.request.user.is_authenticated else None
        # В твоей модели Poll поле owner может быть IntegerField, проверь совместимость:
        if owner:
            serializer.save(owner=owner.id)
        else:
            serializer.save(owner=None)


class PollRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Poll.objects.all()
    serializer_class = PollDetailSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        poll = self.get_object()
        # Проверка по ID, так как в модели owner — IntegerField
        if poll.owner != request.user.id:
            return Response({"detail": "Вы не являетесь владельцем этого опроса."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        poll = self.get_object()
        if poll.owner != request.user.id:
            return Response({"detail": "Вы не являетесь владельцем этого опроса."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class VoteCreateAPIView(generics.CreateAPIView):
    serializer_class = VoteSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        poll_id = self.kwargs.get('poll_id')
        poll = get_object_or_404(Poll, pk=poll_id)
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user, poll=poll)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # Возвращаем обновленные данные опроса после голоса
        poll_id = self.kwargs.get('poll_id')
        updated_poll = Poll.objects.get(pk=poll_id)
        return Response(
            PollDetailSerializer(updated_poll, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


# --- 2. ПРЕДСТАВЛЕНИЯ ДЛЯ ТЕСТОВ (TESTS) ---

class TestListCreateAPIView(generics.ListCreateAPIView):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [AllowAny]  # Измени на IsAuthenticated, если тесты только для своих

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(owner=user)


class TestRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [IsOwnerOrReadOnly]


class TestAttemptCreateAPIView(generics.CreateAPIView):
    """Эндпоинт завершения теста: получает ответы и считает баллы"""
    serializer_class = TestAttemptSerializer
    permission_classes = [AllowAny]  # Разрешаем анонимно, если нужно

    @transaction.atomic
    def perform_create(self, serializer):
        test_id = self.request.data.get('test')
        test = get_object_or_404(Test, id=test_id)
        answers_data = self.request.data.get('answers', [])

        total_score = 0
        obtained_score = 0

        # Создаем попытку
        user = self.request.user if self.request.user.is_authenticated else None
        attempt = serializer.save(user=user, test=test)

        for ans in answers_data:
            try:
                task = Task.objects.get(id=ans['task'])
                total_score += task.score

                # Логика проверки текстового ответа
                if task.type == 'text':
                    user_ans = str(ans.get('answer_text', '')).strip().lower()
                    corr_ans = str(task.correct_text).strip().lower()
                    if user_ans == corr_ans:
                        obtained_score += task.score

                # Здесь можно расширить логику для типов single/multiple
            except Task.DoesNotExist:
                continue

        attempt.total_score = total_score
        attempt.score_obtained = obtained_score
        attempt.completed_at = timezone.now()
        attempt.save()


# --- 3. ДОПОЛНИТЕЛЬНО ---

@method_decorator(ensure_csrf_cookie, name='dispatch')
class ReactAppView(TemplateView):
    template_name = "index.html"