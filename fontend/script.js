const API_URL = "http://127.0.0.1:5000"

function classeCor(cor) {
    return cor ? `tone-${cor}` : "tone-amarelo"
}

function atualizarMetricas(tarefas) {
    document.getElementById("metric-total").textContent = tarefas.length
    document.getElementById("metric-alerta").textContent = tarefas.filter(t => t.cor_prioridade === "vermelho").length
    document.getElementById("metric-concluidas").textContent = tarefas.filter(t => t.status === "concluida").length
}

function criarBadge(texto, classeExtra = "") {
    const badge = document.createElement("span")
    badge.className = `badge ${classeExtra}`.trim()
    badge.textContent = texto
    return badge
}

function criarLinhaMeta(tarefa) {
    const linha = document.createElement("div")
    linha.className = "task-meta"
    linha.appendChild(criarBadge(`Categoria: ${tarefa.categoria ?? "geral"}`))
    linha.appendChild(criarBadge(`Prioridade: ${tarefa.prioridade ?? "media"}`))
    linha.appendChild(criarBadge(`Perfil: ${tarefa.perfil_detalhamento ?? "medio"}`))
    linha.appendChild(criarBadge(`Status: ${tarefa.status ?? "pendente"}`))
    if (tarefa.prazo) {
        linha.appendChild(criarBadge(`Prazo: ${tarefa.prazo}`))
    }
    return linha
}

function criarCabecalhoTarefa(tarefa) {
    const cabecalho = document.createElement("div")
    cabecalho.className = "task-head"

    const blocoTitulo = document.createElement("div")
    blocoTitulo.className = "task-title-block"

    const titulo = document.createElement("strong")
    titulo.textContent = tarefa.titulo
    blocoTitulo.appendChild(titulo)

    const resumo = document.createElement("p")
    resumo.textContent = `${tarefa.tempo_previsto ?? 0} min previstos • ${tarefa.percentual_conclusao ?? 0}% concluido`
    blocoTitulo.appendChild(resumo)

    cabecalho.appendChild(blocoTitulo)
    cabecalho.appendChild(criarBadge(tarefa.cor_prioridade ?? "amarelo", `${classeCor(tarefa.cor_prioridade)} badge-pill`))

    return cabecalho
}

function criarBarraProgresso(tarefa) {
    const wrapper = document.createElement("div")
    wrapper.className = "progress-wrapper"

    const label = document.createElement("div")
    label.className = "progress-label"
    label.textContent = `${tarefa.resumo_execucao.microtarefas_concluidas}/${tarefa.resumo_execucao.microtarefas_total} microtarefas concluidas`
    wrapper.appendChild(label)

    const trilho = document.createElement("div")
    trilho.className = "progress-track"

    const barra = document.createElement("div")
    barra.className = `progress-fill ${classeCor(tarefa.cor_prioridade)}`
    barra.style.width = `${tarefa.percentual_conclusao ?? 0}%`
    trilho.appendChild(barra)

    wrapper.appendChild(trilho)
    return wrapper
}

function criarAcaoMicrotarefa(micro) {
    const botao = document.createElement("button")
    botao.className = "ghost-button"
    botao.textContent = micro.status === "concluida" ? "Reabrir" : "Concluir"
    botao.onclick = async () => {
        await fetch(`${API_URL}/microtarefas/${micro.id}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                status: micro.status === "concluida" ? "pendente" : "concluida",
                feedback: micro.status === "concluida" ? "Reaberta pelo usuario" : "Concluida pelo usuario",
                tempo_real: micro.duracao_estimada ?? 0
            })
        })
        await carregar()
    }
    return botao
}

function renderizarMicrotarefas(tarefa) {
    const wrapper = document.createElement("div")
    wrapper.className = "micro-section"

    const subtitulo = document.createElement("p")
    subtitulo.className = "micro-heading"
    subtitulo.textContent = "Microtarefas sugeridas"
    wrapper.appendChild(subtitulo)

    const sublista = document.createElement("ul")
    sublista.className = "micro-list"

    tarefa.microtarefas.forEach(micro => {
        const item = document.createElement("li")
        item.className = micro.status === "concluida" ? "is-done" : ""

        const bloco = document.createElement("div")
        bloco.className = "micro-copy"

        const titulo = document.createElement("strong")
        titulo.textContent = micro.titulo
        bloco.appendChild(titulo)

        const detalhes = document.createElement("span")
        detalhes.textContent = `${micro.duracao_estimada ?? 0} min • ${micro.status ?? "pendente"}`
        bloco.appendChild(detalhes)

        item.appendChild(bloco)
        item.appendChild(criarAcaoMicrotarefa(micro))
        sublista.appendChild(item)
    })

    wrapper.appendChild(sublista)
    return wrapper
}

function renderizarTarefa(tarefa) {
    const li = document.createElement("li")
    li.className = `task-card ${classeCor(tarefa.cor_prioridade)}`

    li.appendChild(criarCabecalhoTarefa(tarefa))
    li.appendChild(criarLinhaMeta(tarefa))

    if (tarefa.descricao) {
        const descricao = document.createElement("p")
        descricao.className = "task-description"
        descricao.textContent = tarefa.descricao
        li.appendChild(descricao)
    }

    li.appendChild(criarBarraProgresso(tarefa))

    const historico = document.createElement("p")
    historico.className = "history-note"
    historico.textContent = `Aceitas: ${tarefa.resumo_historico.sugestoes_aceitas} • Rejeitadas: ${tarefa.resumo_historico.sugestoes_rejeitadas} • Perfil: ${tarefa.origem_perfil}`
    li.appendChild(historico)

    if (tarefa.microtarefas?.length) {
        li.appendChild(renderizarMicrotarefas(tarefa))
    }

    return li
}

async function carregar() {
    const res = await fetch(`${API_URL}/tarefas`)
    const dados = await res.json()

    atualizarMetricas(dados)

    const lista = document.getElementById("lista")
    lista.innerHTML = ""
    dados.forEach(tarefa => {
        lista.appendChild(renderizarTarefa(tarefa))
    })
}

async function criar() {
    const payload = {
        titulo: document.getElementById("titulo").value.trim(),
        descricao: document.getElementById("descricao").value.trim(),
        categoria: document.getElementById("categoria").value,
        prioridade: document.getElementById("prioridade").value,
        impacto: Number(document.getElementById("impacto").value),
        urgencia: Number(document.getElementById("urgencia").value),
        prazo: document.getElementById("prazo").value,
        perfil_detalhamento: document.getElementById("perfil").value
    }

    if (!payload.titulo) {
        return
    }

    await fetch(`${API_URL}/tarefas`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    })

    document.getElementById("titulo").value = ""
    document.getElementById("descricao").value = ""
    document.getElementById("categoria").value = ""
    document.getElementById("prioridade").value = "media"
    document.getElementById("impacto").value = "2"
    document.getElementById("urgencia").value = "2"
    document.getElementById("prazo").value = ""
    document.getElementById("perfil").value = ""

    await carregar()
}

carregar()
