from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Tarefa(Base):
    __tablename__ = "tarefas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String)
    descricao = Column(String, nullable=True)
    categoria = Column(String, default="geral")
    prioridade = Column(String, default="media")
    prazo = Column(String, nullable=True)
    tempo_previsto = Column(Float)
    hora = Column(Integer)
    status = Column(String, default="pendente")
    data_criacao = Column(String, nullable=True)
    impacto = Column(Integer, default=2)
    urgencia = Column(Integer, default=2)
    cor_prioridade = Column(String, default="amarelo")
    perfil_detalhamento = Column(String, default="medio")
    tempo_real = Column(Float, default=0)
    percentual_conclusao = Column(Float, default=0)
    origem_perfil = Column(String, default="manual")
    microtarefas = relationship(
        "MicroTarefa",
        back_populates="tarefa",
        cascade="all, delete-orphan"
    )
    historicos = relationship(
        "HistoricoInteracao",
        back_populates="tarefa",
        cascade="all, delete-orphan"
    )


class MicroTarefa(Base):
    __tablename__ = "microtarefas"

    id = Column(Integer, primary_key=True, index=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas.id"), nullable=False)
    titulo = Column(String, nullable=False)
    ordem = Column(Integer, nullable=False)
    duracao_estimada = Column(Float, default=15)
    status = Column(String, default="pendente")
    tempo_real = Column(Float, default=0)
    feedback = Column(String, nullable=True)
    data_conclusao = Column(String, nullable=True)

    tarefa = relationship("Tarefa", back_populates="microtarefas")
    historicos = relationship(
        "HistoricoInteracao",
        back_populates="microtarefa",
        cascade="all, delete-orphan"
    )


class HistoricoInteracao(Base):
    __tablename__ = "historicos_interacao"

    id = Column(Integer, primary_key=True, index=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas.id"), nullable=False)
    microtarefa_id = Column(Integer, ForeignKey("microtarefas.id"), nullable=True)
    acao = Column(String, nullable=False)
    origem = Column(String, default="sistema")
    observacao = Column(String, nullable=True)
    data_criacao = Column(String, nullable=False)

    tarefa = relationship("Tarefa", back_populates="historicos")
    microtarefa = relationship("MicroTarefa", back_populates="historicos")
