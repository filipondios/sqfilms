import argparse

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--path", required=True, 
        help="Ruta al archivo de la base de datos SQLite")
    parser.add_argument("--no-force", action="store_true", 
        help="Si se activa, el programa fallará si la base de datos no existe previamente")
    return parser.parse_args()
args = parse_args()