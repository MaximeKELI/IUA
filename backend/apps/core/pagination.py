from rest_framework.pagination import CursorPagination, PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Offset pagination for small/medium collections (admin UI filters)."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class LargeResultSetPagination(CursorPagination):
    """
    Cursor pagination for tables that can grow to millions of rows.
    Avoids expensive OFFSET scans (COUNT + skip N).
    """

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200
    ordering = ("-created_at", "-id")
    cursor_query_param = "cursor"


class NotificationPagination(CursorPagination):
    page_size = 30
    page_size_query_param = "page_size"
    max_page_size = 100
    ordering = ("-created_at", "-id")
    cursor_query_param = "cursor"


class EnrollmentPagination(CursorPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200
    ordering = ("-created_at", "-id")
    cursor_query_param = "cursor"


class StudentPagination(CursorPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200
    ordering = ("student_number", "id")
    cursor_query_param = "cursor"
