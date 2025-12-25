import pika
import json
import time
import requests
import os
from sqlalchemy.orm import Session
from database import SessionLocal # Importar a sessão do seu arquivo database.py
from models import CampaignLog

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'guest')

def save_log(campaign_id, phone, name, status, error=None):
    """Função auxiliar para salvar no banco"""
    db: Session = SessionLocal()
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
        print(f"Erro ao salvar log no banco: {e}")
    finally:
        db.close()

def send_via_evolution(payload):
    # Extrai configurações dinâmicas da mensagem
    conn = payload.get('connection')
    base_url = conn['base_url'].rstrip('/')
    api_key = conn['api_key']
    instance = conn['instance']
    
    # Substituição de Variáveis
    text = payload['message']
    text = text.replace("$contact_name", payload['name'])
    text = text.replace("$contact_number", payload['phone'])
    
    headers = {
        "apikey": api_key,
        "Content-Type": "application/json"
    }
    
    # Define endpoint e corpo baseado se tem mídia ou não
    if payload.get('media_url'):
        endpoint = "/message/sendMedia"
        body = {
            "number": payload['phone'],
            "mediaMessage": {
                "mediatype": payload['media_type'], # image, video, document
                "caption": text,
                "media": payload['media_url']
            }
        }
    else:
        endpoint = "/message/sendText"
        body = {
            "number": payload['phone'],
            "options": {"delay": 1200, "presence": "composing"},
            "textMessage": {"text": text}
        }

    campaign_id = payload.get('campaign_id') # Pegamos o ID

    try:
        url = f"{base_url}{endpoint}/{instance}"
        print(f"Enviando para {payload['phone']} via instância {instance}...")
        response = requests.post(url, json=body, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 201]:
            print(f"Sucesso: {payload['phone']}")
            # Salvar Sucesso
            save_log(campaign_id, payload['phone'], payload['name'], "sent")
        else:
            print(f"Falha API: {response.text}")
            # Salvar Falha da API
            save_log(campaign_id, payload['phone'], payload['name'], "failed", error=response.text)
    except Exception as e:
        print(f"ERRO ao enviar para {payload['phone']}: {e}")
        save_log(campaign_id, payload['phone'], payload['name'], "failed", error=str(e))

def callback(ch, method, properties, body):
    try:
        payload = json.loads(body)
        
        # 1. Enviar
        send_via_evolution(payload)
        
        # 2. Delay (Cadência)
        delay = payload.get('delay_seconds', 5)
        time.sleep(delay)
        
    except Exception as e:
        print(f"Erro crítico no processamento: {e}")
    finally:
        # Confirma processamento (retira da fila)
        ch.basic_ack(delivery_tag=method.delivery_tag)


def start_worker():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)

    while True:
        try:
            # Usa as credenciais na conexão
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            channel.queue_declare(queue='whatsapp_campaigns', durable=True)
            channel.basic_qos(prefetch_count=1)
            
            print(f' [*] Worker conectado em {RABBITMQ_HOST}. Aguardando mensagens...')
            channel.basic_consume(queue='whatsapp_campaigns', on_message_callback=callback)
            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError:
            print("RabbitMQ indisponível, tentando em 5s...")
            time.sleep(5)

if __name__ == "__main__":
    start_worker()