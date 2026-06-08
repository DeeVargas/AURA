const API_URL = "http://127.0.0.1:5000"
const STATUS_SUGERIDA = "sugerida"
const STATUS_ACEITA = "aceita"
const STATUS_REJEITADA = "rejeitada"
const STATUS_CONCLUIDA = "concluida"
const STORAGE_USER_KEY = "aura_user"

function classeCor(cor) {
    return cor ? `tone-${cor}` : "tone-amarelo"
}

function normalizarStatusMicro(status) {
    if (!status || status === "pendente") {
        return STATUS_SUGERIDA
    }
    return status
}

function rotuloStatusMicro(status) {
    const statusNormalizado = normalizarStatusMicro(status)
    if (statusNormalizado === STATUS_ACEITA) return "Aceita"
    if (statusNormalizado === STATUS_REJEITADA) return "Rejeitada"
    if (statusNormalizado === STATUS_CONCLUIDA) return "Concluida"
    return "Sugerida"
}

function classeStatusMicro(status) {
    return `status-${normalizarStatusMicro(status)}`
}

function obterUsuarioAtual() {
    const bruto = window.localStorage.getItem(STORAGE_USER_KEY)
    return bruto ? JSON.parse(bruto) : null
}

function salvarUsuario(usuario) {
    window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuario))
}

function limparUsuario() {
    window.localStorage.removeItem(STORAGE_USER_KEY)
}

function cabecalhosApi() {
    const usuario = obterUsuarioAtual()
    return {
        "Content-Type": "application/json",
        "X-User-Id": String(usuario?.id ?? "")
    }
}

function mostrarFeedbackAuth(mensagem, tipo = "info") {
    const feedback = document.getElementById("auth-feedback")
    feedback.textContent = mensagem
    feedback.className = `auth-feedback is-visible type-${tipo}`
}

function limparFeedbackAuth() {
    const feedback = document.getElementById("auth-feedback")
    feedback.textContent = ""
    feedback.className = "auth-feedback"
}

function alternarAbaAuth(modo) {
    const loginForm = document.getElementById("login-form")
    const registerForm = document.getElementById("register-form")
    const loginTab = document.getElementById("tab-login")
    const registerTab = document.getElementById("tab-register")

    const modoLogin = modo === "login"
    loginForm.classList.toggle("is-hidden", !modoLogin)
    registerForm.classList.toggle("is-hidden", modoLogin)
    loginTab.classList.toggle("is-active", modoLogin)
    registerTab.classList.toggle("is-active", !modoLogin)
    limparFeedbackAuth()
}

function atualizarSessaoVisual() {
    const usuario = obterUsuarioAtual()
    const authScreen = document.getElementById("auth-screen")
    const appScreen = document.getElementById("app-screen")

    if (!usuario) {
        authScreen.classList.remove("is-hidden")
        appScreen.classList.add("is-hidden")
        return
    }

    authScreen.classList.add("is-hidden")
    appScreen.classList.remove("is-hidden")
    document.getElementById("profile-initial").textContent = (usuario.nome?.[0] || "A").toUpperCase()
    document.getElementById("profile-name").textContent = usuario.nome
    document.getElementById("profile-email").textContent = usuario.email
}

function atualizarMetricas(tarefas) {
    const nota = document.getElementById("hero-note")
    if (!tarefas.length) {
        nota.textContent = "Crie sua primeira tarefa para ver o ritmo da semana."
        return
    }

    const concluidas = tarefas.filter(t => t.status === "concluida").length
    const emAndamento = tarefas.filter(t => t.status === "em_progresso").length
    const pendentes = tarefas.filter(t => t.status === "pendente").length
    nota.textContent = `${pendentes} tarefas pendentes, ${emAndamento} em andamento e ${concluidas} concluidas.`
}

function criarBadge(texto, classeExtra = "") {
    const badge = document.createElement("span")
    badge.className = `badge ${classeExtra}`.trim()
    badge.textContent = texto
    return badge
}

