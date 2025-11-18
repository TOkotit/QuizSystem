# Django backend/polls/views.py

from rest_framework import generics
from .models import Poll, Choice
from .serializers import PollSerializer, ChoiceSerializer


# 1. API для списка опросов и создания нового
# GET (список), POST (создание)
class PollListCreateAPIView(generics.ListCreateAPIView):
    queryset = Poll.objects.all().order_by('-pub_date')
    serializer_class = PollSerializer


# 2. API для деталей опроса и голосования
# GET (детали), PUT/PATCH (обновление)
class PollRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Poll.objects.all()
    serializer_class = PollSerializer
    lookup_field = 'id'  # Ищем по полю 'id'

class VoteCreateAPIView(APIView):
    # Пока заглушка: будет принимать Choice ID и User ID и сохранять Vote
    def post(self, request, *args, **kwargs):
        return Response({"message": "Vote endpoint reached (needs implementation)"}, status=status.HTTP_200_OK)

# 3. API для голосования (кастомный эндпойнт, не требуется, если делаем через PATCH)
# (Пока оставим так, а голосование можно будет реализовать через PATCH в PollRetrieveUpdateDestroyAPIView)