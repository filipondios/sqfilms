import argparse
import os
from pathlib import Path

from dotenv import load_dotenv


def load_env_file():
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    return os.environ.get("TMDB_API_KEY")


def get_tmdb_api_key():
    return os.environ.get("TMDB_API_KEY") or load_env_file()


def parse_args(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--path", required=True,
        help="Ruta al archivo de la base de datos SQLite")
    parser.add_argument("--no-force", action="store_true",
        help="Si se activa, el programa fallará si la base de datos no existe previamente")
    return parser.parse_known_args(argv)[0]


args = parse_args()
load_env_file()