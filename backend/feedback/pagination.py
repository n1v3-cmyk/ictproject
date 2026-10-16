"""DRF pagination using the contract's envelope: ``{count, next, previous, results}``."""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    # The frontend loads the working set with `page_size=1000`; allow exactly that.
    max_page_size = 1000
