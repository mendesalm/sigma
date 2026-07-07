GLOBAL_ACCESS_ROLES = [
    "Venerável Mestre",
    "Secretário",
    "Tesoureiro",
    "Chanceler",
    "Orador",
    "1º Vigilante",
    "2º Vigilante",
]

def check_document_access(user_payload: dict, required_degree: int | str) -> bool:
    """
    Check if the user has permission to access a document restricted by degree.
    """
    user_type = user_payload.get("user_type")
    
    # Super admins and webmasters have full access
    if user_type in ["super_admin", "webmaster"]:
        return True

    # Members checks
    if user_type == "member":
        # Check global access roles
        user_roles = user_payload.get("roles", [])
        for role in user_roles:
            if role in GLOBAL_ACCESS_ROLES:
                return True
        
        # Fallback to degree check
        user_degree_str = user_payload.get("degree")
        if not user_degree_str:
            return False # Assume lowest access if degree is somehow missing
        
        try:
            user_degree = int(user_degree_str)
            req_degree = int(required_degree)
            
            return user_degree >= req_degree
        except ValueError:
            return False

    return False
