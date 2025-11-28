from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PollViewSet, VoteCreateAPIView

# Создаем роутер и регистрируем наш PollViewSet
router = DefaultRouter()
# Регистрация PollViewSet. Базовый URL будет 'polls/'
router.register(r'polls', PollViewSet, basename='poll')

# Определение URL-маршрутов для нашего приложения polls
urlpatterns = [
    # Маршруты, сгенерированные PollViewSet (CRUD для опросов)
    # Например: /api/polls/, /api/polls/{id}/
    path('', include(router.urls)),

    # Специальный маршрут для голосования
    # URL: /api/polls/{poll_pk}/vote/
    # Используем <int:poll_pk> для передачи ID опроса во VoteCreateAPIView
    path('polls/<int:poll_pk>/vote/', VoteCreateAPIView.as_view(), name='poll-vote'),
]