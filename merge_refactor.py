
        if family_members_data is not None:
            existing_fms = {fm.id: fm for fm in db_member.family_members}
            incoming_fms = []
            for fm in family_members_data:
                fm_dict = fm if isinstance(fm, dict) else fm.model_dump(exclude_unset=True) if hasattr(fm, 'model_dump') else fm.dict(exclude_unset=True)
                fm_id = fm_dict.pop('id', None)
                if fm_id and fm_id in existing_fms:
                    incoming_fms.append(fm_id)
                    for k, v in fm_dict.items():
                        setattr(existing_fms[fm_id], k, v)
                else:
                    db.add(members_models.FamilyMember(**fm_dict, member_id=db_member.id))
            for fm_id, fm in existing_fms.items():
                if fm_id not in incoming_fms:
                    db.delete(fm)

        if masonic_history_data is not None:
            existing_mhs = {mh.id: mh for mh in db_member.masonic_history}
            incoming_mhs = []
            for mh in masonic_history_data:
                mh_dict = mh if isinstance(mh, dict) else mh.model_dump(exclude_unset=True) if hasattr(mh, 'model_dump') else mh.dict(exclude_unset=True)
                mh_id = mh_dict.pop('id', None)
                mh_dict.pop('diploma', None)
                if mh_id and mh_id in existing_mhs:
                    incoming_mhs.append(mh_id)
                    for k, v in mh_dict.items():
                        setattr(existing_mhs[mh_id], k, v)
                else:
                    db.add(members_models.MasonicEvent(**mh_dict, member_id=db_member.id))
            for mh_id, mh in existing_mhs.items():
                if mh_id not in incoming_mhs:
                    db.delete(mh)

        if decorations_data is not None:
            existing_decs = {dec.id: dec for dec in db_member.decorations}
            incoming_decs = []
            for dec in decorations_data:
                dec_dict = dec if isinstance(dec, dict) else dec.model_dump(exclude_unset=True) if hasattr(dec, 'model_dump') else dec.dict(exclude_unset=True)
                dec_id = dec_dict.pop('id', None)
                if dec_id and dec_id in existing_decs:
                    incoming_decs.append(dec_id)
                    for k, v in dec_dict.items():
                        setattr(existing_decs[dec_id], k, v)
                else:
                    db.add(members_models.Decoration(**dec_dict, member_id=db_member.id))
            for dec_id, dec in existing_decs.items():
                if dec_id not in incoming_decs:
                    db.delete(dec)
