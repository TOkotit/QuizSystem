from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Poll, Test, TestAttempt
from .serializers import (
    PollCreateSerializer,
    PollDetailSerializer,
    VoteSerializer,
    TestSerializer,
    TestAttemptSerializer,
)


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
    permission_classes = [AllowAny]


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