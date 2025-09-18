#include "fiobj_str.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <http.h>
#include <sqlite3.h>

/*** Fields/indexes of the Review Table ***/
enum TableIndexes {TITLE, NOTE, DATE, SEASON};


/*** Creates a new database given a specific path ***/
int init_database(const char* db_path, sqlite3** db) {
    int response = sqlite3_open(db_path, db);
    
    if (response != SQLITE_OK) {
        fprintf(stderr, "[-] can't create DB: %s\n", sqlite3_errmsg(*db));
        return response;
    }
    
    const char* create_table_sql = 
        "CREATE TABLE IF NOT EXISTS REVIEW ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "title TEXT NOT NULL,"
        "note INT NOT NULL,"
        "date TEXT DEFAULT CURRENT_TIMESTAMP,"
        "season INTEGER DEFAULT NULL);";

    char *err_msg = NULL;
    response = sqlite3_exec(*db, create_table_sql, NULL, NULL, &err_msg);
    
    if (response != SQLITE_OK) {
        fprintf(stderr, "[-] SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
        return response;
    }

    printf("[+] database initialized successfully\n");
    return SQLITE_OK;
}

void generate_reviews_html(http_s* request, sqlite3* db) {
    sqlite3_stmt* stmt;
    const char* sql = "SELECT title, note, date, season FROM REVIEW";
    int response = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);

    if (response != SQLITE_OK) {
        fprintf(stderr, "[-] SQL prepare error: %s\n", sqlite3_errmsg(db));
        http_send_error(request, 500);
        return;
    }

    // Start the HTML code
    FIOBJ html = fiobj_str_buf(1024);
    char* code = "<!DOCTYPE html>"
        "<html><head><title>Reviews</title></head>"
        "<body><h1>Films and Series reviews</h1><ul>";
    fiobj_str_write(html, code, strlen(code));

    while ((response = sqlite3_step(stmt)) == SQLITE_ROW) {
        // Fetch a new entry from the DB and show its fields
        const char* title = (const char*) sqlite3_column_text(stmt, TITLE);
        const int note = sqlite3_column_int(stmt, NOTE);
        const char* date = (const char*) sqlite3_column_text(stmt, DATE);
        const int season = sqlite3_column_int(stmt, SEASON);
        FIOBJ section = fiobj_str_buf(256);
    
        if (!season) {
            // season == NULL -> its a film
            fiobj_str_printf(section, "<li><strong>%s</strong> [%d*] "
                "[%s]</li>", title, note, date? date : "-/-/-");
        } else {
            // season != NULL -> its a series, so add the season number
            fiobj_str_printf(section, "<li><strong>%s</strong> [s%d] [%d*] "
                "[%s]</li>", title, season, note, date? date : "-/-/-");
        }

        fiobj_str_concat(html, section);
        fiobj_free(section);
    }

    // Close and send the HTML code    
    code = "</ul></body></html>";
    fiobj_str_write(html, code, strlen(code));
    http_set_header(request, HTTP_HEADER_CONTENT_TYPE, http_mimetype_find("html", 4));    

    const fio_str_info_s body = fiobj_obj2cstr(html);
    http_send_body(request, body.data, body.len);
    fiobj_free(html);
    sqlite3_finalize(stmt);
}

void on_http_request(http_s* request) {
    sqlite3* db = (sqlite3*) http_settings(request)->udata;
    generate_reviews_html(request, db);
    http_finish(request);
}

void print_help(void) {
    printf("usage: films --path <path> [options]\n"
           "options:\n"
           "--path <path> SQLite database path (required)\n"
           "--new-db      Create and use a new SQLite database\n"
           "--help        Show this help message\n");
}


int main(int argc, const char* argv[]){
    char* db_path = NULL;
    int new_db = 0;
    sqlite3* db = NULL;
    int response;

    for (int i = 1; i < argc; ++i) {
        if (!strcmp(argv[i], "--help")) {
            print_help();
            return EXIT_SUCCESS;
        }
        if (!strcmp(argv[i], "--new-db")) {
            new_db = 1;
        }
        else if (!strcmp(argv[i], "--path") && (i < argc - 1)) {
            db_path = (char*) argv[++i];
        }
    }

    if (db_path == NULL) {
        printf("[-] SQLite database path is mandatory\n");
        print_help();
        return EXIT_FAILURE;
    }

    if (new_db) {
        // Create a DB & open a connection
        response = init_database(db_path, &db);

        if (response != SQLITE_OK) {
            return response;
        }
    } else {
        // Just create a new connection
        response = sqlite3_open(db_path, &db);

        if (response != SQLITE_OK) {
            fprintf(stderr, "[-] can't open the SQLite database: %s\n",
                sqlite3_errmsg(db));
            return response;
        }
    }

    response = http_listen("3550", NULL, .on_request = on_http_request,
        .udata = db, .log = 1);

    if (response == -1) {
        printf("[-] port 3550 is not available\n");
        sqlite3_close(db);
        return EXIT_FAILURE;
    }

    printf("[+] server running at port 3550\n");
    fio_start(.threads = 1, .workers = 1);
    sqlite3_close(db);
    return EXIT_SUCCESS;
}
