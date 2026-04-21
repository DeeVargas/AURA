def _normalizar_nivel(valor, fallback):
    try:
        nivel = int(valor)
    except (TypeError, ValueError):
        nivel = fallback

    return max(1, min(nivel, 3))


def calcular_cor_prioridade(prioridade, urgencia, impacto, prazo):
    prioridade_normalizada = (prioridade or "media").lower()
    if prioridade_normalizada == "baixa":
        return "verde"

    urgencia_nivel = _normalizar_nivel(urgencia, 2)
    impacto_nivel = _normalizar_nivel(impacto, 2)

    score = urgencia_nivel + impacto_nivel
    if prioridade_normalizada == "alta":
        score += 1

    if prazo:
        score += 1

    if score >= 6:
        return "vermelho"
    if score >= 4:
        return "amarelo"
    return "verde"
