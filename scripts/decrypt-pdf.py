#!/usr/bin/env python3
"""
TVS VISERON — Desencriptador de PDF
"""
import os
from cryptography.fernet import Fernet

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'
PDF_DIR = 'C:/Trinnity-Viseron-System/data'

def decrypt_pdf():
    # Le chave
    key_file = os.path.join(DATA_DIR, 'encryption_key.txt')
    with open(key_file) as f:
        key = f.read().strip()
    
    cipher = Fernet(key.encode())
    
    # Le PDF encriptado
    encrypted_file = os.path.join(PDF_DIR, 'Viseron_Credenciais_TVS_ENCRYPTED.pdf')
    with open(encrypted_file, 'rb') as f:
        encrypted = f.read()
    
    # Desencripta
    decrypted = cipher.decrypt(encrypted)
    
    # Guarda PDF desencriptado
    output_file = os.path.join(PDF_DIR, 'Viseron_Credenciais_TVS.pdf')
    with open(output_file, 'wb') as f:
        f.write(decrypted)
    
    print('PDF DESENCRYPTADO: ' + output_file)
    return output_file

if __name__ == '__main__':
    decrypt_pdf()
