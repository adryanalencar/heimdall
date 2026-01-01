from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

import models, schemas, database, services, auth

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
# 🔐 AUTH
# ==========================================

@app.post("/auth/register", response_model=schemas.User)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        email=user_in.email,
        password_hash=auth.hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not auth.verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token(user)
    return schemas.Token(access_token=token)

# ==========================================
# 📡 CONNECTIONS
# ==========================================

@app.post("/connections", response_model=schemas.Connection)
def create_connection(
    conn: schemas.ConnectionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_conn = models.Connection(**conn.dict(), user_id=current_user.id)
    db.add(db_conn)
    db.commit()
    db.refresh(db_conn)
    return db_conn

@app.get("/connections", response_model=List[schemas.Connection])
def list_connections(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Connection)
        .filter(models.Connection.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

@app.get("/connections/{connection_id}", response_model=schemas.Connection)
def get_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_conn = (
        db.query(models.Connection)
        .filter(
            models.Connection.id == connection_id,
            models.Connection.user_id == current_user.id,
        )
        .first()
    )
    if not db_conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return db_conn

# ==========================================
# 🏷️ TAGS
# ==========================================

@app.post("/tags", response_model=schemas.Tag)
def create_tag(
    tag: schemas.TagCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_tag = models.Tag(name=tag.name, user_id=current_user.id)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@app.get("/tags", response_model=List[schemas.Tag])
def list_tags(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Tag)
        .filter(models.Tag.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

@app.get("/tags/{tag_id}", response_model=schemas.Tag)
def get_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    tag = (
        db.query(models.Tag)
        .filter(models.Tag.id == tag_id, models.Tag.user_id == current_user.id)
        .first()
    )
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

# ==========================================
# 👤 CONTACTS
# ==========================================

@app.post("/contacts", response_model=schemas.Contact)
def create_contact(
    contact: schemas.ContactCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Verifica duplicidade
    existing = (
        db.query(models.Contact)
        .filter(
            models.Contact.number == contact.number,
            models.Contact.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Number already registered")

    db_contact = models.Contact(
        name=contact.name,
        number=contact.number,
        user_id=current_user.id,
    )
    if contact.tag_ids:
        tags = (
            db.query(models.Tag)
            .filter(
                models.Tag.id.in_(contact.tag_ids),
                models.Tag.user_id == current_user.id,
            )
            .all()
        )
        db_contact.tags = tags
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.get("/contacts", response_model=List[schemas.Contact])
def list_contacts(
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Contact)
        .filter(models.Contact.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

@app.get("/contacts/{contact_id}", response_model=schemas.Contact)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    contact = (
        db.query(models.Contact)
        .filter(
            models.Contact.id == contact_id,
            models.Contact.user_id == current_user.id,
        )
        .first()
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

# ==========================================
# 📋 CONTACT LISTS
# ==========================================

@app.get("/lists", response_model=List[schemas.ContactList])
def list_contact_lists(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.ContactList)
        .filter(models.ContactList.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

@app.post("/lists", response_model=schemas.ContactList)
def create_contact_list(
    list_in: schemas.ContactListCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    new_list = models.ContactList(name=list_in.name, user_id=current_user.id)
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list

@app.get("/lists/{list_id}", response_model=schemas.ContactList)
def get_contact_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Aqui retornará a lista E os contatos dentro dela (definido no schema)
    lst = (
        db.query(models.ContactList)
        .filter(
            models.ContactList.id == list_id,
            models.ContactList.user_id == current_user.id,
        )
        .first()
    )
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    return lst

# ==========================================
# 📥 CONTACT IMPORT
# ==========================================

@app.post("/contacts/import", response_model=schemas.ContactImportResponse)
def import_contacts(
    payload: schemas.ContactImportRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    contacts = payload.contacts
    if not contacts:
        raise HTTPException(status_code=400, detail="No contacts provided")

    tags = (
        db.query(models.Tag)
        .filter(
            models.Tag.id.in_(payload.tag_ids),
            models.Tag.user_id == current_user.id,
        )
        .all()
        if payload.tag_ids
        else []
    )

    contact_list = None
    if payload.list_id:
        contact_list = (
            db.query(models.ContactList)
            .filter(
                models.ContactList.id == payload.list_id,
                models.ContactList.user_id == current_user.id,
            )
            .first()
        )
        if not contact_list:
            raise HTTPException(status_code=404, detail="List not found")

    created = 0
    skipped = 0

    for c in contacts:
        existing = (
            db.query(models.Contact)
            .filter(
                models.Contact.number == c.number,
                models.Contact.user_id == current_user.id,
            )
            .first()
        )
        if existing:
            skipped += 1
            continue

        new_contact = models.Contact(
            name=c.name,
            number=c.number,
            user_id=current_user.id,
        )
        new_contact.tags = tags
        if contact_list:
            new_contact.lists.append(contact_list)

        db.add(new_contact)
        created += 1

    db.commit()

    return schemas.ContactImportResponse(
        imported=created,
        skipped=skipped,
        list_id=payload.list_id,
        tag_ids=payload.tag_ids,
    )
# ==========================================
# 📢 CAMPAIGNS
# ==========================================

@app.post("/campaigns")
def create_and_start_campaign(
    campaign_in: schemas.CampaignCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # 1. Valida Conexão
    conn = (
        db.query(models.Connection)
        .filter(
            models.Connection.id == campaign_in.connection_id,
            models.Connection.user_id == current_user.id,
        )
        .first()
    )
    if not conn:
        raise HTTPException(status_code=404, detail="Connection ID not found")

    # 2. Define Lista (Existente ou por Tags)
    list_id = campaign_in.contact_list_id
    if not list_id and campaign_in.target_tags_ids:
        # Cria lista dinâmica
        new_list = models.ContactList(
            name=f"Auto-List: {campaign_in.name}",
            user_id=current_user.id,
        )
        contacts_query = (
            db.query(models.Contact)
            .filter(
                models.Contact.user_id == current_user.id,
                models.Contact.tags.any(
                    models.Tag.id.in_(campaign_in.target_tags_ids)
                ),
            )
            .all()
        )
        
        if not contacts_query:
            raise HTTPException(status_code=400, detail="No contacts found for these tags")

        new_list.contacts = contacts_query
        db.add(new_list)
        db.flush()
        list_id = new_list.id
    
    if list_id:
        existing_list = (
            db.query(models.ContactList)
            .filter(
                models.ContactList.id == list_id,
                models.ContactList.user_id == current_user.id,
            )
            .first()
        )
        if not existing_list:
            raise HTTPException(status_code=404, detail="List not found")

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
        user_id=current_user.id,
        status="processing"
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    # 4. Envia para Fila
    target_list = (
        db.query(models.ContactList)
        .filter(
            models.ContactList.id == list_id,
            models.ContactList.user_id == current_user.id,
        )
        .first()
    )
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

@app.get("/campaigns", response_model=List[schemas.Campaign])
def list_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Campaign)
        .filter(models.Campaign.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

@app.get("/campaigns/{campaign_id}", response_model=schemas.Campaign)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    campaign = (
        db.query(models.Campaign)
        .filter(
            models.Campaign.id == campaign_id,
            models.Campaign.user_id == current_user.id,
        )
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@app.post("/campaigns/{campaign_id}/pause")
def pause_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    campaign = (
        db.query(models.Campaign)
        .filter(
            models.Campaign.id == campaign_id,
            models.Campaign.user_id == current_user.id,
        )
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.status = "paused"
    db.commit()
    return {"status": "paused", "campaign_id": campaign.id}

@app.post("/campaigns/{campaign_id}/resume")
def resume_campaign(
    campaign_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    campaign = (
        db.query(models.Campaign)
        .filter(
            models.Campaign.id == campaign_id,
            models.Campaign.user_id == current_user.id,
        )
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "paused":
        raise HTTPException(status_code=400, detail="Only paused campaigns can be resumed")

    contact_list = (
        db.query(models.ContactList)
        .filter(
            models.ContactList.id == campaign.contact_list_id,
            models.ContactList.user_id == current_user.id,
        )
        .first()
    )
    if not contact_list:
        raise HTTPException(status_code=404, detail="Contact list not found")

    processed_numbers = {
        row[0]
        for row in db.query(models.CampaignLog.contact_number)
        .filter(models.CampaignLog.campaign_id == campaign.id)
        .distinct()
        .all()
    }
    contacts_data = [
        {"number": c.number, "name": c.name}
        for c in contact_list.contacts
        if c.number not in processed_numbers
    ]

    conn = (
        db.query(models.Connection)
        .filter(
            models.Connection.id == campaign.connection_id,
            models.Connection.user_id == current_user.id,
        )
        .first()
    )
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    campaign.status = "processing"
    db.commit()

    campaign_dict = {
        "id": campaign.id,
        "message_body": campaign.message_body,
        "media_url": campaign.media_url,
        "media_type": campaign.media_type,
        "messages_per_minute": campaign.messages_per_minute
    }

    connection_dict = {
        "api_url": conn.api_url,
        "api_key": conn.api_key,
        "instance_name": conn.instance_name
    }

    background_tasks.add_task(services.publish_campaign_to_queue, campaign_dict, connection_dict, contacts_data)

    return {"status": "resumed", "campaign_id": campaign.id, "total_contacts": len(contacts_data)}

# ==========================================
# 📊 STATS & LOGS
# ==========================================

@app.get("/campaigns/{campaign_id}/stats")
def get_campaign_stats(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    campaign = (
        db.query(models.Campaign)
        .filter(
            models.Campaign.id == campaign_id,
            models.Campaign.user_id == current_user.id,
        )
        .first()
    )
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
def get_campaign_logs(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    campaign = (
        db.query(models.Campaign)
        .filter(models.Campaign.id == campaign_id)
        .first()
    )
    if not campaign or campaign.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return (
        db.query(models.CampaignLog)
        .filter(models.CampaignLog.campaign_id == campaign_id)
        .all()
    )
