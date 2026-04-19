import datetime

from models import HistoricoInteracao


def registrar_interacao(db, tarefa_id, acao, origem="sistema", observacao=None, microtarefa_id=None):
    historico = HistoricoInteracao(
        tarefa_id=tarefa_id,
        microtarefa_id=microtarefa_id,
        acao=acao,
        origem=origem,
        observacao=observacao,
        data_criacao=datetime.datetime.now().isoformat(timespec="seconds"),
    )
    db.add(historico)
    return historico


def resumir_historico_por_tarefa(tarefa):
    sugestoes_aceitas = 0
    sugestoes_rejeitadas = 0

    for historico in tarefa.historicos:
        if historico.acao in {"microtarefa_concluida", "sugestao_aceita"}:
            sugestoes_aceitas += 1
        if historico.acao in {"microtarefa_ignorada", "sugestao_rejeitada"}:
            sugestoes_rejeitadas += 1

    return {
        "interacoes": len(tarefa.historicos),
        "sugestoes_aceitas": sugestoes_aceitas,
        "sugestoes_rejeitadas": sugestoes_rejeitadas,
    }
