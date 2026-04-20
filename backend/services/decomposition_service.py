from models import MicroTarefa


BASES_POR_CATEGORIA = {
    "estudo": {
        "simples": [
            "Definir foco da sessao",
            "Estudar o conteudo central",
            "Revisar os aprendizados",
        ],
        "medio": [
            "Separar material",
            "Revisar conteudo principal",
            "Praticar exercicios",
            "Registrar duvidas e resumo",
        ],
        "detalhista": [
            "Organizar material de apoio",
            "Ler o tema principal",
            "Destacar conceitos importantes",
            "Resolver exercicios guiados",
            "Resolver exercicios sozinho",
            "Anotar duvidas e revisao final",
        ],
    },
    "saude": {
        "simples": [
            "Preparar corpo e ambiente",
            "Executar atividade principal",
            "Encerrar com recuperacao",
        ],
        "medio": [
            "Preparar ambiente e materiais",
            "Fazer aquecimento",
            "Executar atividade principal",
            "Finalizar com recuperacao",
        ],
        "detalhista": [
            "Separar roupa e materiais",
            "Definir objetivo do treino",
            "Realizar aquecimento",
            "Executar bloco principal",
            "Registrar desempenho",
            "Alongar e recuperar",
        ],
    },
    "trabalho": {
        "simples": [
            "Definir resultado esperado",
            "Executar bloco principal",
            "Revisar e fechar pendencias",
        ],
        "medio": [
            "Definir objetivo da sessao",
            "Executar etapa principal",
            "Revisar o que foi feito",
            "Planejar proximo passo",
        ],
        "detalhista": [
            "Mapear objetivo e contexto",
            "Listar entregas esperadas",
            "Executar primeira etapa",
            "Executar segunda etapa",
            "Validar o resultado",
            "Planejar continuidade",
        ],
    },
    "geral": {
        "simples": [
            "Entender o objetivo",
            "Executar a acao principal",
            "Revisar o resultado",
        ],
        "medio": [
            "Entender o objetivo da tarefa",
            "Separar primeira acao",
            "Executar bloco principal",
            "Revisar resultado",
        ],
        "detalhista": [
            "Esclarecer objetivo final",
            "Separar recursos necessarios",
            "Executar primeira acao",
            "Executar segunda acao",
            "Checar qualidade do resultado",
            "Registrar proximo passo",
        ],
    },
}


def gerar_microtarefas(titulo, categoria, perfil_detalhamento, tempo_previsto):
    modelos = BASES_POR_CATEGORIA.get(categoria, BASES_POR_CATEGORIA["geral"])
    passos = modelos.get(perfil_detalhamento, modelos["medio"])
    duracao_por_bloco = max(round(tempo_previsto / len(passos), 2), 5)

    return [
        MicroTarefa(
            titulo=f"{passo}: {titulo}",
            ordem=indice,
            duracao_estimada=duracao_por_bloco,
            status="sugerida",
        )
        for indice, passo in enumerate(passos, start=1)
    ]
