import os, uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from sqlalchemy import create_engine, event, inspect, text, String, Text, ForeignKey, UniqueConstraint, Boolean, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

ROOT = Path(os.environ.get('DATA_DIR', './private-data')).resolve()
ROOT.mkdir(parents=True, exist_ok=True)


def normalize_database_url(raw_url: str | None) -> str:
    url = (raw_url or f'sqlite:///{ROOT}/research.sqlite3').strip().strip('"').strip("'")
    if url.startswith('sqlite'):
        return url
    parsed = urlsplit(url)
    if parsed.scheme not in {'postgresql', 'postgresql+psycopg'}:
        return url
    params = dict(parse_qsl(parsed.query, keep_blank_values=True))
    params.setdefault('sslmode', os.environ.get('PGSSLMODE', 'require'))
    return urlunsplit(parsed._replace(query=urlencode(params)))


URL = normalize_database_url(os.environ.get('DATABASE_URL'))
engine_kwargs = {'pool_pre_ping': True, 'pool_recycle': 1800, 'future': True}
if URL.startswith('sqlite'):
    engine_kwargs['connect_args'] = {'check_same_thread': False}
    engine = create_engine(URL, **engine_kwargs)

    @event.listens_for(engine, 'connect')
    def pragmas(conn, _):
        conn.execute('PRAGMA foreign_keys=ON')
        conn.execute('PRAGMA journal_mode=WAL')
else:
    engine_kwargs['connect_args'] = {'sslmode': os.environ.get('PGSSLMODE', 'require')}
    pool_size = int(os.environ.get('DB_POOL_SIZE', '5'))
    max_overflow = int(os.environ.get('DB_MAX_OVERFLOW', '10'))
    engine_kwargs['pool_size'] = pool_size
    engine_kwargs['max_overflow'] = max_overflow
    engine_kwargs['pool_timeout'] = 30
    engine = create_engine(URL, **engine_kwargs)

Session = sessionmaker(engine, expire_on_commit=False, autoflush=False)
def uid(): return str(uuid.uuid4())
def now(): return datetime.now(timezone.utc).isoformat()
class Base(DeclarativeBase): pass
class User(Base):
    __tablename__='users'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    code: Mapped[str] = mapped_column(String, unique=True)
    password: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
class Login(Base):
    __tablename__='login_sessions'
    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    csrf: Mapped[str] = mapped_column(String)
    expires: Mapped[int] = mapped_column(Integer)
    oauth_state: Mapped[str|None] = mapped_column(String, nullable=True)
class Consent(Base):
    __tablename__='consents'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    version: Mapped[str] = mapped_column(String, default='1.0')
    created: Mapped[str] = mapped_column(String, default=now)
    recording: Mapped[bool] = mapped_column(Boolean)
    research: Mapped[bool] = mapped_column(Boolean)
    avatar: Mapped[bool] = mapped_column(Boolean)
    public: Mapped[bool] = mapped_column(Boolean)
    withdrawn: Mapped[bool] = mapped_column(Boolean, default=False)
class Prompt(Base):
    __tablename__='prompts'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    code: Mapped[str] = mapped_column(String, unique=True)
class Version(Base):
    __tablename__='prompt_versions'
    __table_args__=(UniqueConstraint('prompt_id','version'),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    prompt_id: Mapped[str] = mapped_column(ForeignKey('prompts.id'))
    version: Mapped[int] = mapped_column(Integer)
    tamil: Mapped[str] = mapped_column(Text)
    english: Mapped[str] = mapped_column(Text, default='')
    sinhala: Mapped[str] = mapped_column(Text, default='')
    domain: Mapped[str] = mapped_column(String)
    semantics: Mapped[str] = mapped_column(Text, default='{}')
    status: Mapped[str] = mapped_column(String, default='draft')
    exception_note: Mapped[str] = mapped_column(Text, default='')
class Batch(Base):
    __tablename__='batches'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String)
    pilot: Mapped[bool] = mapped_column(Boolean, default=False)
class BatchPrompt(Base):
    __tablename__='batch_prompts'
    __table_args__=(UniqueConstraint('batch_id','version_id'),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    batch_id: Mapped[str] = mapped_column(ForeignKey('batches.id'))
    version_id: Mapped[str] = mapped_column(ForeignKey('prompt_versions.id'))
class Assignment(Base):
    __tablename__='assignments'
    __table_args__=(UniqueConstraint('batch_id','user_id'),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    batch_id: Mapped[str] = mapped_column(ForeignKey('batches.id'))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
class RecordingSession(Base):
    __tablename__='recording_sessions'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    batch_id: Mapped[str] = mapped_column(ForeignKey('batches.id'))
    consent_id: Mapped[str] = mapped_column(ForeignKey('consents.id'))
    created: Mapped[str] = mapped_column(String, default=now)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
class Take(Base):
    __tablename__='takes'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    session_id: Mapped[str] = mapped_column(ForeignKey('recording_sessions.id'))
    version_id: Mapped[str] = mapped_column(ForeignKey('prompt_versions.id'))
    key: Mapped[str] = mapped_column(String, unique=True)
    state: Mapped[str] = mapped_column(String, default='pending')
    properties: Mapped[str] = mapped_column(Text, default='{}')
    storage: Mapped[str] = mapped_column(String, default='local')
    file_ref: Mapped[str] = mapped_column(String, default='')
    created: Mapped[str] = mapped_column(String, default=now)
    selected: Mapped[bool] = mapped_column(Boolean, default=False)
class Annotation(Base):
    __tablename__='annotations'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    take_id: Mapped[str] = mapped_column(ForeignKey('takes.id'))
    reviewer_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    data: Mapped[str] = mapped_column(Text)
    created: Mapped[str] = mapped_column(String, default=now)
class Review(Base):
    __tablename__='reviews'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    take_id: Mapped[str] = mapped_column(ForeignKey('takes.id'))
    reviewer_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    role: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    created: Mapped[str] = mapped_column(String, default=now)
class Audit(Base):
    __tablename__='audit_events'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    actor: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    target: Mapped[str] = mapped_column(String)
    created: Mapped[str] = mapped_column(String, default=now)
class Setting(Base):
    __tablename__='settings'
    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(Text)
class Migration(Base):
    __tablename__='schema_migrations'
    version: Mapped[int] = mapped_column(Integer, primary_key=True)

def migrate():
    Base.metadata.create_all(engine)
    columns = {column['name'] for column in inspect(engine).get_columns('recording_sessions')}
    if 'completed' not in columns:
        with engine.begin() as connection:
            connection.execute(text('ALTER TABLE recording_sessions ADD COLUMN completed BOOLEAN NOT NULL DEFAULT FALSE'))
    pv_columns = {column['name'] for column in inspect(engine).get_columns('prompt_versions')}
    if 'sinhala' not in pv_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE prompt_versions ADD COLUMN sinhala TEXT NOT NULL DEFAULT ''"))
    with Session.begin() as db:
        if not db.get(Migration,1): db.add(Migration(version=1))
