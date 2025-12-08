from django.urls import path
from .api_views import PollCreateAPIView, VoteCreateAPIView, PollDetailAPIView

app_name = 'polls_api'

urlpatterns = [
    path('create/', PollCreateAPIView.as_view(), name='poll-create'),
    path('<int:poll_id>/', PollDetailAPIView.as_view(), name='poll-detail'),
    path('<int:poll_id>/vote/', VoteCreateAPIView.as_view(), name='poll-vote'),
]