from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from django.db.models import Count
from django.contrib import messages
from .models import Poll, Choice, Vote
from .forms import PollAddForm, EditPollForm, ChoiceAddForm
from django.http import HttpResponse


try:
    from django.contrib.auth import get_user_model
    User = get_user_model()
    PLACEHOLDER_USER = User.objects.get(id=1) 
except Exception:
    # Если пользователя ID=1 нет, просто не запускайте код, пока не создадите его.
    pass


# Django backend/polls/views.py (Продолжение после заглушки)

def polls_list(request):
    all_polls = Poll.objects.all()
    search_term = ''
    if 'name' in request.GET:
        all_polls = all_polls.order_by('text')

    if 'date' in request.GET:
        all_polls = all_polls.order_by('pub_date')

    if 'vote' in request.GET:
        all_polls = all_polls.annotate(Count('vote')).order_by('vote__count')

    if 'search' in request.GET:
        search_term = request.GET['search']
        all_polls = all_polls.filter(text__icontains=search_term)

    paginator = Paginator(all_polls, 6)  # Show 6 contacts per page
    page = request.GET.get('page')
    polls = paginator.get_page(page)

    get_dict_copy = request.GET.copy()
    params = get_dict_copy.pop('page', True) and get_dict_copy.urlencode()

    context = {
        'polls': polls,
        'params': params,
        'search_term': search_term,
    }
    return render(request, 'polls/polls_list.html', context)


# ПОЛНОСТЬЮ ОТКРЫВАЕМ POLLS_ADD (Удалены: has_perm, else-ветка с ошибкой)
def polls_add(request):
    if request.method == 'POST':
        form = PollAddForm(request.POST)
        if form.is_valid:
            poll = form.save(commit=False)
            # Присваиваем заглушку вместо request.user
            poll.owner = PLACEHOLDER_USER
            poll.save()
            Choice(
                poll=poll, choice_text=form.cleaned_data['choice1']).save()
            Choice(
                poll=poll, choice_text=form.cleaned_data['choice2']).save()

            messages.success(
                request, "Poll & Choices added successfully.",
                extra_tags='alert alert-success alert-dismissible fade show')

            return redirect('polls:list')
    else:
        form = PollAddForm()

    context = {
        'form': form,
    }
    return render(request, 'polls/add_poll.html', context)


# УДАЛЕНА ПРОВЕРКА ВЛАДЕЛЬЦА (request.user != poll.owner)
def polls_edit(request, poll_id):
    poll = get_object_or_404(Poll, pk=poll_id)
    # Удалено: if request.user != poll.owner: return redirect('home')

    if request.method == 'POST':
        form = EditPollForm(request.POST, instance=poll)
        if form.is_valid:
            form.save()
            messages.success(request, "Poll Updated successfully.",
                             extra_tags='alert alert-success alert-dismissible fade show')
            return redirect("polls:list")

    else:
        form = EditPollForm(instance=poll)

    return render(request, "polls/poll_edit.html", {'form': form, 'poll': poll})


# УДАЛЕНА ПРОВЕРКА ВЛАДЕЛЬЦА
def polls_delete(request, poll_id):
    poll = get_object_or_404(Poll, pk=poll_id)
    # Удалено: if request.user != poll.owner: return redirect('home')
    poll.delete()
    messages.success(request, "Poll Deleted successfully.",
                     extra_tags='alert alert-success alert-dismissible fade show')
    return redirect("polls:list")


# УДАЛЕНА ПРОВЕРКА ВЛАДЕЛЬЦА
def add_choice(request, poll_id):
    poll = get_object_or_404(Poll, pk=poll_id)
    # Удалено: if request.user != poll.owner: return redirect('home')

    if request.method == 'POST':
        form = ChoiceAddForm(request.POST)
        if form.is_valid:
            new_choice = form.save(commit=False)
            new_choice.poll = poll
            new_choice.save()
            messages.success(
                request, "Choice added successfully.", extra_tags='alert alert-success alert-dismissible fade show')
            return redirect('polls:edit', poll.id)
    else:
        form = ChoiceAddForm()
    context = {
        'form': form,
    }
    return render(request, 'polls/add_choice.html', context)


# УДАЛЕНА ПРОВЕРКА ВЛАДЕЛЬЦА
def choice_edit(request, choice_id):
    choice = get_object_or_404(Choice, pk=choice_id)
    poll = get_object_or_404(Poll, pk=choice.poll.id)
    # Удалено: if request.user != poll.owner: return redirect('home')

    if request.method == 'POST':
        form = ChoiceAddForm(request.POST, instance=choice)
        if form.is_valid:
            new_choice = form.save(commit=False)
            new_choice.poll = poll
            new_choice.save()
            messages.success(
                request, "Choice Updated successfully.", extra_tags='alert alert-success alert-dismissible fade show')
            return redirect('polls:edit', poll.id)
    else:
        form = ChoiceAddForm(instance=choice)
    context = {
        'form': form,
        'edit_choice': True,
        'choice': choice,
    }
    return render(request, 'polls/add_choice.html', context)


# УДАЛЕНА ПРОВЕРКА ВЛАДЕЛЬЦА
def choice_delete(request, choice_id):
    choice = get_object_or_404(Choice, pk=choice_id)
    poll = get_object_or_404(Poll, pk=choice.poll.id)
    # Удалено: if request.user != poll.owner: return redirect('home')
    choice.delete()
    messages.success(
        request, "Choice Deleted successfully.", extra_tags='alert alert-success alert-dismissible fade show')
    return redirect('polls:edit', poll.id)


def poll_detail(request, poll_id):
    poll = get_object_or_404(Poll, id=poll_id)

    if not poll.active:
        return render(request, 'polls/poll_result.html', {'poll': poll})
    loop_count = poll.choice_set.count()
    context = {
        'poll': poll,
        'loop_time': range(0, loop_count),
    }
    return render(request, 'polls/poll_detail.html', context)


# ИСПРАВЛЯЕМ ФУНКЦИЮ ГОЛОСОВАНИЯ
def poll_vote(request, poll_id):
    poll = get_object_or_404(Poll, pk=poll_id)
    choice_id = request.POST.get('choice')

    # УДАЛЕНА ПРОВЕРКА: if not poll.user_can_vote(request.user):

    if choice_id:
        choice = Choice.objects.get(id=choice_id)
        # Присваиваем ЗАГЛУШКУ для записи голоса
        vote = Vote(user=PLACEHOLDER_USER, poll=poll, choice=choice)
        vote.save()
        print(vote)
        return render(request, 'polls/poll_result.html', {'poll': poll})
    else:
        messages.error(
            request, "No choice selected!", extra_tags='alert alert-warning alert-dismissible fade show')
        return redirect("polls:detail", poll_id)


# УДАЛЕНА ПРОВЕРКА ВЛАДЕЛЬЦА
def end_poll(request, poll_id):
    poll = get_object_or_404(Poll, pk=poll_id)
    # Удалено: if request.user != poll.owner: return redirect('home')

    if poll.active is True:
        poll.active = False
        poll.save()
        return render(request, 'polls/poll_result.html', {'poll': poll})
    else:
        return render(request, 'polls/poll_result.html', {'poll': poll})