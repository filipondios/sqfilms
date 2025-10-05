#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <http.h>
#include <sqlite3.h>
#include "api.h"

/*** Creates a new database given a specific path ***/
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

/*** Generates the HTML code for the list of reviews given a filter ***/
void generate_reviews_list(FIOBJ html, sqlite3* db, const char* sql_filter,
        int* num_films, int* num_series) {

    const char* sql = sql_filter ?
        "SELECT * FROM REVIEW WHERE title LIKE ?" :
        "SELECT * FROM REVIEW";
    sqlite3_stmt* stmt;

    int response = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (response != SQLITE_OK) return;

    if (sql_filter) {
        char pattern[256];
        snprintf(pattern, sizeof(pattern), "%%%s%%", sql_filter);
        sqlite3_bind_text(stmt, 1, pattern, -1, SQLITE_TRANSIENT);
    }

    int series = 0;
    int films = 0;

    while ((response = sqlite3_step(stmt)) == SQLITE_ROW) {
        // Fetch a new entry from the DB and show its fields
        const int id = sqlite3_column_int(stmt, ID); // TODO Handle
        const char* title = (const char*) sqlite3_column_text(stmt, TITLE);
        const double note = sqlite3_column_double(stmt, NOTE);
        const char* date = (const char*) sqlite3_column_text(stmt, DATE);
        const int season = sqlite3_column_int(stmt, SEASON);
        FIOBJ section = fiobj_str_buf(256);
       
        if (!season) {
            // season == NULL -> its a film
            fiobj_str_printf(section,
                "<li><div class='review-header'>"
                "<h3>%s <span class='tag film'>Film</span></h3></div>"
                "<div class='review-meta'>"
                "<span class='note'>%.2f/10"
                "<img src='/img/star.svg' alt='*' class='star'></span>"
                "<span class='date'>%s</span></li>",
                title, note, date? date : "-/-/-");
            ++films;
        } else {
            // season != NULL -> its a series, so add the season number           
            fiobj_str_printf(section,
                "<li><div class='review-header'>"
                "<h3>%s <span class='tag series'>Series</span>"
                "<span class='tag season'>Season %d</span></h3>"
                "</div>"
                "<div class='review-meta'>"
                "<span class='note'>%.2f/10 "
                "<img src='/img/star.svg' alt='*' class='star'></span>"
                "<span class='date'>%s</span></li>",
                title, season, note, date? date : "-/-/-");
            ++series;
        }
        fiobj_str_concat(html, section);
        fiobj_free(section);
    }
    
    sqlite3_finalize(stmt);
    *num_films = films;
    *num_series = series;

    if (!(films + series)) {
        const char* message =
            "<div class='empty-state'>"
            "<img src='/img/warning.svg' aria-hidden='true' class='empty-icon'/>"
            "<p class='no-results'>No reviews found</p>"
            "</div>";
        fiobj_str_write(html, message, strlen(message));
    }
}

/*** Generates the HTML code for the website homepage ***/
void generate_homepage(http_s* request, sqlite3* db, const char* filter) {
    const FIOBJ html = fiobj_str_buf(1024);
    const char* code =
        "<!DOCTYPE html>"
        "<html>"
        "<head>"
        "<meta charset='utf-8'>"
        "<title>Reviews</title>"
        "<link rel='stylesheet' href='/css/main.css'>"
        "<link rel='icon' href='/img/icon.svg' type='image/svg+xml'>"
        "<script src='/js/theme.js' defer></script>"
        "</head>"
        "<body>"
        "<header class='page-header'>"
        "<div class='header-top'>"
        "<a class='title-link' href='/'><h1>Films and Series reviews</h1></a>"
        "<button id='theme-toggle'>"
        "<img src='/img/moon.svg' alt='Toggle theme'/>"
        "</button>"
        "</div>"
        "<form method='GET' action='/' class='search-bar'>"
        "<input type='text' name='title' placeholder='Filter by title' value='%s'/>"
        "<button type='submit'>Search</button>"
        "</form>"
        "</header>"
        "<div class='main-content'>"
        "<ol>";
    fiobj_str_printf(html, code, filter? filter : "");

    int num_films = 0, num_series = 0;
    generate_reviews_list(html, db, filter, &num_films, &num_series);
    fiobj_str_write(html, "</ol></div>", strlen("</ol></div>"));

    if (num_films + num_series > 0) {
        const FIOBJ summary = fiobj_str_buf(256);
        fiobj_str_printf(summary,
            "<footer class='results-summary'>"
            "%d Films, %d Series - %d Reviews total"
            "</footer>",
            num_films, num_series, num_films + num_series);
        fiobj_str_concat(html, summary);
        fiobj_free(summary);
    }
    
    // Close and send the HTML code    
    fiobj_str_write(html, "</body></html>", strlen("</body></html>"));
    http_set_header(request, HTTP_HEADER_CONTENT_TYPE, http_mimetype_find("html", 4));
    const fio_str_info_s body = fiobj_obj2cstr(html);
    http_send_body(request, body.data, body.len);
    fiobj_free(html);
}

