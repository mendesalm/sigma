import socket
import sys

ip = '69.62.89.211'
port = 3306
timeout = 5

try:
    print(f"Attempting to connect to {ip}:{port}...", flush=True)
    sock = socket.create_connection((ip, port), timeout)
    print("Connection successful!", flush=True)
    sock.close()
except socket.timeout:
    print("Connection timed out.", flush=True)
except ConnectionRefusedError:
    print("Connection refused.", flush=True)
except Exception as e:
    print(f"Connection failed: {e}", flush=True)
