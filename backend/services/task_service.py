import datetime

from modelo import prever
from models import MicroTarefa, Tarefa
from services.decomposition_service import gerar_microtarefas
from services.history_service import registrar_interacao, resumir_historico_por_tarefa
from services.prioritization_service import calcular_cor_prioridade
from services.profile_service import resolver_perfil


def detectar_categoria(titulo):
    titulo_normalizado = titulo.lower()

    if "estudar" in titulo_normalizado:
        return "estudo"
    if "treinar" in titulo_normalizado:
        return "saude"
    if "trabalhar" in titulo_normalizado:
        return "trabalho"
    return "geral"


def calcular_ajuste_por_categoria(titulo):
    titulo_normalizado = titulo.lower()
    ajuste = 0

    if "estudar" in titulo_normalizado:
        ajuste += 15
    if "treinar" in titulo_normalizado:
        ajuste += 25
    if "trabalhar" in titulo_normalizado:
        ajuste += 40

    return ajuste


def calcular_tempo_previsto(titulo, hora):
    tamanho = len(titulo.split())
    entrada = hora + (tamanho * 10)
    ajuste = calcular_ajuste_por_categoria(titulo)
    return max(round(prever(entrada) + ajuste, 2), 15)


def atualizar_progresso_tarefa(tarefa):
    total_microtarefas = len(tarefa.microtarefas)
    concluidas = sum(1 for micro in tarefa.microtarefas if micro.status == "concluida")
    percentual = round((concluidas / total_microtarefas) * 100, 2) if total_microtarefas else 0
    tarefa.percentual_conclusao = percentual

    if total_microtarefas and concluidas == total_microtarefas:
        tarefa.status = "concluida"
    elif concluidas > 0:
        tarefa.status = "em_progresso"
    else:
        tarefa.status = tarefa.status or "pendente"


def serializar_microtarefa(microtarefa):
    return {
        "id": microtarefa.id,
        "titulo": microtarefa.titulo,
        "ordem": microtarefa.ordem,
        "duracao_estimada": microtarefa.duracao_estimada,
        "status": microtarefa.status,
        "tempo_real": microtarefa.tempo_real,
        "feedback": microtarefa.feedback,
        "data_conclusao": microtarefa.data_conclusao,
    }


def serializar_tarefa(tarefa):
    historico = resumir_historico_por_tarefa(tarefa)
    concluidas = sum(1 for micro in tarefa.microtarefas if micro.status == "concluida")

    return {
        "id": tarefa.id,
        "titulo": tarefa.titulo,
        "descricao": tarefa.descricao,
        "categoria": tarefa.categoria or detectar_categoria(tarefa.titulo),
        "prioridade": tarefa.prioridade or "media",
        "prazo": tarefa.prazo,
        "tempo_previsto": tarefa.tempo_previsto,
        "hora": tarefa.hora,
        "status": tarefa.status or "pendente",
        "data_criacao": tarefa.data_criacao,
        "impacto": tarefa.impacto or 2,
        "urgencia": tarefa.urgencia or 2,
        "cor_prioridade": tarefa.cor_prioridade or "amarelo",
        "perfil_detalhamento": tarefa.perfil_detalhamento or "medio",
        "tempo_real": tarefa.tempo_real or 0,
        "percentual_conclusao": tarefa.percentual_conclusao or 0,
        "origem_perfil": tarefa.origem_perfil or "manual",
        "resumo_execucao": {
            "microtarefas_total": len(tarefa.microtarefas),
            "microtarefas_concluidas": concluidas,
        },
        "resumo_historico": historico,
        "microtarefas": [
            serializar_microtarefa(microtarefa)
            for microtarefa in sorted(tarefa.microtarefas, key=lambda item: item.ordem)
        ],
    }


def listar_tarefas(db):
    tarefas = db.query(Tarefa).all()
    return [serializar_tarefa(tarefa) for tarefa in tarefas]


def buscar_tarefa(db, tarefa_id):
    return db.query(Tarefa).filter(Tarefa.id == tarefa_id).first()


def buscar_microtarefa(db, microtarefa_id):
    return db.query(MicroTarefa).filter(MicroTarefa.id == microtarefa_id).first()


