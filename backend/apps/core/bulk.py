"""Utilities for high-volume inserts without locking the request cycle."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import TypeVar

from django.db import transaction
from django.db.models import Model

T = TypeVar("T", bound=Model)


def bulk_create_chunked(
    model: type[T],
    objects: Sequence[T],
    *,
    chunk_size: int = 1000,
    ignore_conflicts: bool = False,
) -> int:
    """
    Insert large batches efficiently.
    Use for imports (étudiants, notes, inscriptions) — never one-by-one in a loop.
    """
    if not objects:
        return 0
    created = 0
    with transaction.atomic():
        for i in range(0, len(objects), chunk_size):
            chunk = list(objects[i : i + chunk_size])
            model.objects.bulk_create(chunk, ignore_conflicts=ignore_conflicts, batch_size=chunk_size)
            created += len(chunk)
    return created


def iter_queryset_in_batches(queryset, *, batch_size: int = 2000) -> Iterable[list]:
    """
    Stream a large queryset by primary key windows (safe for millions of rows).
    Prefer this over queryset.iterator() when you need list chunks for export jobs.
    """
    ordering = queryset.model._meta.pk.name
    qs = queryset.order_by(ordering)
    last_pk = None
    while True:
        batch_qs = qs
        if last_pk is not None:
            batch_qs = batch_qs.filter(**{f"{ordering}__gt": last_pk})
        batch = list(batch_qs[:batch_size])
        if not batch:
            break
        last_pk = getattr(batch[-1], ordering)
        yield batch
