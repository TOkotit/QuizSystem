from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from django.db.models import Sum

class Poll(models.Model):
    owner = models.IntegerField(null=True, blank=True, verbose_name="ID создателя")
    title = models.TextField(verbose_name="Название опроса")
    pub_date = models.DateTimeField(default=timezone.now)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    is_anonymous = models.BooleanField(default=False, verbose_name="Анонимный опрос")
    multiple_answers = models.BooleanField(default=False, verbose_name="Множественный выбор")
    end_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата окончания")

    class Meta:
        db_table = 'polls'

    def __str__(self):
        return self.title

    @property
    def total_votes(self):
        return self.choices.aggregate(total=Sum('votes_count'))['total'] or 0

    def user_can_vote(self, user):
        if not user or not user.is_authenticated:
            return False
        if not self.multiple_answers:
            return not self.votes.filter(user=user).exists()
        return True

class Choice(models.Model):
    poll = models.ForeignKey(Poll, related_name='choices', on_delete=models.CASCADE)
    choice_text = models.CharField(max_length=255, verbose_name="Текст варианта")
    votes_count = models.IntegerField(default=0, verbose_name="Количество голосов (Кэш)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'choices'

    def __str__(self):
        return f"{self.poll.title[:25]} - {self.choice_text[:25]}"

class Vote(models.Model):
    poll = models.ForeignKey(Poll, related_name='votes', on_delete=models.CASCADE)
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'votes'

    def __str__(self):
        user_name = self.user.username if self.user else "Аноним"
        return f"{user_name} проголосовал в {self.poll.title}"

class Test(models.Model):
    owner = models.IntegerField(null=True, blank=True, verbose_name="ID создателя")
    title = models.TextField(verbose_name="Название теста")
    created_at = models.DateTimeField(auto_now_add=True)
    completion_time = models.IntegerField(null=True, blank=True, verbose_name="Время на прохождение (мин)")
    attempt_number = models.IntegerField(default=1, verbose_name="Кол-во попыток")
    end_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата и время окончания")

    class Meta:
        db_table = 'tests'

    def __str__(self):
        return self.title

class Task(models.Model):
    test = models.ForeignKey(Test, related_name='tasks', on_delete=models.CASCADE)
    question = models.TextField(verbose_name="Текст вопроса")
    task_type = models.CharField(
        max_length=20,
        choices=[('text', 'Текст'), ('single', 'Один выбор'), ('multiple', 'Много')],
        default='text'
    )
    score = models.IntegerField(default=1, verbose_name="Баллы за ответ")

    class Meta:
        db_table = 'tasks'

    def __str__(self):
        return f"{self.test.title} - {self.question[:30]}"

class TaskOption(models.Model):
    task = models.ForeignKey(Task, related_name='options', on_delete=models.CASCADE)
    text = models.CharField(max_length=255, verbose_name="Текст варианта")
    is_correct = models.BooleanField(default=False, verbose_name="Верный?")

    class Meta:
        db_table = 'task_options'

    def __str__(self):
        return self.text

class TestAttempt(models.Model):
    test = models.ForeignKey(Test, related_name='attempts', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    score_obtained = models.IntegerField(default=0, verbose_name="Набрано баллов")
    total_score = models.IntegerField(default=0, verbose_name="Всего в тесте")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'test_attempts'

class TaskAnswer(models.Model):
    attempt = models.ForeignKey(TestAttempt, related_name='answers', on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    answer_text = models.TextField(null=True, blank=True)
    selected_options = models.ManyToManyField(TaskOption, blank=True)

    class Meta:
        db_table = 'task_answers'