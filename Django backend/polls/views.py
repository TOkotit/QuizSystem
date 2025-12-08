# polls/views.py

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView
from django.utils.decorators import method_decorator

from .models import Poll, Choice, Vote
from .serializers import (
    PollCreateSerializer,
    PollDetailSerializer,
    VoteSerializer
)
from django.middleware.csrf import get_token


def set_csrf_cookie(request):
    """
    Простое представление, которое Django вызывает, чтобы установить
    CSRF-токен в куках при обращении к нему.
    """
    # Вызов get_token(request) гарантирует, что кука будет установлена
    # Если вы используете Django REST Framework, вам может потребоваться
    # декоратор @ensure_csrf_cookie, но для простого view достаточно этого.
    get_token(request)
    # Возвращаем пустой ответ или JSON-успех
    return JsonResponse({"message": "CSRF cookie set"}, status=200)

# --- 0. CSRF Эндпоинт (Требуется фронтендом) ---
@ensure_csrf_cookie
def get_csrf(request):
    """Возвращает JSON-ответ, заставляя Django установить cookie 'csrftoken'."""
    # Фронтенд (usePollsApi.js) явно вызывает этот эндпоинт
    return JsonResponse({"detail": "CSRF cookie set"})


# --- 1. СОЗДАНИЕ и СПИСОК ОПРОСОВ (/api/polls/list/ и /api/polls/create/) ---
class PollListCreateAPIView(generics.ListCreateAPIView):
    # По умолчанию отображаем только активные опросы, сортируем по дате создания
    queryset = Poll.objects.filter(active=True).order_by('-created_at')
    permission_classes = [AllowAny]  # Требуется аутентификация для создания

    def get_serializer_class(self):
        # POST-запрос (Создание) использует PollCreateSerializer для обработки choices
        if self.request.method == 'POST':
            return PollCreateSerializer
        # GET-запрос (Список) использует PollDetailSerializer для полной информации
        return PollDetailSerializer

    def perform_create(self, serializer):
        owner = self.request.user if self.request.user.is_authenticated else None
        serializer.save(owner=owner)


# --- 2. ДЕТАЛИЗАЦИЯ, ОБНОВЛЕНИЕ, УДАЛЕНИЕ ОПРОСА (/api/polls/{pk}/) ---
class PollRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Poll.objects.all()
    serializer_class = PollDetailSerializer

    def get_permissions(self):
        # GET (Retrieve) разрешен всем
        if self.request.method == 'GET':
            return [AllowAny()]
        # PUT/PATCH/DELETE (Update/Destroy) разрешен только аутентифицированным
        return [IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        # Дополнительная проверка: только владелец может редактировать
        poll = self.get_object()
        if poll.owner != request.user:
            return Response({"detail": "Вы не являетесь владельцем этого опроса."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Дополнительная проверка: только владелец может удалять
        poll = self.get_object()
        if poll.owner != request.user:
            return Response({"detail": "Вы не являетесь владельцем этого опроса."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


# --- 3. ГОЛОСОВАНИЕ (/api/polls/{poll_id}/vote/) ---
class VoteCreateAPIView(generics.CreateAPIView):
    # Используем CreateAPIView, так как это создание новой записи (Голоса)
    serializer_class = VoteSerializer
    permission_classes = [AllowAny]  # Разрешаем голосовать всем (для анонимных опросов)

    def perform_create(self, serializer):
        poll_id = self.kwargs.get('poll_id')
        poll = get_object_or_404(Poll, pk=poll_id)

        # Получаем пользователя: если аутентифицирован, то request.user, иначе None
        user = self.request.user if self.request.user.is_authenticated else None

        # Передаем serializer'у необходимые поля: user, poll и choice_id из тела запроса
        # choice_id уже присутствует в serializer.validated_data

        # ⚠️ Важно: serializer.save() вызовет логику создания и обновления кэша голосов
        serializer.save(user=user, poll=poll)

        # Фронтенд ожидает, что после успешного голосования он получит ОБНОВЛЕННЫЕ ДАННЫЕ ОПРОСА.
        # Возвращаем детали опроса с новыми результатами.
        updated_poll = Poll.objects.get(pk=poll_id)
        return Response(PollDetailSerializer(updated_poll, context=self.get_serializer_context()).data,
                        status=status.HTTP_201_CREATED)


# --- (Необязательно для API, но полезно для настройки React) ---
@method_decorator(ensure_csrf_cookie, name='dispatch')
class ReactAppView(TemplateView):
    template_name = "index.html"  # Используется для отдачи вашего React-приложения