function esconderPainelIA() {
    const panel = document.getElementById("ai-assist-panel")
    const text = document.getElementById("ai-assist-text")
    const list = document.getElementById("ai-assist-microtasks")
    panel.classList.add("is-hidden")
    text.textContent = ""
    list.innerHTML = ""
}

function mostrarPainelIA(sugestao, microtasks = []) {
    const panel = document.getElementById("ai-assist-panel")
    const title = document.getElementById("ai-assist-title")
    const text = document.getElementById("ai-assist-text")
    const list = document.getElementById("ai-assist-microtasks")

    title.textContent = "Sugestao da AURA"
    text.textContent = sugestao
    list.innerHTML = ""

    microtasks.slice(0, 3).forEach(item => {
        const li = document.createElement("li")
        li.textContent = item.titulo
        list.appendChild(li)
    })

    panel.classList.remove("is-hidden")
}

async function solicitarSugestaoAI(tarefaId) {
    const resposta = await fetch(`${API_URL}/api/ai/suggest`, {
        method: "POST",
        headers: cabecalhosApi(),
        body: JSON.stringify({tarefa_id: tarefaId})
    })
    if (!resposta.ok) {
        return null
    }
    return resposta.json()
}

async function solicitarMicrotasksAI(tarefaId) {
    const resposta = await fetch(`${API_URL}/api/ai/microtasks`, {
        method: "POST",
        headers: cabecalhosApi(),
        body: JSON.stringify({tarefa_id: tarefaId})
    })
    if (!resposta.ok) {
        return null
    }
    return resposta.json()
}

async function atualizarMemoriaAI(tarefaId, evento, observacao = "") {
    await fetch(`${API_URL}/api/ai/update-memory`, {
        method: "POST",
        headers: cabecalhosApi(),
        body: JSON.stringify({
            tarefa_id: tarefaId,
            evento,
            observacao
        })
    })
}

async function recarregarMantendoScroll() {
    const posicaoScroll = window.scrollY
    await carregar()
    window.scrollTo({top: posicaoScroll, behavior: "auto"})
}

async function concluirTarefa(tarefa) {
    const resposta = await fetch(`${API_URL}/tarefas/${tarefa.id}`, {
        method: "PATCH",
        headers: cabecalhosApi(),
        body: JSON.stringify({status: STATUS_CONCLUIDA})
    })

    if (!resposta.ok) {
        window.alert("Nao foi possivel concluir a tarefa.")
        return
    }

    await atualizarMemoriaAI(tarefa.id, "tarefa_concluida", "Conclusao manual da tarefa")

    await recarregarMantendoScroll()
}

async function deletarTarefa(tarefa) {
    const confirmou = window.confirm(`Deseja deletar a tarefa "${tarefa.titulo}"?`)
    if (!confirmou) {
        return
    }

    const resposta = await fetch(`${API_URL}/tarefas/${tarefa.id}`, {
        method: "DELETE",
        headers: {
            "X-User-Id": String(obterUsuarioAtual()?.id ?? "")
        }
    })

    if (!resposta.ok) {
        window.alert("Nao foi possivel deletar a tarefa.")
        return
    }

    await recarregarMantendoScroll()
}

function criarLinhaMeta(tarefa) {
    const linha = document.createElement("div")
    linha.className = "task-meta"
    linha.appendChild(criarBadge(`Categoria: ${tarefa.categoria ?? "geral"}`))
    linha.appendChild(criarBadge(`Prioridade: ${tarefa.prioridade ?? "media"}`))
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
    resumo.textContent = `${tarefa.percentual_conclusao ?? 0}% concluido`
    blocoTitulo.appendChild(resumo)

    cabecalho.appendChild(blocoTitulo)

    const ladoDireito = document.createElement("div")
    ladoDireito.className = "task-head-actions"
    ladoDireito.appendChild(criarBadge(tarefa.cor_prioridade ?? "amarelo", `${classeCor(tarefa.cor_prioridade)} badge-pill`))

    // AI badge placeholder (will be populated asynchronously)
    const aiBadge = criarBadge("AURA: ...", "ai-badge badge-pill")
    aiBadge.style.minWidth = "92px"
    ladoDireito.appendChild(aiBadge)
    // Fire-and-forget update of AI badge
    updateAIBadge(tarefa, aiBadge)
    cabecalho.appendChild(ladoDireito)
    return cabecalho
}


