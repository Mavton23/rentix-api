import secrets

# Gera uma string segura de 32 caracteres (pode ajustar o tamanho)
secret_key = secrets.token_hex(32)  # 16 bytes = 32 caracteres hexadecimais
print(secret_key)