/*** Reads an specific file and sends it to the server  ***/
void load_file(http_s* request, const char* header_str, const char* file_path) {
    const FIOBJ header = fiobj_str_new(header_str, strlen(header_str));
    http_set_header(request, HTTP_HEADER_CONTENT_TYPE, header);        

    // Omit '/' if its present
    char* path = (char*) file_path;
    if (path[0] == '/') {
        path = path + 1;
    }
    
    struct stat st;
    int fd;

    if (stat(path, &st) == -1 || (fd = open(path, O_RDONLY)) == -1) {
        printf("[-] could not find %s", path);
        http_send_error(request, 404);
        return;
    }

    http_sendfile(request, fd, st.st_size, 0);
    fiobj_free(header);
}

/*** HTTP Request handler (load page, file, etc) ***/
void on_http_request(http_s* request) {
    const char* path = fiobj_obj2cstr(request->path).data;
    sqlite3* db = (sqlite3*) http_settings(request)->udata;

    if (!strcmp("/reviews", path)) {
        handle_get_reviews(request, db);

    } else if (!strcmp("/", path) || !strcmp("/index.html", path)) {
        // The request is about the main HTML page
        // First, parse the parameters of the page
        const char* title_filter = NULL;       
        http_parse_query(request);

        if (request->params && FIOBJ_TYPE_IS(request->params, FIOBJ_T_HASH)) {
            // This condition happens when request->params is not empty
            const FIOBJ name_key = fiobj_str_new("title", strlen("title"));
            const FIOBJ name_val = fiobj_hash_get(request->params, name_key);
            fiobj_free(name_key);
    
            // Ensure that the (name_key -> name_value) pair is present            
            if (name_val && FIOBJ_TYPE_IS(name_val, FIOBJ_T_STRING)) {
                title_filter = fiobj_obj2cstr(name_val).data;
            }
        } 

        generate_homepage(request, db, title_filter);
        http_finish(request);

    } else {
        // It could be js, css, an image, etc
        const char* ext = strrchr(path, '.');
        const char* mime = NULL;

        if (ext) {
            if (!strcmp(ext, ".css")) { mime = "text/css"; }
            if (!strcmp(ext, ".js")) { mime = "application/javascript"; }
            if (!strcmp(ext, ".svg")) { mime = "image/svg+xml"; }

            if (mime) {
                load_file(request, mime, path);
                return;
            }
        }  
    }
}

void print_help(void) {
    printf("usage: films --path <path> [options]\n"
           "parameters:\n"
           "\t[--path <path>] Path to a SQLite database (required). "
           "If the database does not exist in such path, a new one is "
           "created. This last feature can be cancelled by using "
           "the option '--no-force'.\n"
           "\t[--no-force] If the file path passed to the parameter "
           "'--path' does not exist, the program will exit and not "
           "create a new empty SQLite database.\n"
           "\t[--help] Show this help message.\n");
}

int main(int argc, const char* argv[]){
    char* db_path = NULL;
    const char* port = "3550";
    int no_force = 0;
    sqlite3* db = NULL;
    int response;

    for (int i = 1; i < argc; ++i) {
        if (!strcmp(argv[i], "--help")) {
            print_help();
            return EXIT_SUCCESS;
        }
        if (!strcmp(argv[i], "--no-force")) {
            no_force = 1;
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

    response = init_database(db_path, &db, no_force);
    if (response != SQLITE_OK) {
        return response;
    }

    response = http_listen(port, NULL, .on_request = on_http_request,
        .udata = db, .log = 1);

    if (response == -1) {
        printf("[-] port %s is not available\n", port);
        sqlite3_close(db);
        return EXIT_FAILURE;
    }

    printf("[+] server running at port 3550\n");
    fio_start(.threads = 1, .workers = 1);
    sqlite3_close(db);
    return EXIT_SUCCESS;
}
