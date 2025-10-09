use rusqlite::{params, Connection};
use std::sync::{Arc, Mutex};
use serde::Serialize;
use std::path::Path;
use std::fs;

pub type SQConn = Arc<Mutex<Connection>>;

#[derive(Serialize, Debug)]
pub struct Review {
    pub id: i32,
    pub title: String,
    pub note: f64,
    pub date: String,
    pub season: Option<i32>,
}

pub fn init_db(path: &str, no_force: bool) -> SQConn {
    let db_path = Path::new(path);
    let exists = db_path.exists();

    if !exists {
        if no_force {
            eprintln!("[-] could not find {}", path);
            std::process::exit(1);
        } else {
            println!("[+] creating database path {}", path);
            if let Some(parent) = db_path.parent() {
                if let Err(e) = fs::create_dir_all(parent) {
                    eprintln!("[-] could not create {:?}: {}", parent, e);
                    std::process::exit(1);
                }
            }
        }
    }

    let conn = Connection::open(path).unwrap_or_else(|e| {
        eprintln!("[-] failed to open or create database: {}", e);
        std::process::exit(1);
    });

    let create_table_sql = "
        CREATE TABLE IF NOT EXISTS REVIEW (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            note FLOAT NOT NULL,
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            season INTEGER DEFAULT NULL
        );
    ";

    if let Err(e) = conn.execute(create_table_sql, []) {
        eprintln!("[-] SQL error while creating table: {}", e);
        std::process::exit(1);
    }

    println!("[+] database initialized successfully");
    Arc::new(Mutex::new(conn))
}

pub fn fetch_reviews(conn: &Connection, title: Option<&str>)
    -> rusqlite::Result<Vec<Review>> {

    let mapper = |row: &rusqlite::Row| {
        Ok(Review {
            id: row.get(0)?,
            title: row.get(1)?,
            note: row.get(2)?,
            date: row.get(3)?,
            season: row.get(4)?,
        })
    };

    let sql = if title.is_some() {
        "SELECT * FROM REVIEW WHERE LOWER(TITLE) LIKE LOWER(?)"
    } else { "SELECT * FROM REVIEW" };

    let mut stmt = conn.prepare(sql)?;
    let mapped = match title {
        Some(t) => {
            let pattern = format!("%{}%", t);
            stmt.query_map(params![pattern], mapper)?
        }
        None => stmt.query_map([], mapper)?,
    };

    Ok(mapped.filter_map(Result::ok).collect())
}

pub fn insert_review(conn: &Connection, title: &str, note: f64,
    date: Option<&str>, season: Option<i32>) -> rusqlite::Result<Review> {

    let date_str = date.unwrap_or_else(||
        chrono::Local::now().format("%Y-%m-%d")
        .to_string().leak());

    let sql = "INSERT INTO REVIEW (TITLE, NOTE, DATE, SEASON) VALUES (?, ?, ?, ?)";
    conn.execute(sql, params![title, note, date_str, season])?;
    let id = conn.last_insert_rowid() as i32;

    Ok(Review { id, title: title.to_string(), note,
        date: date_str.to_string(), season })    
}
