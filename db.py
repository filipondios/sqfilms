import os
import sqlite3
from config import args

DB_PATH = args.path

def get_db():
    """ Yields a DB connection """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try: yield conn
    finally: conn.close()


def init_db():
    """ Initializes the database """
    db_exists = os.path.exists(DB_PATH)

    if not db_exists:
        if args.no_force:
            raise FileNotFoundError(f"could not find {DB_PATH}")
        else:
            print(f"[+] creating database path {DB_PATH}")
            parent_dir = os.path.dirname(os.path.abspath(DB_PATH))
            if parent_dir: os.makedirs(parent_dir, exist_ok=True)

    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS REVIEW (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    note FLOAT NOT NULL,
                    date TEXT DEFAULT CURRENT_TIMESTAMP,
                    season INTEGER DEFAULT NULL,
                    imdb_link TEXT DEFAULT NULL
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS TOSEE (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    media_type TEXT NOT NULL,
                    imdb_link TEXT DEFAULT NULL,
                    seasons INTEGER DEFAULT NULL
                );
            """)
        print("[+] database initialized successfully")
    except Exception as e:
        raise RuntimeError(f"failed to open or create database: {e}")