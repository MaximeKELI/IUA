from .base import *  # noqa: F403

DEBUG = True

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"


def _redis_reachable(url: str) -> bool:
    try:
        import socket
        from urllib.parse import urlparse

        parsed = urlparse(url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 6379
        with socket.create_connection((host, port), timeout=0.4):
            return True
    except OSError:
        return False


# Dev: Redis if up, else locmem so login throttling never 500s when Redis is down.
_dev_redis = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")  # noqa: F405
if _redis_reachable(_dev_redis):
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": _dev_redis,
            "KEY_PREFIX": "iua",
            "TIMEOUT": 60,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "iua-dev",
            "TIMEOUT": 60,
        }
    }
