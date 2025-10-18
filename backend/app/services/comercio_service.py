from app.models.produtos_model import Produto
from sqlalchemy.orm import joinedload

def get_produtos_de_comercio_por_id(db, comercio_id):
    """
    retorna lista de instância Produtos ( pertencentes a `comercio_id`)
    - db: sessão do SQLAlchemy 
    - comercio_id: int
    """
    q = (
        db.query(Produto)
        .options(
            joinedload(Produto.categoria),
            joinedload(Produto.fornecedor),
            joinedload(Produto.unidade_medida),
            joinedload(Produto.comercio),
        )
        .filter(Produto.comercio_id == comercio_id)
        .all()
    )

    return q