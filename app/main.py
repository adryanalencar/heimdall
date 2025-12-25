from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

import models, schemas, database, services

# Cria Tabelas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Heimdall API")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, especifique a URL do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependência do Banco
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 📡 CONNECTIONS
# ==========================================

@app.post("/connections/", response_model=schemas.Connection)
def create_connection(conn: schemas.ConnectionCreate, db: Session = Depends(get_db)):
    db_conn = models.Connection(**conn.dict())
    db.add(db_conn)
    db.commit()
    db.refresh(db_conn)
    return db_conn

@app.get("/connections/", response_model=List[schemas.Connection])
def list_connections(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Connection).offset(skip).limit(limit).all()

@app.get("/connections/{connection_id}", response_model=schemas.Connection)
def get_connection(connection_id: int, db: Session = Depends(get_db)):
    db_conn = db.query(models.Connection).filter(models.Connection.id == connection_id).first()
    if not db_conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return db_conn

# ==========================================
# 🏷️ TAGS
# ==========================================

@app.post("/tags/", response_model=schemas.Tag)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    db_tag = models.Tag(name=tag.name)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@app.get("/tags/", response_model=List[schemas.Tag])
def list_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Tag).offset(skip).limit(limit).all()

@app.get("/tags/{tag_id}", response_model=schemas.Tag)
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

# ==========================================
# 👤 CONTACTS
# ==========================================

@app.post("/contacts/", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    # Verifica duplicidade
    existing = db.query(models.Contact).filter(models.Contact.number == contact.number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Number already registered")

    db_contact = models.Contact(name=contact.name, number=contact.number)
    if contact.tag_ids:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(contact.tag_ids)).all()
        db_contact.tags = tags
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.get("/contacts/", response_model=List[schemas.Contact])
def list_contacts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Contact).offset(skip).limit(limit).all()

@app.get("/contacts/{contact_id}", response_model=schemas.Contact)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

# ==========================================
# 📋 CONTACT LISTS
# ==========================================

@app.get("/lists/", response_model=List[schemas.ContactList])
def list_contact_lists(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.ContactList).offset(skip).limit(limit).all()

@app.get("/lists/{list_id}", response_model=schemas.ContactList)
def get_contact_list(list_id: int, db: Session = Depends(get_db)):
    # Aqui retornará a lista E os contatos dentro dela (definido no schema)
    lst = db.query(models.ContactList).filter(models.ContactList.id == list_id).first()
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    return lst

# ==========================================
# 📢 CAMPAIGNS
# ==========================================

@app.post("/campaigns/start")
def create_and_start_campaign(
    campaign_in: schemas.CampaignCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    # 1. Valida Conexão
    conn = db.query(models.Connection).filter(models.Connection.id == campaign_in.connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection ID not found")

    # 2. Define Lista (Existente ou por Tags)
    list_id = campaign_in.contact_list_id
    if not list_id and campaign_in.target_tags_ids:
        # Cria lista dinâmica
        new_list = models.ContactList(name=f"Auto-List: {campaign_in.name}")
        contacts_query = db.query(models.Contact).filter(
            models.Contact.tags.any(models.Tag.id.in_(campaign_in.target_tags_ids))
        ).all()
        
        if not contacts_query:
            raise HTTPException(status_code=400, detail="No contacts found for these tags")

        new_list.contacts = contacts_query
        db.add(new_list)
        db.flush()
        list_id = new_list.id
    
    if not list_id:
        raise HTTPException(status_code=400, detail="Provide a list_id or target_tags_ids")

    # 3. Cria Campanha
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
    
    # 4. Envia para Fila
    target_list = db.query(models.ContactList).filter(models.ContactList.id == list_id).first()
    contacts_data = [{"number": c.number, "name": c.name} for c in target_list.contacts]
    
    campaign_dict = {
        "id": new_campaign.id,
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

@app.get("/campaigns/", response_model=List[schemas.Campaign])
def list_campaigns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Campaign).offset(skip).limit(limit).all()

@app.get("/campaigns/{campaign_id}", response_model=schemas.Campaign)
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

# ==========================================
# 📊 STATS & LOGS
# ==========================================

@app.get("/campaigns/{campaign_id}/stats")
def get_campaign_stats(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    stats = db.query(
        models.CampaignLog.status, 
        func.count(models.CampaignLog.id)
    ).filter(
        models.CampaignLog.campaign_id == campaign_id
    ).group_by(
        models.CampaignLog.status
    ).all()
    
    result = {status: count for status, count in stats}
    total = sum(result.values())
    
    return {
        "campaign_name": campaign.name,
        "total_processed": total,
        "details": result,
        "status": campaign.status
    }

@app.get("/campaigns/{campaign_id}/logs")
def get_campaign_logs(campaign_id: int, db: Session = Depends(get_db)):
    return db.query(models.CampaignLog).filter(models.CampaignLog.campaign_id == campaign_id).all()