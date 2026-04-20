from flask import Flask, jsonify, request
from flask_cors import CORS

from database import SessionLocal, initialize_database
from services.auth_service import autenticar_usuario, criar_usuario
from services.task_service import (
    atualizar_microtarefa,
    atualizar_tarefa,
    buscar_tarefa,
    criar_tarefa,
    deletar_tarefa,
    listar_tarefas,
    serializar_tarefa,
)

app = Flask(__name__)
CORS(app)

initialize_database()


def obter_usuario_id():
    header = request.headers.get("X-User-Id", "").strip()
    if not header:
        return None

    try:
        return int(header)
    except ValueError:
        return None


def validar_usuario():
    usuario_id = obter_usuario_id()
    if not usuario_id:
        return None, (jsonify({"erro": "Usuario nao autenticado"}), 401)
    return usuario_id, None


@app.route("/auth/register", methods=["POST"])
def rota_registrar_usuario():
    db = SessionLocal()
    try:
        resposta = criar_usuario(db, request.json or {})
    except ValueError as exc:
        db.close()
        return jsonify({"erro": str(exc)}), 400

    db.close()
    return jsonify(resposta), 201


@app.route("/auth/login", methods=["POST"])
def rota_login_usuario():
    db = SessionLocal()
    try:
        resposta = autenticar_usuario(db, request.json or {})
    except ValueError as exc:
        db.close()
        return jsonify({"erro": str(exc)}), 400

    db.close()
    return jsonify(resposta)


@app.route("/tarefas", methods=["GET"])
def rota_listar_tarefas():
    usuario_id, erro = validar_usuario()
    if erro:
        return erro

    db = SessionLocal()
    resposta = listar_tarefas(db, usuario_id)
    db.close()
    return jsonify(resposta)


@app.route("/tarefas/<int:tarefa_id>", methods=["GET"])
def rota_detalhar_tarefa(tarefa_id):
    usuario_id, erro = validar_usuario()
    if erro:
        return erro

    db = SessionLocal()
    tarefa = buscar_tarefa(db, tarefa_id, usuario_id)

    if not tarefa:
        db.close()
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    resposta = serializar_tarefa(tarefa)
    db.close()
    return jsonify(resposta)


@app.route("/tarefas", methods=["POST"])
def rota_criar_tarefa():
    usuario_id, erro = validar_usuario()
    if erro:
        return erro

    db = SessionLocal()
    try:
        resposta = criar_tarefa(db, request.json or {}, usuario_id)
    except ValueError as exc:
        db.close()
        return jsonify({"erro": str(exc)}), 400

    db.close()
    return jsonify(resposta), 201


@app.route("/tarefas/<int:tarefa_id>", methods=["PATCH"])
def rota_atualizar_tarefa(tarefa_id):
    usuario_id, erro = validar_usuario()
    if erro:
        return erro

    db = SessionLocal()
    resposta = atualizar_tarefa(db, tarefa_id, request.json or {}, usuario_id)

    if not resposta:
        db.close()
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    db.close()
    return jsonify(resposta)


@app.route("/tarefas/<int:tarefa_id>", methods=["DELETE"])
def rota_deletar_tarefa(tarefa_id):
    usuario_id, erro = validar_usuario()
    if erro:
        return erro

    db = SessionLocal()
    removida = deletar_tarefa(db, tarefa_id, usuario_id)

    if not removida:
        db.close()
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    db.close()
    return jsonify({"ok": True})


@app.route("/microtarefas/<int:microtarefa_id>", methods=["PATCH"])
def rota_atualizar_microtarefa(microtarefa_id):
    usuario_id, erro = validar_usuario()
    if erro:
        return erro

    db = SessionLocal()
    resposta = atualizar_microtarefa(db, microtarefa_id, request.json or {}, usuario_id)

    if not resposta:
        db.close()
        return jsonify({"erro": "Microtarefa nao encontrada"}), 404

    db.close()
    return jsonify(resposta)


if __name__ == "__main__":
    app.run(debug=True)
