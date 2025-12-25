import pika
import json
import time
import requests
import os
import mimetypes
from urllib.parse import urlparse, unquote # <--- NOVOS IMPORTS
from sqlalchemy.orm import Session
from database import SessionLocal
from models import CampaignLog

# --- Configurações ---
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'guest')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def save_log(campaign_id, phone, name, status, error=None):
    db = SessionLocal()
    try:
        log = CampaignLog(
            campaign_id=campaign_id,
            contact_number=phone,
            contact_name=name,
            status=status,
            error_message=str(error) if error else None
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Erro ao salvar log: {e}")
    finally:
        db.close()

def get_media_info(url, provided_type=None):
    """
    1. Decodifica a URL para obter o nome do arquivo limpo (ex: remove %20).
    2. Determina o mimetype e mediatype.
    """
    # --- NOVO: Extração e Limpeza do Nome do Arquivo ---
    parsed_url = urlparse(url)           # Quebra a URL em partes
    decoded_path = unquote(parsed_url.path) # Transforma "%20" em " "
    filename = os.path.basename(decoded_path) # Pega apenas "arquivo.pdf"
    
    # Se não conseguir extrair nome, cria um padrão
    if not filename:
        filename = "file"

    # --- Lógica de Tipo (Igual anterior) ---
    mime_type, _ = mimetypes.guess_type(filename)
    
    if not mime_type:
        mime_type = "application/octet-stream"

    # Força Documento se for PDF/Doc/XLS
    if "pdf" in mime_type or "application" in mime_type or "text" in mime_type:
        media_type = "document"
    elif "video" in mime_type:
        media_type = "video"
    elif "audio" in mime_type:
        media_type = "audio"
    elif "image" in mime_type:
        media_type = "image"
    elif provided_type:
        media_type = provided_type
    else:
        media_type = "document"

    # Retorna também o FILENAME agora
    return media_type, mime_type, filename 

def send_via_evolution(payload):
    conn = payload.get('connection')
    base_url = conn['base_url'].rstrip('/')
    api_key = conn['api_key']
    instance = conn['instance']
    
    text = payload['message']
    if text:
        text = text.replace("$contact_name", payload['name'] or "")
        text = text.replace("$contact_number", payload['phone'] or "")
    
    headers = {
        "apikey": api_key,
        "Content-Type": "application/json"
    }
    
    if payload.get('media_url'):
        endpoint = "/message/sendMedia"
        
        # Desempacota os 3 valores retornados
        media_type, mime_type, filename = get_media_info(payload.get('media_url'), payload.get('media_type'))
        
        body = {
            "number": payload['phone'],
            "mediatype": media_type,
            "mimetype": mime_type,
            "caption": text,
            "media": payload['media_url'],
            "fileName": filename  # <--- CAMPO IMPORTANTE PARA PDF
        }
    else:
        endpoint = "/message/sendText"
        body = {
            "number": payload['phone'],
            "options": {"delay": 1200, "presence": "composing"},
            "textMessage": {"text": text}
        }

    try:
        url = f"{base_url}{endpoint}/{instance}"
        print(f"[{instance}] Enviando para {payload['phone']} ({endpoint})...")
        print(f"   Arquivo identificado: {body.get('fileName')} ({body.get('mimetype')})")
        
        response = requests.post(url, json=body, headers=headers, timeout=30)
        
        campaign_id = payload.get('campaign_id')
        
        if response.status_code in [200, 201]:
            print(f"✅ Sucesso: {payload['phone']}")
            if campaign_id: save_log(campaign_id, payload['phone'], payload['name'], "sent")
        else:
            error_msg = response.text
            print(f"❌ Falha API ({response.status_code}): {error_msg}")
            if campaign_id: save_log(campaign_id, payload['phone'], payload['name'], "failed", error=error_msg)
            
    except Exception as e:
        print(f"❌ Erro Crítico: {e}")
        campaign_id = payload.get('campaign_id')
        if campaign_id: save_log(campaign_id, payload['phone'], payload['name'], "failed", error=str(e))

def callback(ch, method, properties, body):
    try:
        payload = json.loads(body)
        send_via_evolution(payload)
        
        delay = payload.get('delay_seconds', 5)
        time.sleep(delay)
        
    except Exception as e:
        print(f"Erro no processamento da fila: {e}")
    finally:
        ch.basic_ack(delivery_tag=method.delivery_tag)

def start_worker():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)

    while True:
        try:
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            channel.queue_declare(queue='whatsapp_campaigns', durable=True)
            channel.basic_qos(prefetch_count=1)
            
            print(f' [*] Heimdall Worker conectado. Aguardando mensagens...')
            channel.basic_consume(queue='whatsapp_campaigns', on_message_callback=callback)
            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError:
            print("RabbitMQ indisponível, tentando em 5s...")
            time.sleep(5)
        except Exception as e:
            print(f"Erro no loop principal: {e}")
            time.sleep(5)

if __name__ == "__main__":
    start_worker()