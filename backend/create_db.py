import models
from database import Base, engine, initialize_database

initialize_database()
Base.metadata.create_all(bind=engine)

print("Banco criado com sucesso!")
