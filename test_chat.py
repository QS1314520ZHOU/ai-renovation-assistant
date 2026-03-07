import urllib.request
import json

# Ensure you have a valid token from a previous run or use the register endpoint
BASE_URL = "http://localhost:8000/api/v1"

def test_chat():
    # 1. Register/Login to get token
    reg_url = f"{BASE_URL}/auth/register"
    reg_data = json.dumps({"phone": "13912345678", "password": "password123", "nickname": "testuser"}).encode()
    req = urllib.request.Request(reg_url, data=reg_data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        resp = urllib.request.urlopen(req)
        auth_data = json.loads(resp.read().decode())
        token = auth_data["data"]["access_token"]
        print("Login successful")

        # 2. Call chat
        chat_url = f"{BASE_URL}/ai/chat"
        chat_data = json.dumps({"message": "你好，我想装修", "session_type": "consultation"}).encode()
        chat_req = urllib.request.Request(chat_url, data=chat_data, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }, method="POST")
        
        print("Sending chat request...")
        chat_resp = urllib.request.urlopen(chat_req)
        print("Chat response:", chat_resp.read().decode())

    except Exception as e:
        if hasattr(e, 'read'):
            print("Error details:", e.read().decode())
        else:
            print("Error:", e)

if __name__ == "__main__":
    test_chat()
