import requests
import time
import sys

BASE_URL = "http://localhost:5000"

def run_test():
    print("🚀 VenueFlow Auth & Tick Integration Test")
    print("-" * 50)
    
    # 1. Register User (since memory DB resets on boot)
    print("1. Registering 'sys_test_user'...")
    try:
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": "sys_test_user",
            "password": "strongpassword123"
        }, timeout=3)
        if reg_res.status_code in [201, 400]: # 400 means already exists
            print(f"   ✅ Registration returned: {reg_res.status_code}")
        else:
            print(f"   ❌ Registration failed: {reg_res.status_code} - {reg_res.text}")
            return
    except Exception as e:
        print(f"   ❌ Connection failed. Ensure backend is running. Error: {e}")
        return

    # 2. Login to get JWT
    print("\n2. Authenticating User to fetch JWT...")
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "sys_test_user",
        "password": "strongpassword123"
    })
    
    if login_res.status_code != 200:
        print(f"   ❌ Login failed: {login_res.status_code} - {login_res.text}")
        return
        
    token = login_res.json().get("token")
    if not token:
        print("   ❌ Login succeeded but no token was returned in JSON!")
        return
        
    masked_token = f"{token[:15]}...{token[-15:]}"
    print(f"   ✅ Login Successful! JWT Acquired: [{masked_token}]")
    
    # 3. Simulate Tick with Auth Header
    print("\n3. Firing internal Tick event with Bearer Token...")
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "event_phase": "🚨  Critical Phase (85th Minute)",
        "zones": [
            {"zoneId": "north-stand", "occupancy": 15000}
        ],
        "gates": [
            {"gateId": "gate-n1", "queue": 500, "isOpen": True}
        ]
    }
    
    tick_res = requests.post(f"{BASE_URL}/api/internal/tick", json=payload, headers=headers)
    
    if tick_res.status_code == 200:
        print(f"   ✅ Tick endpoint Accepted Payload (200 OK)!")
        print("   ✅ Auth Verification Complete!")
    elif tick_res.status_code == 401:
        print("   ❌ Tick rejected (401 Unauthorized). The Auth Hook Failed.")
    else:
        print(f"   ❌ Unexpected Tick return code: {tick_res.status_code} - {tick_res.text}")

if __name__ == "__main__":
    run_test()
