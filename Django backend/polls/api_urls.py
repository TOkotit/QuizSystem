from django.urls import path
from .api_views import PollCreateAPIView, VoteCreateAPIView, PollDetailAPIView, PollListAPIView
from .views import get_csrf


app_name = 'polls_api'

urlpatterns = [
    path('create/', PollCreateAPIView.as_view(), name='poll-create'),
    path('<int:poll_id>/', PollDetailAPIView.as_view(), name='poll-detail'),
    path('<int:poll_id>/vote/', VoteCreateAPIView.as_view(), name='poll-vote'),
    path('list/', PollListAPIView.as_view(), name='poll-list'),
    path("csrf/", get_csrf, name="get-csrf"),
]