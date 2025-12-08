from django.contrib import admin
from django.urls import path, include, re_path
from .views import ReactAppView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/polls/', include('polls.api_urls')),
    re_path(r'^.*', ReactAppView.as_view(), name='react_app'),
]