import datetime
import hashlib

from models import Usuario


def _hash_senha(senha):
    return hashlib.sha256((senha or "").encode("utf-8")).hexdigest()


def _normalizar_email(email):
    return (email or "").strip().lower()


def criar_usuario(db, data):
    nome = (data.get("nome") or "").strip()
    email = _normalizar_email(data.get("email"))
    senha = (data.get("senha") or "").strip()

    if not nome:
        raise ValueError("O nome e obrigatorio")
    if not email:
        raise ValueError("O e-mail e obrigatorio")
    if not senha:
        raise ValueError("A senha e obrigatoria")

    existente = db.query(Usuario).filter(Usuario.email == email).first()
    if existente:
        raise ValueError("Ja existe uma conta com este e-mail")

    usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash=_hash_senha(senha),
        data_criacao=datetime.datetime.now().isoformat(timespec="seconds"),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
    }


def autenticar_usuario(db, data):
    email = _normalizar_email(data.get("email"))
    senha = (data.get("senha") or "").strip()

    if not email or not senha:
        raise ValueError("Informe e-mail e senha")

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or usuario.senha_hash != _hash_senha(senha):
        raise ValueError("E-mail ou senha invalidos")

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
    }
