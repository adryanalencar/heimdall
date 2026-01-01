from sqlalchemy import Column, Integer, String, ForeignKey, Table, Text, DateTime, UniqueConstraint
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

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    connections = relationship("Connection", back_populates="owner")
    contacts = relationship("Contact", back_populates="owner")
    tags = relationship("Tag", back_populates="owner")
    lists = relationship("ContactList", back_populates="owner")
    campaigns = relationship("Campaign", back_populates="owner")

class Connection(Base):
    __tablename__ = "connections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) 
    api_url = Column(String)      
    api_key = Column(String)      
    instance_name = Column(String) 
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="connections")
    campaigns = relationship("Campaign", back_populates="connection")

class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (
        UniqueConstraint("user_id", "number", name="uq_contacts_user_number"),
    )
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    number = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="contacts")
    tags = relationship("Tag", secondary=contact_tags, back_populates="contacts")
    lists = relationship("ContactList", secondary=list_contacts, back_populates="contacts")

class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_tags_user_name"),
    )
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="tags")
    contacts = relationship("Contact", secondary=contact_tags, back_populates="tags")

class ContactList(Base):
    __tablename__ = "contact_lists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="lists")
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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="campaigns")
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
