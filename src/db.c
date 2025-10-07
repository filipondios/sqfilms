#include <sys/stat.h>
#include <stdio.h>
#include "db.h"

/*** Creates/Opens a SQLite database given a specific path ***/
int init_database(const char* db_path, sqlite3** db, int no_force) {
    struct stat st;

    if ((stat(db_path, &st) == -1) && no_force) {
        printf("[-] could not find %s, so program is exiting\n", db_path);
        return ~SQLITE_OK;
    }
    
    int response = sqlite3_open(db_path, db);
    
    if (response != SQLITE_OK) {
        fprintf(stderr, "[-] can't create DB: %s\n", sqlite3_errmsg(*db));
        return response;
    }
    
    const char* create_table_sql = 
        "CREATE TABLE IF NOT EXISTS REVIEW ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "title TEXT NOT NULL,"
        "note FLOAT NOT NULL,"
        "date TEXT DEFAULT CURRENT_TIMESTAMP,"
        "season INTEGER DEFAULT NULL);";

    response = sqlite3_exec(*db, create_table_sql, NULL, NULL, NULL);
    
    if (response != SQLITE_OK) {
        fprintf(stderr, "[-] SQL error: %s\n", sqlite3_errmsg(*db));
        return response;
    }

    printf("[+] database initialized successfully\n");
    return SQLITE_OK;
}

/*** Prepare statement for getting reviews (with optional title filter) ***/
sqlite3_stmt* db_get_reviews(sqlite3* db, const char* title_filter) {
    const char* sql = title_filter ?
        "SELECT * FROM REVIEW WHERE LOWER(title) LIKE LOWER(?)" :
        "SELECT * FROM REVIEW";

    sqlite3_stmt* stmt = NULL;
    int response = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (response != SQLITE_OK) {
        fprintf(stderr, "[-] SQL prepare failed: %s\n", sqlite3_errmsg(db));
        return NULL;
    }

    if (title_filter) {
        char pattern[256];
        snprintf(pattern, sizeof(pattern), "%%%s%%", title_filter);
        sqlite3_bind_text(stmt, 1, pattern, -1, SQLITE_TRANSIENT);
    }
    return stmt;
}
