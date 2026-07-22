import requests
import json
import os
import sys

def test_get_member():
    url = "http://localhost:8000"
    
    # 1. Login to get token
    login_data = {
        "username": "272875",
        "password": "123"
    }
    
    print(f"Logging in as {login_data['username']}...")
    try:
        response = requests.post(f"{url}/auth/login/", data=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code}")
            print(response.text)
            return
            
        token = response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get members to find an ID
        members_response = requests.get(f"{url}/members/", headers=headers)
        if members_response.status_code != 200:
            print(f"Failed to fetch members: {members_response.status_code}")
            print(members_response.text)
            return
            
        members = members_response.json()
        if not members:
            print("No members found")
            return
            
        member_id = members[0]["id"]
        print(f"Found member {member_id}. Fetching details...")
        
        # 3. Get member details
        details_response = requests.get(f"{url}/members/{member_id}", headers=headers)
        print(f"GET /members/{member_id} -> {details_response.status_code}")
        if details_response.status_code != 200:
            print(details_response.text)
        else:
            print("Success!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_get_member()
