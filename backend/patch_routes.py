import sys
import re

with open(r'C:\Users\engan\onedrive\Área de Trabalho\sigma\backend\app\modules\members\routes\member_routes.py', 'r', encoding='utf-8') as f:
    text = f.read()

old_code = '''        update_data = member.model_dump(exclude_unset=True)
        if "password" in update_data:
            db_member.password_hash = hash_password(update_data.pop("password"))

        for key, value in update_data.items():
            setattr(db_member, key, value)'''

new_code = '''        update_data = member.model_dump(exclude_unset=True)
        if "password" in update_data:
            db_member.password_hash = hash_password(update_data.pop("password"))

        family_members_data = update_data.pop('family_members', None)
        masonic_history_data = update_data.pop('masonic_history', None)
        decorations_data = update_data.pop('decorations', None)

        for key, value in update_data.items():
            setattr(db_member, key, value)
            
        import app.models as models
        if family_members_data is not None:
            db.query(models.FamilyMember).filter(models.FamilyMember.member_id == db_member.id).delete()
            for fm in family_members_data:
                db.add(models.FamilyMember(**fm, member_id=db_member.id))

        if masonic_history_data is not None:
            db.query(models.MasonicEvent).filter(models.MasonicEvent.member_id == db_member.id).delete()
            for mh in masonic_history_data:
                mh_dict = mh.copy()
                mh_dict.pop('diploma', None)
                db.add(models.MasonicEvent(**mh_dict, member_id=db_member.id))
                
        if decorations_data is not None:
            db.query(models.Decoration).filter(models.Decoration.member_id == db_member.id).delete()
            for dec in decorations_data:
                db.add(models.Decoration(**dec, member_id=db_member.id))'''

text = text.replace(old_code, new_code)

with open(r'C:\Users\engan\onedrive\Área de Trabalho\sigma\backend\app\modules\members\routes\member_routes.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched member_routes.py')
