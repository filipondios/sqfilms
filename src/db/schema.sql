CREATE TABLE IF NOT EXISTS review (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    note        REAL NOT NULL CHECK (note >= 0 AND note <= 10),
    date        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d', 'now')),
    season      INTEGER DEFAULT NULL,
    imdb_link   TEXT DEFAULT NULL,
    poster_url  TEXT DEFAULT NULL,
    tmdb_id     INTEGER DEFAULT NULL,
    media_type  TEXT DEFAULT NULL CHECK (media_type IN ('movie', 'tv'))
);

CREATE INDEX IF NOT EXISTS idx_review_title ON review (title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_review_tmdb_id ON review (tmdb_id);

CREATE TABLE IF NOT EXISTS tosee (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    media_type  TEXT NOT NULL CHECK (media_type IN ('movie', 'series')),
    imdb_link   TEXT DEFAULT NULL,
    seasons     INTEGER DEFAULT NULL,
    poster_url  TEXT DEFAULT NULL,
    tmdb_id     INTEGER DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_cache (
    tmdb_id      INTEGER NOT NULL,
    media_type   TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    title        TEXT NOT NULL,
    poster_path  TEXT DEFAULT NULL,
    score        REAL NOT NULL,
    computed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (tmdb_id, media_type)
);