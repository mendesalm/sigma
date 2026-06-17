from app.shared.base_model import DegreeEnum

# Map degrees to integer hierarchy for comparison
DEGREE_LEVELS = {
    DegreeEnum.APPRENTICE: 1,
    DegreeEnum.FELLOW: 2,
    DegreeEnum.MASTER: 3,
    DegreeEnum.INSTALLED_MASTER: 4,
}

GLOBAL_ACCESS_ROLES = [
    "Venerável Mestre",
    "Secretário",
    "Tesoureiro",
    "Chanceler",
    "Orador",
    "1º Vigilante",
    "2º Vigilante",
]

def check_document_access(user_payload: dict, required_degree: str | DegreeEnum) -> bool:
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
            # Handle string conversions if necessary
            user_degree = DegreeEnum(user_degree_str)
            req_degree = DegreeEnum(required_degree) if isinstance(required_degree, str) else required_degree
            
            user_level = DEGREE_LEVELS.get(user_degree, 1)
            req_level = DEGREE_LEVELS.get(req_degree, 1)
            
            return user_level >= req_level
        except ValueError:
            return False

    return False
