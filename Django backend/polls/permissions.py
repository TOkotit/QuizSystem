from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        client_user_id = request.headers.get('X-User-ID')

        if client_user_id:
            return str(obj.owner) == str(client_user_id)
        # Сравниваем две строки (имя владельца и имя текущего юзера)
        return str(obj.owner) == str(request.user.username)