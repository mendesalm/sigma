import sys

file_path = r'app/modules/sessions/models.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

models_to_add = '''

class AbsenceJustificationStatusEnum(enum.StrEnum):
    PENDING = "Pendente"
    APPROVED = "Aprovado"
    REJECTED = "Rejeitado"

class AbsenceJustification(BaseModel):
    __tablename__ = "absence_justifications"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    justification_text = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    status = Column(
        SQLAlchemyEnum(AbsenceJustificationStatusEnum, name="absence_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AbsenceJustificationStatusEnum.PENDING,
    )
    reviewed_by_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    
    session = relationship("MasonicSession", backref="absence_justifications")
    member = relationship("Member", foreign_keys=[member_id], backref="absence_justifications")
    reviewed_by = relationship("Member", foreign_keys=[reviewed_by_id])
    
    __table_args__ = (UniqueConstraint("session_id", "member_id", name="_member_session_absence_uc"),)
'''

content += models_to_add

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
