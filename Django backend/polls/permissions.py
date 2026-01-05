from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # Сравниваем две строки (имя владельца и имя текущего юзера)
        return str(obj.owner) == str(request.user.username)