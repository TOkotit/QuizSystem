# Quiz система из уже готовых проектов на джанго
# Polls Project (Django + React)

## Структура
- `/Django backend` - Серверная часть и API.
- `/React frontend` - Клиентская часть с React Flow.

## Быстрый старт
## Вводить комманды в консоль по очереди

### 1. Backend
```
cd "Django backend"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend
```
cd "../React frontend"
npm install
npm run dev
```
