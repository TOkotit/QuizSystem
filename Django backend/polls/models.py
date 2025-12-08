from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from django.db.models import Sum
import secrets


class Poll(models.Model):
    # --- Оригинальные поля (для совместимости) ---
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Создатель")
    title = models.TextField(verbose_name="Название опроса")
    pub_date = models.DateTimeField(default=timezone.now)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    # --- НОВЫЕ ПОЛЯ ДЛЯ НАСТРОЕК ---
    is_anonymous = models.BooleanField(default=False, verbose_name="Анонимный опрос")
    multiple_answers = models.BooleanField(default=False, verbose_name="Множественный выбор")
    end_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата окончания")
    # --------------------------------------------

    def __str__(self):
        return self.title

    @property
    def total_votes(self):
        return self.choices.aggregate(total=Sum('votes_count'))['total'] or 0

    def user_can_vote(self, user):
        """
        Возвращает True, если пользователь может голосовать.
        В будущем здесь можно добавить проверку для multiple_answers.
        """
        if not user or not user.is_authenticated:
            return False
        if not self.multiple_answers:
            return not self.votes.filter(user=user).exists()
        return True


class Choice(models.Model):
    poll = models.ForeignKey(Poll, related_name='choices', on_delete=models.CASCADE)
    choice_text = models.CharField(max_length=255, verbose_name="Текст варианта") # Поле 'choice_text' возвращено
    votes_count = models.IntegerField(default=0, verbose_name="Количество голосов (Кэш)") # Новое поле
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.poll.text[:25]} - {self.choice_text[:25]}"


class Vote(models.Model):
    poll = models.ForeignKey(Poll, related_name='votes', on_delete=models.CASCADE)
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_name = self.user.username if self.user else "Аноним"
        return f"{user_name} voted in {self.poll.title}"

    class Meta:
        verbose_name = "Голос"
        verbose_name_plural = "Голоса"