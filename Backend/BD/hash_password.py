from getpass import getpass
from werkzeug.security import generate_password_hash

password = getpass("Contraseña: ")
print("\nHash para guardar en tusuario.password:\n")
print(generate_password_hash(password))
