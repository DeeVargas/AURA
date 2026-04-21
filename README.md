# AURA

O AURA e um prototipo funcional de organizacao de tarefas com foco em produtividade com proposito. A aplicacao permite cadastrar usuarios, criar tarefas com prioridade e prazo, visualizar o fluxo em um quadro kanban e acompanhar microtarefas sugeridas pelo sistema.

## Objetivo do Projeto

Este projeto foi desenvolvido para validar a ideia de uma plataforma simples de produtividade, capaz de apoiar a organizacao pessoal por meio de:

- cadastro e login de usuarios
- criacao e acompanhamento de tarefas
- visualizacao em quadro kanban
- apoio ao planejamento com microtarefas
- classificacao visual de prioridade

## Funcionalidades

- Cadastro e autenticacao de usuarios
- Criacao de tarefas com titulo, descricao, categoria, prioridade e prazo
- Exibicao das tarefas em colunas de pendentes, em andamento e concluidas
- Atualizacao do prazo diretamente no cartao da tarefa
- Conclusao e exclusao de tarefas
- Geracao de microtarefas para decompor atividades maiores
- Acompanhamento de progresso com base nas microtarefas aceitas e concluidas
- Destaque visual por prioridade

## Tecnologias Utilizadas

### Frontend

- HTML
- CSS
- JavaScript puro

### Backend

- Python
- Flask
- Flask-CORS
- SQLAlchemy
- SQLite

### Apoio ao modelo

- TensorFlow
- NumPy

## Estrutura do Projeto

```text
AURA/
|-- backend/
|   |-- app.py
|   |-- create_db.py
|   |-- database.py
|   |-- modelo.py
|   |-- models.py
|   `-- services/
|-- frontend/
|   |-- index.html
|   |-- script.js
|   `-- style.css
|-- aura.db
`-- README.md
```

## Como Executar

### 1. Clonar o projeto

```bash
git clone <url-do-repositorio>
cd AURA
```

### 2. Criar e ativar um ambiente virtual

No Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Instalar as dependencias

```bash
pip install flask flask-cors sqlalchemy tensorflow numpy
```

### 4. Iniciar o backend

No diretório `backend`:

```bash
cd backend
python app.py
```

O servidor sera iniciado em:

```text
http://127.0.0.1:5000
```

### 5. Abrir o frontend

Abra o arquivo `frontend/index.html` no navegador.

Se preferir, voce tambem pode usar um servidor local para servir o frontend.

## Como Usar

1. Crie uma conta na tela inicial.
2. Faca login com o e-mail e senha cadastrados.
3. Adicione uma nova tarefa com prioridade e prazo.
4. Acompanhe a tarefa no quadro.
5. Aceite, rejeite ou conclua as microtarefas sugeridas.
6. Edite o prazo diretamente no cartao da tarefa quando necessario.

## Regras de Prioridade

- Prioridade `alta` tende a destacar tarefas mais urgentes
- Prioridade `media` mantem classificacao intermediaria
- Prioridade `baixa` aparece em verde no quadro

## Status do Projeto

`Prototipo funcional em desenvolvimento`

O projeto ja possui fluxo completo de uso, mas ainda esta em fase de evolucao e validacao.

## Possiveis Melhorias Futuras

- Edicao completa de tarefas alem do prazo
- Filtros por categoria, prioridade e status
- Melhorias de responsividade
- Testes automatizados
- Recuperacao de senha
- Deploy da aplicacao
- Separacao de dependencias em `requirements.txt`
- Refinamento do modelo de previsao de tempo

## Observacoes

- O banco utilizado atualmente e SQLite
- O backend cria e atualiza a estrutura do banco automaticamente na inicializacao
- O projeto tem foco academico e de validacao de conceito

## Autoria

Projeto desenvolvido para fins de estudo, validacao de ideia e evolucao de um sistema de produtividade.
