from sqlalchemy import Column, Integer, String, ForeignKey, Table, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Tabelas Associativas
contact_tags = Table('contact_tags', Base.metadata,
    Column('contact_id', Integer, ForeignKey('contacts.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

list_contacts = Table('list_contacts', Base.metadata,
    Column('list_id', Integer, ForeignKey('contact_lists.id')),
    Column('contact_id', Integer, ForeignKey('contacts.id'))
)

class Connection(Base):
    __tablename__ = "connections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) 
    api_url = Column(String)      
    api_key = Column(String)      
    instance_name = Column(String) 
    campaigns = relationship("Campaign", back_populates="connection")

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    number = Column(String, unique=True, index=True)
    tags = relationship("Tag", secondary=contact_tags, back_populates="contacts")
    lists = relationship("ContactList", secondary=list_contacts, back_populates="contacts")

class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    contacts = relationship("Contact", secondary=contact_tags, back_populates="tags")

class ContactList(Base):
    __tablename__ = "contact_lists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    contacts = relationship("Contact", secondary=list_contacts, back_populates="lists")

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    message_body = Column(Text)
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True) # image, video, document
    messages_per_minute = Column(Integer, default=10)
    status = Column(String, default="draft")
    
    contact_list_id = Column(Integer, ForeignKey('contact_lists.id'))
    
    connection_id = Column(Integer, ForeignKey('connections.id'))
    connection = relationship("Connection", back_populates="campaigns")

    logs = relationship("CampaignLog", back_populates="campaign")

class CampaignLog(Base):
    __tablename__ = "campaign_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    contact_number = Column(String)
    contact_name = Column(String)
    
    status = Column(String) # "sent", "failed", "pending"
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    campaign = relationship("Campaign", back_populates="logs")