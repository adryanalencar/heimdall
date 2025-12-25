from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# --- Connection ---
class ConnectionBase(BaseModel):
    name: str
    api_url: str
    api_key: str
    instance_name: str

class ConnectionCreate(ConnectionBase):
    pass

class Connection(ConnectionBase):
    id: int
    class Config:
        orm_mode = True

# --- Tags ---
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    class Config:
        orm_mode = True

# --- Contacts ---
class ContactCreate(BaseModel):
    name: str
    number: str
    tag_ids: List[int] = []

class Contact(BaseModel):
    id: int
    name: str
    number: str
    tags: List[Tag] = []
    class Config:
        orm_mode = True

# --- Contact Lists (NOVO) ---
class ContactListBase(BaseModel):
    name: str

class ContactListCreate(ContactListBase):
    pass

class ContactList(ContactListBase):
    id: int
    contacts: List[Contact] = [] # Retorna os contatos da lista
    class Config:
        orm_mode = True

# --- Campaign ---
class CampaignCreate(BaseModel):
    name: str
    message_body: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    messages_per_minute: int = 10
    contact_list_id: Optional[int] = None
    target_tags_ids: Optional[List[int]] = None
    connection_id: int

class Campaign(BaseModel):
    id: int
    name: str
    message_body: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    messages_per_minute: int
    status: str
    connection_id: int
    contact_list_id: int
    # connection: Connection  <-- Opcional: Se quiser aninhar os dados da conexão
    class Config:
        orm_mode = True