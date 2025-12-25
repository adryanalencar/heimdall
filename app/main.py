from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, services

# Cria as tabelas se não existirem
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Evolution Campaign Manager Multi-Instance")

origins = [
    "http://localhost:3000",      # Frontend Local
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],    # Permite GET, POST, DELETE, etc.
    allow_headers=["*"],
)

# --- Connections ---
@app.post("/connections/", response_model=schemas.Connection)
def create_connection(conn: schemas.ConnectionCreate, db: Session = Depends(database.get_db)):
    db_conn = models.Connection(**conn.dict())
    db.add(db_conn)
    db.commit()
    db.refresh(db_conn)
    return db_conn

@app.get("/connections/", response_model=List[schemas.Connection])
def list_connections(db: Session = Depends(database.get_db)):
    return db.query(models.Connection).all()

# --- Tags ---
@app.post("/tags/", response_model=schemas.Tag)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(database.get_db)):
    db_tag = models.Tag(name=tag.name)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

# --- Contacts ---
@app.post("/contacts/", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(database.get_db)):
    db_contact = models.Contact(name=contact.name, number=contact.number)
    if contact.tag_ids:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(contact.tag_ids)).all()
        db_contact.tags = tags
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

# --- Campaigns ---
@app.post("/campaigns/start")
def create_and_start_campaign(
    campaign_in: schemas.CampaignCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    # 1. Validar Conexão
    conn = db.query(models.Connection).filter(models.Connection.id == campaign_in.connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection ID not found")

    # 2. Definir Lista
    list_id = campaign_in.contact_list_id
    if not list_id and campaign_in.target_tags_ids:
        new_list = models.ContactList(name=f"Auto-List: {campaign_in.name}")
        contacts_query = db.query(models.Contact).filter(
            models.Contact.tags.any(models.Tag.id.in_(campaign_in.target_tags_ids))
        ).all()
        new_list.contacts = contacts_query
        db.add(new_list)
        db.flush()
        list_id = new_list.id
    
    if not list_id:
        raise HTTPException(status_code=400, detail="Provide a list_id or target_tags_ids")

    # 3. Salvar Campanha
    new_campaign = models.Campaign(
        name=campaign_in.name,
        message_body=campaign_in.message_body,
        media_url=campaign_in.media_url,
        media_type=campaign_in.media_type,
        messages_per_minute=campaign_in.messages_per_minute,
        contact_list_id=list_id,
        connection_id=conn.id,
        status="processing"
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    # 4. Preparar dados para o Worker
    target_list = db.query(models.ContactList).filter(models.ContactList.id == list_id).first()
    contacts_data = [{"number": c.number, "name": c.name} for c in target_list.contacts]
    
    campaign_dict = {
        "id": new_campaign.id, # <--- IMPORTANTE ADICIONAR ISSO
        "message_body": new_campaign.message_body,
        "media_url": new_campaign.media_url,
        "media_type": new_campaign.media_type,
        "messages_per_minute": new_campaign.messages_per_minute
    }
    
    connection_dict = {
        "api_url": conn.api_url,
        "api_key": conn.api_key,
        "instance_name": conn.instance_name
    }

    background_tasks.add_task(services.publish_campaign_to_queue, campaign_dict, connection_dict, contacts_data)

    return {"status": "started", "campaign_id": new_campaign.id, "total_contacts": len(contacts_data)}

@app.get("/campaigns/{campaign_id}/stats")
def get_campaign_stats(campaign_id: int, db: Session = Depends(database.get_db)):
    # Verifica se campanha existe
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Agregação SQL: Conta quantos logs existem agrupados por status
    stats = db.query(
        models.CampaignLog.status, 
        func.count(models.CampaignLog.id)
    ).filter(
        models.CampaignLog.campaign_id == campaign_id
    ).group_by(
        models.CampaignLog.status
    ).all()
    
    # Transforma lista de tuplas em dicionário. Ex: [('sent', 10), ('failed', 2)] -> {'sent': 10, 'failed': 2}
    result = {status: count for status, count in stats}
    
    # Calcula total
    total = sum(result.values())
    
    return {
        "campaign_name": campaign.name,
        "total_processed": total,
        "details": result, # Ex: {"sent": 45, "failed": 2}
        "logs_url": f"/campaigns/{campaign_id}/logs" # Link para ver logs detalhados
    }

@app.get("/campaigns/{campaign_id}/logs")
def get_campaign_logs(campaign_id: int, db: Session = Depends(database.get_db)):
    """Retorna a lista detalhada de envio (quem recebeu, quem falhou)"""
    logs = db.query(models.CampaignLog).filter(models.CampaignLog.campaign_id == campaign_id).all()
    return logs