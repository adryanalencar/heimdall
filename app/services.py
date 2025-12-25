import pika
import json
import os

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'guest')

def get_rabbitmq_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
    return pika.BlockingConnection(parameters)

def publish_campaign_to_queue(campaign_data: dict, connection_data: dict, contacts: list):
    """
    Publica as mensagens na fila, injetando os dados da conexão (instância)
    dentro de cada mensagem para o worker saber quem deve disparar.
    """
    connection = get_rabbitmq_connection()
    channel = connection.channel()
    channel.queue_declare(queue='whatsapp_campaigns', durable=True)

    for contact in contacts:
        message_payload = {
            "campaign_id": campaign_data.get('id'),
            "phone": contact['number'],
            "name": contact['name'],
            "message": campaign_data['message_body'],
            "media_url": campaign_data['media_url'],
            "media_type": campaign_data['media_type'],
            "delay_seconds": 60 / campaign_data['messages_per_minute'],
            
            # Dados da Instância para o Worker usar
            "connection": {
                "base_url": connection_data['api_url'],
                "api_key": connection_data['api_key'],
                "instance": connection_data['instance_name']
            }
        }
        
        channel.basic_publish(
            exchange='',
            routing_key='whatsapp_campaigns',
            body=json.dumps(message_payload),
            properties=pika.BasicProperties(delivery_mode=2)
        )
    
    connection.close()