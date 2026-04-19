from flask import Flask, jsonify, request
from flask_cors import CORS

from database import SessionLocal, initialize_database
from services.task_service import (
    atualizar_microtarefa,
    atualizar_tarefa,
    buscar_tarefa,
    criar_tarefa,
    listar_tarefas,
    serializar_tarefa,
)

app = Flask(__name__)
CORS(app)

initialize_database()


@app.route("/tarefas", methods=["GET"])
def rota_listar_tarefas():
    db = SessionLocal()
    resposta = listar_tarefas(db)
    db.close()
    return jsonify(resposta)


@app.route("/tarefas/<int:tarefa_id>", methods=["GET"])
def rota_detalhar_tarefa(tarefa_id):
    db = SessionLocal()
    tarefa = buscar_tarefa(db, tarefa_id)

    if not tarefa:
        db.close()
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    resposta = serializar_tarefa(tarefa)
    db.close()
    return jsonify(resposta)


@app.route("/tarefas", methods=["POST"])
def rota_criar_tarefa():
    db = SessionLocal()
    try:
        resposta = criar_tarefa(db, request.json or {})
    except ValueError as exc:
        db.close()
        return jsonify({"erro": str(exc)}), 400

    db.close()
    return jsonify(resposta), 201


@app.route("/tarefas/<int:tarefa_id>", methods=["PATCH"])
def rota_atualizar_tarefa(tarefa_id):
    db = SessionLocal()
    resposta = atualizar_tarefa(db, tarefa_id, request.json or {})

    if not resposta:
        db.close()
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    db.close()
    return jsonify(resposta)


@app.route("/microtarefas/<int:microtarefa_id>", methods=["PATCH"])
def rota_atualizar_microtarefa(microtarefa_id):
    db = SessionLocal()
    resposta = atualizar_microtarefa(db, microtarefa_id, request.json or {})

    if not resposta:
        db.close()
        return jsonify({"erro": "Microtarefa nao encontrada"}), 404

    db.close()
    return jsonify(resposta)


if __name__ == "__main__":
    app.run(debug=True)
