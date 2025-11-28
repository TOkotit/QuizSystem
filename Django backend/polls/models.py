from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# -----------------
# 1. Модель Опроса
# -----------------
class Poll(models.Model):
    """
    Модель для хранения основной информации об опросе.
    """
    # Связь с создателем. CASCADE: если пользователь удаляется, удаляются и его опросы.
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='polls', verbose_name='Создатель')

    title = models.CharField(max_length=255, verbose_name='Тема опроса')

    # Настройки
    is_anonymous = models.BooleanField(default=False, verbose_name='Анонимный опрос')
    multiple_answers = models.BooleanField(default=False, verbose_name='Разрешено несколько ответов')

    # Дата и время окончания (может быть пустым)
    end_date = models.DateTimeField(null=True, blank=True, verbose_name='Дата и время окончания')

    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Опрос'
        verbose_name_plural = 'Опросы'

    def __str__(self):
        return self.title


# -----------------
# 2. Модель Варианта ответа
# -----------------
class Choice(models.Model):
    """
    Вариант ответа, привязанный к конкретному опросу.
    """
    # Связь с опросом. CASCADE: если опрос удаляется, удаляются и его варианты.
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='choices', verbose_name='Опрос')

    text = models.CharField(max_length=255, verbose_name='Текст варианта')

    class Meta:
        verbose_name = 'Вариант ответа'
        verbose_name_plural = 'Варианты ответа'
        unique_together = ('poll', 'text')  # Уникальность текста в рамках одного опроса

    def __str__(self):
        return f'{self.poll.title[:20]} - {self.text}'


# -----------------
# 3. Модель Голоса
# -----------------
class Vote(models.Model):
    """
    Модель для записи голоса.
    """
    # Связь с опросом
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='votes', verbose_name='Опрос')

    # Связь с выбранным вариантом
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE, related_name='votes', verbose_name='Выбор')

    # Пользователь, который проголосовал
    # Это поле всегда заполняется, но используется в зависимости от is_anonymous.
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes', verbose_name='Голосующий')

    class Meta:
        verbose_name = 'Голос'
        verbose_name_plural = 'Голоса'
        # Защита от двойного голосования (если опрос не позволяет multiple_answers)
        # Уникальность пары (опрос, пользователь) гарантирует, что один пользователь
        # не проголосует дважды в одном опросе (если это не множественный выбор)
        unique_together = ('poll', 'user', 'choice')  # Пользователь может проголосовать за одну опцию только один раз

    def __str__(self):
        return f'Голос от {self.user.username} в опросе "{self.poll.title}"'