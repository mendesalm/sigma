from fastapi import HTTPException, status
from app.shared.security.constants import UserTypeEnum

def verify_resource_ownership(current_user: dict, resource_owner_id: int):
    """
    ABAC (Attribute-Based Access Control) validator to check if a user 
    can modify a specific resource based on ownership rules.
    """
    user_type = current_user.get("user_type")
    
    # Super Admin bypass
    if user_type == UserTypeEnum.SUPER_ADMIN:
        return True
        
    # Webmaster bypass (Webmasters can edit anyone in their lodge)
    if user_type == UserTypeEnum.WEBMASTER:
        return True
        
    # Member logic
    if user_type == UserTypeEnum.MEMBER:
        # Check active roles to bypass for administrators like Secretário and Chanceler
        active_role = current_user.get("active_role_name")
        if active_role in ["Secretário", "Chanceler", "Venerável Mestre", "Hospitaleiro"]:
            return True
            
        current_user_id = current_user.get("user_id")
        if current_user_id == resource_owner_id:
            return True
            
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access or modify this resource. Ownership or specific role required."
    )
