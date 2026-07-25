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


def _table_columns(conn, table_name):
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return [row[1] for row in rows]


def _ensure_exact_table(conn, table_name, create_sql):
    table_exists = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,),
    ).fetchone()

    if table_exists is None:
        conn.execute(create_sql)
        return


def init_db():
    """ Initializes the database with the strict schema expected by the app. """
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
            _ensure_exact_table(
                conn,
                "REVIEW",
                """
                CREATE TABLE REVIEW (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    note FLOAT NOT NULL,
                    date TEXT DEFAULT CURRENT_TIMESTAMP,
                    season INTEGER DEFAULT NULL,
                    imdb_link TEXT DEFAULT NULL,
                    poster_url TEXT DEFAULT NULL
                );
                """,
            )
            _ensure_exact_table(
                conn,
                "TOSEE",
                """
                CREATE TABLE TOSEE (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    media_type TEXT NOT NULL,
                    imdb_link TEXT DEFAULT NULL,
                    seasons INTEGER DEFAULT NULL,
                    poster_url TEXT DEFAULT NULL
                );
                """,
            )
        print("[+] database initialized successfully")
    except Exception as e:
        raise RuntimeError(f"failed to open or create database: {e}")