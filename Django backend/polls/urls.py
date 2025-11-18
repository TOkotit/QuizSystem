from django.urls import path

from django.views.generic.base import RedirectView
from . import views



app_name = "polls"

urlpatterns = [
    path('api/polls/', PollListCreateAPIView.as_view(), name='poll-list-create'),

    path('api/polls/<int:id>/', PollRetrieveUpdateDestroyAPIView.as_view(), name='poll-detail'),
    path('api/polls/<int:poll_id>/vote/', views.VoteCreateAPIView.as_view(), name='poll-vote'),
]
