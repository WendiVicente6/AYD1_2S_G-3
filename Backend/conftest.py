# Archivo vacío a propósito.
#
# Su sola presencia en la raíz de Backend/ hace que pytest agregue esta
# carpeta al sys.path al momento de descubrir las pruebas. Sin esto, pytest
# agrega la carpeta de cada archivo de prueba (test/unitarias/) al path en
# lugar de Backend/, y los imports como "import routes.sessions" fallan con
# "ModuleNotFoundError: No module named 'routes'".
