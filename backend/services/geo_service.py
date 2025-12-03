import math

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula a distância em metros entre dois pontos geográficos usando a fórmula de Haversine.
    """
    R = 6371000  # Raio da Terra em metros

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def is_within_radius(user_lat: float, user_lon: float, lodge_lat: float, lodge_lon: float, radius_meters: int) -> bool:
    """
    Verifica se a localização do usuário está dentro do raio permitido da Loja.
    """
    if user_lat is None or user_lon is None or lodge_lat is None or lodge_lon is None:
        return False
        
    distance = calculate_distance(user_lat, user_lon, lodge_lat, lodge_lon)
    return distance <= radius_meters
