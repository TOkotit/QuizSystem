# Django backend/polls/urls.py

from django.urls import path, re_path
from . import views  # Импортируем наши представления

urlpatterns = [
    # 0. CSRF (Доступен по: /api/csrf/)
    path('csrf/', views.get_csrf, name='api_csrf_set'),

    # 1. ОПРОСЫ (Polls) - Пути: /api/polls/...
    path('create/', views.PollListCreateAPIView.as_view(), name='poll-create'),
    path('list/', views.PollListCreateAPIView.as_view(), name='poll-list'),
    path('<int:pk>/', views.PollRetrieveUpdateDestroyAPIView.as_view(), name='poll-detail'),
    path('<int:poll_id>/vote/', views.VoteCreateAPIView.as_view(), name='poll-vote'),
    path('<int:poll_id>/unvote/', views.VoteCancelAPIView.as_view(), name='poll-unvote'),

    # 2. ТЕСТЫ (Tests) - Пути: /api/tests/...
    path('tests/', views.TestListCreateAPIView.as_view(), name='test-list-create'),
    path('tests/submit/', views.TestAttemptCreateAPIView.as_view(), name='test-submit'),
    path('tests/<int:pk>/', views.TestRetrieveUpdateDestroyAPIView.as_view(), name='test-detail'),
]