def criar_tarefa(db, data):
    titulo = (data.get("titulo") or "").strip()
    if not titulo:
        raise ValueError("O titulo da tarefa e obrigatorio")

    hora = datetime.datetime.now().hour
    categoria = data.get("categoria") or detectar_categoria(titulo)
    prioridade = (data.get("prioridade") or "media").lower()
    impacto = max(1, min(int(data.get("impacto", 2)), 3))
    urgencia = max(1, min(int(data.get("urgencia", 2)), 3))
    perfil_detalhamento, origem_perfil = resolver_perfil(db, data.get("perfil_detalhamento"))
    tempo_previsto = calcular_tempo_previsto(titulo, hora)
    cor_prioridade = calcular_cor_prioridade(prioridade, urgencia, impacto, data.get("prazo"))

    tarefa = Tarefa(
        titulo=titulo,
        descricao=data.get("descricao"),
        categoria=categoria,
        prioridade=prioridade,
        prazo=data.get("prazo"),
        tempo_previsto=tempo_previsto,
        hora=hora,
        status=data.get("status", "pendente"),
        data_criacao=datetime.datetime.now().isoformat(timespec="seconds"),
        impacto=impacto,
        urgencia=urgencia,
        cor_prioridade=cor_prioridade,
        perfil_detalhamento=perfil_detalhamento,
        tempo_real=0,
        percentual_conclusao=0,
        origem_perfil=origem_perfil,
    )

    for microtarefa in gerar_microtarefas(titulo, categoria, perfil_detalhamento, tempo_previsto):
        tarefa.microtarefas.append(microtarefa)

    db.add(tarefa)
    db.flush()
    registrar_interacao(
        db,
        tarefa.id,
        "tarefa_criada",
        origem="usuario",
        observacao=f"Perfil aplicado: {perfil_detalhamento}",
    )
    db.commit()
    db.refresh(tarefa)
    return serializar_tarefa(tarefa)


def atualizar_tarefa(db, tarefa_id, data):
    tarefa = buscar_tarefa(db, tarefa_id)
    if not tarefa:
        return None

    if "prioridade" in data:
        tarefa.prioridade = data["prioridade"]
    if "prazo" in data:
        tarefa.prazo = data["prazo"]
    if "impacto" in data:
        tarefa.impacto = max(1, min(int(data["impacto"]), 3))
    if "urgencia" in data:
        tarefa.urgencia = max(1, min(int(data["urgencia"]), 3))
    if "status" in data:
        tarefa.status = data["status"]

    tarefa.cor_prioridade = calcular_cor_prioridade(
        tarefa.prioridade,
        tarefa.urgencia,
        tarefa.impacto,
        tarefa.prazo,
    )
    registrar_interacao(db, tarefa.id, "tarefa_atualizada", origem="usuario")
    db.commit()
    db.refresh(tarefa)
    return serializar_tarefa(tarefa)


def atualizar_microtarefa(db, microtarefa_id, data):
    microtarefa = buscar_microtarefa(db, microtarefa_id)
    if not microtarefa:
        return None

    novo_status = data.get("status", microtarefa.status)
    microtarefa.status = novo_status
    microtarefa.feedback = data.get("feedback", microtarefa.feedback)
    microtarefa.tempo_real = float(data.get("tempo_real", microtarefa.tempo_real or 0))

    if novo_status == "concluida":
        microtarefa.data_conclusao = datetime.datetime.now().isoformat(timespec="seconds")
        acao = "microtarefa_concluida"
    elif novo_status == "ignorada":
        acao = "microtarefa_ignorada"
    else:
        acao = "microtarefa_atualizada"

    tarefa = microtarefa.tarefa
    tarefa.tempo_real = sum(item.tempo_real or 0 for item in tarefa.microtarefas)
    atualizar_progresso_tarefa(tarefa)
    registrar_interacao(
        db,
        tarefa.id,
        acao,
        origem="usuario",
        observacao=microtarefa.feedback,
        microtarefa_id=microtarefa.id,
    )

    db.commit()
    db.refresh(tarefa)
    return serializar_tarefa(tarefa)