async function updateAIBadge(tarefa, badgeElement) {
    try {
        const resposta = await solicitarSugestaoAI(tarefa.id)
        if (!resposta) {
            badgeElement.textContent = "AURA: -"
            return
        }

        const risco = resposta.risco_atraso || "medio"
        const confianca = resposta.confianca != null ? Math.round(resposta.confianca * 100) : null
        const texto = `AURA: ${risco.toUpperCase()}${confianca ? ` (${confianca}%)` : ""}`
        badgeElement.textContent = texto

        // color mapping for quick visual
        if (risco === "alto") {
            badgeElement.className = `badge ai-badge tone-vermelho badge-pill`
        } else if (risco === "medio") {
            badgeElement.className = `badge ai-badge tone-amarelo badge-pill`
        } else {
            badgeElement.className = `badge ai-badge tone-verde badge-pill`
        }
    } catch (err) {
        badgeElement.textContent = "AURA: -"
    }
}

async function atualizarPrazoTarefa(tarefa, prazo) {
    const resposta = await fetch(`${API_URL}/tarefas/${tarefa.id}`, {
        method: "PATCH",
        headers: cabecalhosApi(),
        body: JSON.stringify({prazo})
    })

    if (!resposta.ok) {
        window.alert("Nao foi possivel atualizar o prazo da tarefa.")
        return false
    }

    await recarregarMantendoScroll()
    return true
}

function criarEditorPrazo(tarefa) {
    const form = document.createElement("form")
    form.className = "task-deadline-editor"

    const label = document.createElement("label")
    label.htmlFor = `prazo-tarefa-${tarefa.id}`
    label.textContent = "Alterar prazo"
    form.appendChild(label)

    const campos = document.createElement("div")
    campos.className = "task-deadline-fields"

    const input = document.createElement("input")
    input.id = `prazo-tarefa-${tarefa.id}`
    input.type = "date"
    input.value = tarefa.prazo ?? ""
    campos.appendChild(input)

    const botaoSalvar = criarBotaoAcao("Salvar prazo", "ghost-button action-update-deadline", async () => {
        await atualizarPrazoTarefa(tarefa, input.value)
    })
    botaoSalvar.type = "submit"
    campos.appendChild(botaoSalvar)

    const botaoLimpar = criarBotaoAcao("Remover prazo", "ghost-button", async () => {
        input.value = ""
        await atualizarPrazoTarefa(tarefa, "")
    })
    campos.appendChild(botaoLimpar)

    form.appendChild(campos)
    form.onsubmit = async event => {
        event.preventDefault()
        await atualizarPrazoTarefa(tarefa, input.value)
    }

    return form
}

function criarBarraProgresso(tarefa) {
    const wrapper = document.createElement("div")
    wrapper.className = "progress-wrapper"

    const aceitas = tarefa.resumo_execucao.microtarefas_aceitas ?? 0
    const concluidas = tarefa.resumo_execucao.microtarefas_concluidas ?? 0
    const sugeridas = tarefa.resumo_execucao.microtarefas_sugeridas ?? 0

    const label = document.createElement("div")
    label.className = "progress-label"
    if (aceitas + concluidas === 0) {
        label.textContent = "Nenhuma microtarefa aceita ainda"
    } else {
        label.textContent = `${concluidas}/${aceitas + concluidas} microtarefas em execucao concluidas`
    }
    wrapper.appendChild(label)

    const trilho = document.createElement("div")
    trilho.className = "progress-track"

    const barra = document.createElement("div")
    barra.className = `progress-fill ${classeCor(tarefa.cor_prioridade)}`
    barra.style.width = `${tarefa.percentual_conclusao ?? 0}%`
    trilho.appendChild(barra)
    wrapper.appendChild(trilho)

    const resumo = document.createElement("div")
    resumo.className = "progress-summary"
    resumo.appendChild(criarBadge(`${aceitas} aceitas`, "badge-summary"))
    resumo.appendChild(criarBadge(`${sugeridas} aguardando decisao`, "badge-summary"))
    wrapper.appendChild(resumo)

    return wrapper
}

