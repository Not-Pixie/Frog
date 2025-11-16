import secrets
import string

ALPHABET = string.ascii_letters + string.digits  # base62

def criar_link(length: int = 16) -> str:
    return ''.join(secrets.choice(ALPHABET) for _ in range(length))