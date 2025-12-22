# Django backend/polls/urls.py

from django.urls import path, re_path
from . import views  # Импортируем наши представления

urlpatterns = [
    # 0. Эндпоинт для установки CSRF Cookie (Фронтенд ожидает: /api/csrf/)
    path('csrf/', views.get_csrf, name='api_csrf_set'),

    # 1. Создание нового опроса (Фронтенд ожидает: /api/polls/create/)
    path('create/', views.PollListCreateAPIView.as_view(), name='poll-create'),

    # 2. Список активных опросов (GET: /api/polls/list/)
    path('list/', views.PollListCreateAPIView.as_view(), name='poll-list'),

    # 3. Детализация, Обновление, Удаление (GET, PUT, DELETE: /api/polls/{pk}/)
    path('<int:pk>/', views.PollRetrieveUpdateDestroyAPIView.as_view(), name='poll-detail-update'),

    # 4. Голосование (POST: /api/polls/{poll_id}/vote/)
    path('<int:poll_id>/vote/', views.VoteCreateAPIView.as_view(), name='poll-vote'),

    # 5. Главная страница (для отдачи index.html, если React и Django на одном домене)
    # re_path(r'^.*$', views.ReactAppView.as_view(), name='react-app'),
    # Этот эндпоинт лучше добавлять в корневой urls.py

    path('tests/', views.TestListCreateAPIView.as_view(), name='test-list-create'),
    path('tests/submit/', views.TestAttemptCreateAPIView.as_view(), name='test-submit'),
    path('tests/<int:pk>/', views.TestRetrieveUpdateDestroyAPIView.as_view(), name='test-detail'),
]