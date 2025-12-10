from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import date
from models.models import Notice, NoticeTypeEnum
from schemas.notice_schemas import NoticeCreate, NoticeUpdate

class NoticeService:

    @staticmethod
    def get_notices(db: Session, lodge_id: int, active_only: bool = True) -> List[Notice]:
        query = db.query(Notice).filter(Notice.lodge_id == lodge_id)
        if active_only:
             # Check is_active AND expiration_date
             today = date.today()
             query = query.filter(
                 Notice.is_active == True,
                 (Notice.expiration_date == None) | (Notice.expiration_date >= today)
             )
        return query.all()

    @staticmethod
    def create_notice(db: Session, notice_data: NoticeCreate) -> Notice:
        new_notice = Notice(**notice_data.dict())
        db.add(new_notice)
        db.commit()
        db.refresh(new_notice)
        return new_notice

    @staticmethod
    def update_notice(db: Session, notice_id: int, update_data: NoticeUpdate) -> Optional[Notice]:
        notice = db.query(Notice).filter(Notice.id == notice_id).first()
        if not notice:
            return None
        
        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(notice, key, value)
            
        db.commit()
        db.refresh(notice)
        return notice

    @staticmethod
    def delete_notice(db: Session, notice_id: int):
        notice = db.query(Notice).filter(Notice.id == notice_id).first()
        if notice:
            db.delete(notice)
            db.commit()
