from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./aura.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def _ensure_columns(connection, inspector, table_name, columns):
    if table_name not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    for column_name, column_type in columns.items():
        if column_name not in existing_columns:
            connection.execute(
                text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
            )


def initialize_database():
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    with engine.begin() as connection:
        _ensure_columns(connection, inspector, "tarefas", {
            "descricao": "TEXT",
            "categoria": "VARCHAR",
            "prioridade": "VARCHAR",
            "prazo": "VARCHAR",
            "status": "VARCHAR",
            "data_criacao": "VARCHAR",
            "impacto": "INTEGER DEFAULT 2",
            "urgencia": "INTEGER DEFAULT 2",
            "cor_prioridade": "VARCHAR DEFAULT 'amarelo'",
            "perfil_detalhamento": "VARCHAR DEFAULT 'medio'",
            "tempo_real": "FLOAT DEFAULT 0",
            "percentual_conclusao": "FLOAT DEFAULT 0",
            "origem_perfil": "VARCHAR DEFAULT 'manual'",
        })
        _ensure_columns(connection, inspector, "microtarefas", {
            "tempo_real": "FLOAT DEFAULT 0",
            "feedback": "VARCHAR",
            "data_conclusao": "VARCHAR",
        })
