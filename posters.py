#!/usr/bin/env python3
"""
Rellena el poster_url de las filas que ya existían en la base de datos
antes de que la app soportara portadas (o que se guardaron sin ninguna
coincidencia en TMDb).
"""

import argparse
import sys
import time
import sqlite3

from config import args, get_tmdb_api_key
from db import init_db
from tmdb import fetch_poster_url, normalize_poster_url


def parse_posters_args():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--force", action="store_true", default=False,
        help="Reconsulta todas las filas aunque ya tengan una portada guardada")
    parser.add_argument("--delay", type=float, default=0.0,
        help="Segundos de espera entre cada solicitud a TMDb")
    parser.add_argument("--table", choices=["review", "tosee", "both"], default="both",
        help="Qué tablas procesar: review, tosee o both")
    return parser.parse_known_args()[0]


def backfill_table(conn, table, force, delay):
    where = "IMDB_LINK IS NOT NULL AND IMDB_LINK != ''"
    if not force:
        where += " AND (POSTER_URL IS NULL OR POSTER_URL = '')"

    rows = conn.execute(f"SELECT ID, TITLE, IMDB_LINK FROM {table} WHERE {where}").fetchall()

    if not rows:
        print(f"[{table}] no hay filas pendientes de portada")
        return 0, 0

    updated, skipped = 0, 0
    print(f"[{table}] {len(rows)} fila(s) a procesar")

    for row in rows:
        poster_url = fetch_poster_url(row["IMDB_LINK"])
        if poster_url:
            compact_poster_url = normalize_poster_url(poster_url)
            conn.execute(f"UPDATE {table} SET POSTER_URL = ? WHERE ID = ?", (compact_poster_url, row["ID"]))
            conn.commit()
            updated += 1
            print(f"  [+] {row['TITLE']!r} -> {poster_url}")
        else:
            skipped += 1
            print(f"  [-] {row['TITLE']!r}: sin coincidencia en TMDb")
        time.sleep(delay)

    return updated, skipped


def main():
    poster_args = parse_posters_args()
    tmdb_key = get_tmdb_api_key()
    if not tmdb_key:
        print("[!] No se ha proporcionado ninguna API key de TMDb.")
        print("    Añade TMDB_API_KEY al archivo .env o al entorno antes de ejecutar el script.")
        sys.exit(1)

    tables = {"review": ["REVIEW"], "tosee": ["TOSEE"], "both": ["REVIEW", "TOSEE"]}[poster_args.table]

    init_db()  # asegura que las tablas y la columna poster_url existen

    conn = sqlite3.connect(args.path)
    conn.row_factory = sqlite3.Row

    total_updated, total_skipped = 0, 0
    try:
        for table in tables:
            updated, skipped = backfill_table(conn, table, poster_args.force, poster_args.delay)
            total_updated += updated
            total_skipped += skipped
    finally:
        conn.close()

    print(f"\n[+] hecho: {total_updated} portada(s) actualizada(s), {total_skipped} sin coincidencia")


if __name__ == "__main__":
    main()