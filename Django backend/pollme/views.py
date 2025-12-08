from django.views.generic import TemplateView
from django.urls import reverse

# Класс для отдачи главного index.html вашего React-приложения
class ReactAppView(TemplateView):
    template_name = 'index.html'