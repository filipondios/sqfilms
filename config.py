import argparse
import os
from pathlib import Path


def load_env_file():
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return os.environ.get("TMDB_API_KEY")

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value
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