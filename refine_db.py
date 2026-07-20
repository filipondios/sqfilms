#!/usr/bin/env python3
"""Refine existing IMDb and poster values to compact identifiers."""

import sqlite3
import sys
from pathlib import Path

from config import args
from tmdb import build_imdb_url, normalize_imdb_link, normalize_poster_url


def refine_table(conn, table):
    rows = conn.execute(f"SELECT id, imdb_link, poster_url FROM {table}").fetchall()
    updated = 0
    for row in rows:
        compact_imdb = normalize_imdb_link(row["imdb_link"])
        compact_poster = normalize_poster_url(row["poster_url"])
        if compact_imdb != row["imdb_link"] or compact_poster != row["poster_url"]:
            conn.execute(
                f"UPDATE {table} SET imdb_link = ?, poster_url = ? WHERE id = ?",
                (compact_imdb, compact_poster, row["id"]),
            )
            updated += 1
    conn.commit()
    return updated


def main():
    db_path = Path(args.path)
    if not db_path.exists():
        print(f"Database not found: {db_path}")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        total = 0
        for table in ("REVIEW", "TOSEE"):
            count = refine_table(conn, table)
            total += count
            print(f"[{table}] updated {count} rows")
        print(f"Done. Updated {total} rows.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
