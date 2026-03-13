from rest_framework import serializers
from core.models import Book, Borrow

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = "__all__"

class BorrowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Borrow
        fields = "__all__"