async function atualizarMicrotarefa(micro, status, feedback, tempoReal = micro.tempo_real ?? 0) {
    const resposta = await fetch(`${API_URL}/microtarefas/${micro.id}`, {
        method: "PATCH",
        headers: cabecalhosApi(),
        body: JSON.stringify({
            status,
            feedback,
            tempo_real: tempoReal
        })
    })

    if (!resposta.ok) {
        window.alert("Nao foi possivel atualizar a microtarefa.")
        return
    }

    const tarefaAtualizada = await resposta.json()
    if (status === STATUS_CONCLUIDA && tarefaAtualizada?.id) {
        await atualizarMemoriaAI(tarefaAtualizada.id, "microtarefa_concluida", feedback || "Microtarefa concluida")
    }

    await recarregarMantendoScroll()
}

function criarBotaoAcao(texto, classe, onClick) {
    const botao = document.createElement("button")
    botao.type = "button"
    botao.className = classe
    botao.textContent = texto
    botao.onclick = onClick
    return botao
}

function criarAcoesMicrotarefa(micro) {
    const status = normalizarStatusMicro(micro.status)
    const acoes = document.createElement("div")
    acoes.className = "micro-actions"

    if (status === STATUS_SUGERIDA) {
        acoes.appendChild(criarBotaoAcao("Aceitar", "ghost-button action-accept", async () => {
            await atualizarMicrotarefa(micro, STATUS_ACEITA, "Sugestao aceita pelo usuario")
        }))
        acoes.appendChild(criarBotaoAcao("Rejeitar", "ghost-button action-reject", async () => {
            await atualizarMicrotarefa(micro, STATUS_REJEITADA, "Sugestao rejeitada pelo usuário", 0)
        }))
        return acoes
    }

    if (status === STATUS_ACEITA) {
        acoes.appendChild(criarBotaoAcao("Concluir", "ghost-button action-complete", async () => {
            await atualizarMicrotarefa(micro, STATUS_CONCLUIDA, "Microtarefa concluída pelo usuário", micro.duracao_estimada ?? 0)
        }))
        acoes.appendChild(criarBotaoAcao("Rejeitar", "ghost-button action-reject", async () => {
            await atualizarMicrotarefa(micro, STATUS_REJEITADA, "Microtarefa removida do plano pelo usuário", 0)
        }))
        return acoes
    }

    if (status === STATUS_CONCLUIDA) {
        acoes.appendChild(criarBotaoAcao("Reabrir", "ghost-button", async () => {
            await atualizarMicrotarefa(micro, STATUS_ACEITA, "Microtarefa reaberta pelo usuario", 0)
        }))
        return acoes
    }

    return acoes
}

