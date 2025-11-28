from django.contrib import admin
from .models import Poll, Choice, Vote
# Убедитесь, что модели Poll, Choice и Vote корректно импортированы
# В моделях нет created_at/updated_at для Choice и Vote, поэтому они удалены из list_display.

# ----------------------------------------------------
# Настройка для вариантов ответа (Choice)
# ----------------------------------------------------
class ChoiceAdmin(admin.ModelAdmin):
    # ИСПРАВЛЕНИЕ: 'choice_text' заменено на 'text'.
    # Удалены несуществующие поля 'created_at' и 'updated_at'.
    list_display = (
        'text',    # Соответствует models.Choice.text
        'poll',    # Опрос, к которому относится
        # Если нужно количество голосов, добавьте сюда метод, подсчитывающий голоса
    )


# ----------------------------------------------------
# Настройка для опросов (Poll)
# ----------------------------------------------------
class PollAdmin(admin.ModelAdmin):
    # ИСПРАВЛЕНИЕ:
    # 'question_text' -> 'title',
    # 'owner' -> 'creator',
    # 'pub_date' -> 'created_at',
    # 'is_active' удалено, т.к. нет в модели
    list_display = (
        'title',          # Соответствует models.Poll.title
        'creator',        # Соответствует models.Poll.creator
        'created_at',     # Соответствует models.Poll.created_at
        'is_anonymous',   # Есть в модели
        'multiple_answers', # Есть в модели
    )

    # ИСПРАВЛЕНИЕ: list_filter должен содержать только существующие поля
    list_filter = (
        'is_anonymous',
        'multiple_answers',
        'created_at',
    )

    # ИСПРАВЛЕНИЕ: date_hierarchy ссылается на существующее поле 'created_at'
    date_hierarchy = 'created_at'


# ----------------------------------------------------
# Настройка для голосов (Vote)
# ----------------------------------------------------
class VoteAdmin(admin.ModelAdmin):
    # ИСПРАВЛЕНИЕ: удалено несуществующее поле 'created_at'
    list_display = (
        'poll',
        'choice',
        'user',
    )


# Регистрация моделей:
admin.site.register(Poll, PollAdmin)
admin.site.register(Choice, ChoiceAdmin)
admin.site.register(Vote, VoteAdmin)