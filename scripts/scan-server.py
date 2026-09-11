import socket

def scan_port(host, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

host = '192.62.97.30'
ports = [22, 80, 443, 3000, 3389, 8080]

print('Scanning ' + host + '...')
for port in ports:
    is_open = scan_port(host, port)
    status = 'OPEN' if is_open else 'CLOSED'
    print('Port ' + str(port) + ': ' + status)