function renderizarMicrotarefas(tarefa) {
    const wrapper = document.createElement("div")
    wrapper.className = "micro-section"

    const topo = document.createElement("div")
    topo.className = "micro-header"

    const subtitulo = document.createElement("p")
    subtitulo.className = "micro-heading"
    subtitulo.textContent = "Sugestões de microtarefas"
    topo.appendChild(subtitulo)

    const dica = document.createElement("span")
    dica.className = "micro-tip"
    dica.textContent = "Aceite apenas o que fizer sentido para o seu plano."
    topo.appendChild(dica)
    wrapper.appendChild(topo)

    const sublista = document.createElement("ul")
    sublista.className = "micro-list"

    tarefa.microtarefas
        .filter(micro => normalizarStatusMicro(micro.status) !== STATUS_REJEITADA)
        .forEach(micro => {
            const status = normalizarStatusMicro(micro.status)
            const item = document.createElement("li")
            item.className = classeStatusMicro(status)

            const bloco = document.createElement("div")
            bloco.className = "micro-copy"

            const statusBadge = document.createElement("span")
            statusBadge.className = `micro-status ${classeStatusMicro(status)}`
            statusBadge.textContent = rotuloStatusMicro(status)
            bloco.appendChild(statusBadge)

            const titulo = document.createElement("strong")
            titulo.textContent = micro.titulo
            bloco.appendChild(titulo)

            const detalhes = document.createElement("span")
            detalhes.textContent = `${micro.duracao_estimada ?? 0} min • ${rotuloStatusMicro(status)}`
            bloco.appendChild(detalhes)

            item.appendChild(bloco)
            item.appendChild(criarAcoesMicrotarefa(micro))
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
    historico.textContent = `Aceitas: ${tarefa.resumo_historico.sugestoes_aceitas} - Rejeitadas: ${tarefa.resumo_historico.sugestoes_rejeitadas}`
    li.appendChild(historico)

    li.appendChild(criarEditorPrazo(tarefa))

    if (tarefa.microtarefas?.some(micro => normalizarStatusMicro(micro.status) !== STATUS_REJEITADA)) {
        li.appendChild(renderizarMicrotarefas(tarefa))
    }

    const rodape = document.createElement("div")
    rodape.className = "task-footer"
    if (tarefa.status !== STATUS_CONCLUIDA) {
        rodape.appendChild(criarBotaoAcao("Concluir tarefa", "ghost-button action-finish-task", async () => {
            await concluirTarefa(tarefa)
        }))
    }
    rodape.appendChild(criarBotaoAcao("Deletar tarefa", "ghost-button action-delete", async () => {
        await deletarTarefa(tarefa)
    }))
    li.appendChild(rodape)

    return li
}

function renderizarEstadoVazio(texto, detalhe) {
    const vazio = document.createElement("li")
    vazio.className = "empty-state"
    vazio.innerHTML = `<strong>${texto}</strong><span>${detalhe}</span>`
    return vazio
}

function configurarMenuPerfil() {
    const botao = document.getElementById("profile-button")
    const menu = document.getElementById("profile-menu")
    const logoutButton = document.getElementById("logout-button")

    botao.onclick = () => {
        menu.classList.toggle("is-open")
    }

    logoutButton.onclick = () => {
        limparUsuario()
        menu.classList.remove("is-open")
        atualizarSessaoVisual()
        alternarAbaAuth("login")
    }

    document.addEventListener("click", event => {
        if (!menu.contains(event.target) && !botao.contains(event.target)) {
            menu.classList.remove("is-open")
        }
    })
}

function configurarAuth() {
    const tabLogin = document.getElementById("tab-login")
    const tabRegister = document.getElementById("tab-register")
    const loginForm = document.getElementById("login-form")
    const registerForm = document.getElementById("register-form")

    tabLogin.onclick = () => alternarAbaAuth("login")
    tabRegister.onclick = () => alternarAbaAuth("register")

    registerForm.onsubmit = async event => {
        event.preventDefault()
        const payload = {
            nome: document.getElementById("register-name").value.trim(),
            email: document.getElementById("register-email").value.trim(),
            senha: document.getElementById("register-password").value
        }

        const resposta = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        })
        const dados = await resposta.json()

        if (!resposta.ok) {
            mostrarFeedbackAuth(dados.erro || "Nao foi possivel criar a conta.", "error")
            return
        }

        document.getElementById("login-email").value = payload.email
        document.getElementById("login-password").value = ""
        document.getElementById("register-password").value = ""
        alternarAbaAuth("login")
        mostrarFeedbackAuth("Conta criada. Agora entre com seu e-mail e senha.", "success")
    }

    loginForm.onsubmit = async event => {
        event.preventDefault()
        const payload = {
            email: document.getElementById("login-email").value.trim(),
            senha: document.getElementById("login-password").value
        }

        const resposta = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        })
        const dados = await resposta.json()

        if (!resposta.ok) {
            mostrarFeedbackAuth(dados.erro || "Nao foi possivel entrar.", "error")
            return
        }

        salvarUsuario(dados)
        atualizarSessaoVisual()
        limparFeedbackAuth()
        await carregar()
    }
}

