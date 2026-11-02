"""Initial schema for the sign-data-collection research prototype.

Revision ID: 202611011200
Revises: 
Create Date: 2026-11-01 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = '202611011200'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('password', sa.Text(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )
    op.create_table(
        'login_sessions',
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('csrf', sa.String(), nullable=False),
        sa.Column('expires', sa.Integer(), nullable=False),
        sa.Column('oauth_state', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('token'),
    )
    op.create_table(
        'consents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('version', sa.String(), nullable=False),
        sa.Column('created', sa.String(), nullable=False),
        sa.Column('recording', sa.Boolean(), nullable=False),
        sa.Column('research', sa.Boolean(), nullable=False),
        sa.Column('avatar', sa.Boolean(), nullable=False),
        sa.Column('public', sa.Boolean(), nullable=False),
        sa.Column('withdrawn', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'prompts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )
    op.create_table(
        'prompt_versions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('prompt_id', sa.String(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('tamil', sa.Text(), nullable=False),
        sa.Column('english', sa.Text(), nullable=False),
        sa.Column('sinhala', sa.Text(), nullable=False, server_default=''),
        sa.Column('domain', sa.String(), nullable=False),
        sa.Column('semantics', sa.Text(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('exception_note', sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prompt_id', 'version'),
    )
    op.create_table(
        'batches',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('pilot', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'batch_prompts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), nullable=False),
        sa.Column('version_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id']),
        sa.ForeignKeyConstraint(['version_id'], ['prompt_versions.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_id', 'version_id'),
    )
    op.create_table(
        'assignments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_id', 'user_id'),
    )
    op.create_table(
        'recording_sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), nullable=False),
        sa.Column('consent_id', sa.String(), nullable=False),
        sa.Column('created', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id']),
        sa.ForeignKeyConstraint(['consent_id'], ['consents.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'takes',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('version_id', sa.String(), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('state', sa.String(), nullable=False),
        sa.Column('properties', sa.Text(), nullable=False),
        sa.Column('storage', sa.String(), nullable=False),
        sa.Column('file_ref', sa.String(), nullable=False),
        sa.Column('created', sa.String(), nullable=False),
        sa.Column('selected', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['recording_sessions.id']),
        sa.ForeignKeyConstraint(['version_id'], ['prompt_versions.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key'),
    )
    op.create_table(
        'annotations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('take_id', sa.String(), nullable=False),
        sa.Column('reviewer_id', sa.String(), nullable=False),
        sa.Column('data', sa.Text(), nullable=False),
        sa.Column('created', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id']),
        sa.ForeignKeyConstraint(['take_id'], ['takes.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'reviews',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('take_id', sa.String(), nullable=False),
        sa.Column('reviewer_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id']),
        sa.ForeignKeyConstraint(['take_id'], ['takes.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('actor', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('target', sa.String(), nullable=False),
        sa.Column('created', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'settings',
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('key'),
    )
    op.create_table(
        'schema_migrations',
        sa.Column('version', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('version'),
    )
    op.execute("INSERT INTO schema_migrations(version) VALUES (1)")


def downgrade() -> None:
    op.drop_table('schema_migrations')
    op.drop_table('settings')
    op.drop_table('audit_events')
    op.drop_table('reviews')
    op.drop_table('annotations')
    op.drop_table('takes')
    op.drop_table('recording_sessions')
    op.drop_table('assignments')
    op.drop_table('batch_prompts')
    op.drop_table('batches')
    op.drop_table('prompt_versions')
    op.drop_table('prompts')
    op.drop_table('consents')
    op.drop_table('login_sessions')
    op.drop_table('users')
