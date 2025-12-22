from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from django.db.models import Sum
import secrets


class Poll(models.Model):
    # --- Оригинальные поля (для совместимости) ---
    owner = models.IntegerField(null=True, blank=True, verbose_name="ID создателя")
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

# ------------------------- Модели для тестов -------------------------
class Test(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Создатель")
    title = models.CharField(max_length=255, verbose_name="Название теста")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    # Настройки из TestSettingsContent.jsx
    completion_time = models.PositiveIntegerField(null=True, blank=True, verbose_name="Время на прохождение (мин)")
    attempt_number = models.PositiveIntegerField(default=1, verbose_name="Количество попыток")
    end_date = models.DateTimeField(null=True, blank=True, verbose_name="Пройти до (дедлайн)")

    active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Task(models.Model):
    TASK_TYPES = [
        ('text', 'Текстовый ответ'),
        ('single', 'Одиночный выбор'),
        ('multiple', 'Множественный выбор'),
    ]

    test = models.ForeignKey(Test, related_name='tasks', on_delete=models.CASCADE)
    question = models.TextField(verbose_name="Текст вопроса")
    type = models.CharField(max_length=20, choices=TASK_TYPES, default='text', verbose_name="Тип задания")
    score = models.IntegerField(default=1, verbose_name="Баллы за ответ")

    # Поле для хранения правильного текстового ответа (для типа 'text')
    correct_text = models.TextField(null=True, blank=True, verbose_name="Правильный текстовый ответ")

    # Для порядка заданий
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.test.title} - {self.question[:30]}"


class TaskOption(models.Model):
    """Варианты ответов для типов single и multiple"""
    task = models.ForeignKey(Task, related_name='options', on_delete=models.CASCADE)
    text = models.CharField(max_length=255, verbose_name="Текст варианта")
    is_correct = models.BooleanField(default=False, verbose_name="Это правильный ответ")

    def __str__(self):
        return self.text


class TestAttempt(models.Model):
    """Результаты прохождения теста пользователем (из TestDisplayContent.jsx)"""
    test = models.ForeignKey(Test, related_name='attempts', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score_obtained = models.IntegerField(default=0, verbose_name="Набрано баллов")
    total_score = models.IntegerField(default=0, verbose_name="Всего баллов в тесте")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.test.title} ({self.score_obtained}/{self.total_score})"


class TaskAnswer(models.Model):
    """Сохраненные ответы пользователя внутри попытки"""
    attempt = models.ForeignKey(TestAttempt, related_name='answers', on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    # Ответ может быть текстом или ссылкой на выбранные варианты
    answer_text = models.TextField(null=True, blank=True)
    selected_options = models.ManyToManyField(TaskOption, blank=True)

    def __str__(self):
        return f"Ответ на {self.task.id} в попытке {self.attempt.id}"