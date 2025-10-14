from alembic import op
import sqlalchemy as sa

revision = "manual_add_tag_to_produtos"
down_revision = "fc569d982454"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('produtos', sa.Column('tag', sa.String(length=100), nullable=True))

def downgrade():
    op.drop_column('produtos', 'tag')
