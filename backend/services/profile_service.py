from models import MicroTarefa


def detectar_perfil_por_historico(db):
    microtarefas = db.query(MicroTarefa).all()
    if not microtarefas:
        return "medio", "manual"

    concluidas = [micro for micro in microtarefas if micro.status == "concluida"]
    if not concluidas:
        return "medio", "historico"

    tempo_medio = sum(micro.duracao_estimada or 0 for micro in concluidas) / len(concluidas)

    if tempo_medio <= 10:
        return "detalhista", "historico"
    if tempo_medio <= 20:
        return "medio", "historico"
    return "simples", "historico"


def resolver_perfil(db, perfil_solicitado):
    if perfil_solicitado in {"simples", "medio", "detalhista"}:
        return perfil_solicitado, "manual"

    return detectar_perfil_por_historico(db)
