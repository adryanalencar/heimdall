FROM python:3.9-slim

WORKDIR /app

# Instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código da pasta 'app' para dentro do container
COPY ./app /app

# O comando padrão será sobrescrito pelo docker-compose
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]