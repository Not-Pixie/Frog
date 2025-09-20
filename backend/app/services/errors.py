
class ServiceError(Exception):
    """Erro geral para a camada de services."""
    pass

class ComercioServiceError(ServiceError):
    """Erro específico para operações relacionadas a comercios."""
    pass
