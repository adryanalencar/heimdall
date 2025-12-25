# 🛡️ Heimdall - The Campaign Guardian

> *"Heimdall: A Bifrost digital para suas mensagens."*

**Heimdall** é um orquestrador de campanhas de WhatsApp de alta performance, projetado para gerenciar múltiplas instâncias, controlar a cadência de envio e garantir a entrega de mensagens através da integração com a **Evolution API**.

Construído sobre uma arquitetura de microsserviços, ele utiliza filas robustas para garantir que nenhuma mensagem se perca no caminho da Bifrost.

---

## 🚀 Stack Tecnológica

O sistema é composto por quatro pilares principais:

* **Backend API (The Tower):** [FastAPI](https://fastapi.tiangolo.com/) - Gerencia conexões, contatos, listas e orquestra os disparos.
* **Message Broker (The Bridge):** [RabbitMQ](https://www.rabbitmq.com/) - Garante a fila de envio, persistência e desacoplamento.
* **Worker (The Guardian):** Python Script - Consome a fila, respeita o *delay* (cadência) configurado e despacha para a Evolution API.
* **Frontend (The Eye):** [React](https://react.dev/) + [Vite](https://vitejs.dev/) - Interface visual para gestão das campanhas.

---

## ⚡ Funcionalidades Principais

* **Multi-Tenancy (Múltiplas Instâncias):** Gerencie várias conexões da Evolution API (vários números) em um único painel.
* **Controle de Cadência:** Defina exatamente quantas mensagens por minuto cada campanha deve enviar para evitar bloqueios.
* **Envio de Mídia:** Suporte nativo para Imagens, Vídeos e Documentos.
* **Variáveis Dinâmicas:** Personalize mensagens com `$contact_name`, `$contact_number`, etc.
* **Gestão de Audiência:** Criação de campanhas baseadas em **Listas** estáticas ou **Tags** dinâmicas.
* **Logs Detalhados:** Histórico de sucesso/falha de cada mensagem individual.
* **Arquitetura Dockerizada:** Pronto para rodar com um único comando.

---

## 📂 Estrutura do Projeto

```text
heimdall/
├── app/                  # Backend (FastAPI + Worker)
│   ├── main.py           # API Endpoints
│   ├── worker.py         # Consumidor de filas
│   ├── models.py         # Tabelas do Banco
│   ├── schemas.py        # Validação de Dados
│   ├── services.py       # Lógica de Negócios e RabbitMQ
│   └── database.py       # Configuração SQLAlchemy
├── frontend/             # Frontend (React + Vite)
│   ├── src/
│   └── Dockerfile        # Build do Frontend
├── data/                 # Persistência de dados (SQLite/Logs)
├── docker-compose.yml    # Orquestração
├── Dockerfile            # Build do Backend
├── requirements.txt      # Dependências Python
└── .env                  # Variáveis de Ambiente

```

---

## 🛠️ Pré-requisitos

1. **Docker** e **Docker Compose** instalados.
2. Uma instância da **Evolution API** rodando (localmente ou em servidor remoto).

---

## 🏁 Como Rodar (Quickstart)

### 1. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes configurações:

```ini
# .env

# --- Database ---
DATABASE_URL=sqlite:////app/data/campaign_manager.db

# --- RabbitMQ ---
RABBITMQ_HOST=rabbitmq
RABBITMQ_USER=admin
RABBITMQ_PASS=secret_password_123

# --- Frontend ---
# URL da API que o frontend vai consumir
VITE_API_URL=http://localhost:8000

```

### 2. Iniciar o Heimdall

No terminal, execute:

```bash
docker-compose up --build

```

O sistema subirá os seguintes serviços:

* **RabbitMQ:** Painel em `http://localhost:15672` (User: `admin`, Pass: `secret_password_123`)
* **API (Backend):** Swagger em `http://localhost:8000/docs`
* **Frontend:** Acesso em `http://localhost:3000`

---

## 📖 Guia de Uso (API Flow)

### Passo 1: Cadastrar uma Conexão (Instância)

Configure qual WhatsApp fará o envio.

* **POST** `/connections/`
```json
{
  "name": "Comercial 01",
  "api_url": "http://host.docker.internal:8080",
  "api_key": "SUA_API_KEY_GLOBAL",
  "instance_name": "MinhaInstancia"
}

```



### Passo 2: Criar Contatos e Tags

* **POST** `/tags/` -> `{"name": "VIP"}`
* **POST** `/contacts/`
```json
{
  "name": "Thor Odinson",
  "number": "5511999999999",
  "tag_ids": [1]
}

```



### Passo 3: Iniciar Campanha (Soprar o Gjallarhorn 📯)

O sistema aceita variáveis como `$contact_name`.

* **POST** `/campaigns/start`
```json
{
  "name": "Aviso de Asgard",
  "message_body": "Olá $contact_name, o inverno chegou!",
  "media_url": "https://exemplo.com/imagem.png",
  "media_type": "image",
  "messages_per_minute": 10,
  "connection_id": 1,
  "target_tags_ids": [1]
}

```



### Passo 4: Monitorar

Acompanhe o progresso em tempo real.

* **GET** `/campaigns/{id}/stats`

---

## 🔧 Desenvolvimento e Contribuição

Para rodar o worker e ver os logs em tempo real durante o desenvolvimento:

```bash
# Ver logs do worker especificamente
docker logs -f whatsapp_worker

```

Para alterar o frontend, os arquivos na pasta `frontend/` são mapeados via volume, então qualquer alteração reflete imediatamente (Hot Reload).

---

## 🛡️ Licença

Este projeto é protegido por Heimdall. O uso não autorizado resultará no fechamento da Bifrost. (MIT License).