async function carregar() {
    const usuario = obterUsuarioAtual()
    if (!usuario) {
        return
    }

    const res = await fetch(`${API_URL}/tarefas`, {
        headers: {
            "X-User-Id": String(usuario.id)
        }
    })

    if (!res.ok) {
        if (res.status === 401) {
            limparUsuario()
            atualizarSessaoVisual()
        }
        return
    }

    const dados = await res.json()
    atualizarMetricas(dados)

    const fazer = dados.filter(tarefa => tarefa.status === "pendente")
    const fazendo = dados.filter(tarefa => tarefa.status === "em_progresso")
    const feito = dados.filter(tarefa => tarefa.status === STATUS_CONCLUIDA)

    document.getElementById("contador-fazer").textContent = fazer.length
    document.getElementById("contador-fazendo").textContent = fazendo.length
    document.getElementById("contador-feito").textContent = feito.length

    const listaFazer = document.getElementById("lista-fazer")
    const listaFazendo = document.getElementById("lista-fazendo")
    const listaFeito = document.getElementById("lista-feito")
    listaFazer.innerHTML = ""
    listaFazendo.innerHTML = ""
    listaFeito.innerHTML = ""

    if (!fazer.length) {
        listaFazer.appendChild(renderizarEstadoVazio("Nenhuma tarefa pendente.", "As novas tarefas entram aqui antes de comecar."))
    } else {
        fazer.forEach(tarefa => listaFazer.appendChild(renderizarTarefa(tarefa)))
    }

    if (!fazendo.length) {
        listaFazendo.appendChild(renderizarEstadoVazio("Nada em andamento agora.", "Quando uma tarefa ganhar progresso ela aparece nesta coluna."))
    } else {
        fazendo.forEach(tarefa => listaFazendo.appendChild(renderizarTarefa(tarefa)))
    }

    if (!feito.length) {
        listaFeito.appendChild(renderizarEstadoVazio("Nenhuma tarefa concluida ainda.", "As tarefas finalizadas vao aparecer aqui."))
    } else {
        feito.forEach(tarefa => listaFeito.appendChild(renderizarTarefa(tarefa)))
    }
}

async function criar() {
    const payload = {
        titulo: document.getElementById("titulo").value.trim(),
        descricao: document.getElementById("descricao").value.trim(),
        categoria: document.getElementById("categoria").value,
        prioridade: document.getElementById("prioridade").value,
        impacto: 2,
        urgencia: 2,
        prazo: document.getElementById("prazo").value,
        perfil_detalhamento: ""
    }

    if (!payload.titulo) {
        return
    }

    const resposta = await fetch(`${API_URL}/tarefas`, {
        method: "POST",
        headers: cabecalhosApi(),
        body: JSON.stringify(payload)
    })

    if (!resposta.ok) {
        window.alert("Nao foi possivel criar a tarefa.")
        return
    }

    const tarefaCriada = await resposta.json()

    let suggestion = null
    let microtasks = null
    try {
        ;[suggestion, microtasks] = await Promise.all([
            solicitarSugestaoAI(tarefaCriada.id),
            solicitarMicrotasksAI(tarefaCriada.id)
        ])
    } catch (error) {
        suggestion = null
        microtasks = null
    }

    if (suggestion) {
        const frase = `Prioridade sugerida: ${suggestion.sugestao_prioridade} | Risco de atraso: ${suggestion.risco_atraso} (${Math.round((suggestion.confianca || 0) * 100)}% de confianca). ${suggestion.justificativa}`
        mostrarPainelIA(frase, microtasks?.sugestoes_microtarefas || [])
    } else {
        esconderPainelIA()
    }

    document.getElementById("titulo").value = ""
    document.getElementById("descricao").value = ""
    document.getElementById("categoria").value = ""
    document.getElementById("prioridade").value = "media"
    document.getElementById("prazo").value = ""

    await carregar()
}

configurarAuth()
configurarMenuPerfil()
atualizarSessaoVisual()
alternarAbaAuth("login")
if (obterUsuarioAtual()) {
    carregar()
}
