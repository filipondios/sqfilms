#include <stdio.h>
#include <sqlite3.h>
#include "api.h"
#include "fiobj_hash.h"
#include "fiobject.h"
#include "http.h"

void handle_get_reviews(http_s* request, sqlite3* db) {
    const char* title_filter = NULL;
    http_parse_query(request);

    // get <value> from the /reviews?title=<value> endpoint if possible
    if (request->params && FIOBJ_TYPE_IS(request->params, FIOBJ_T_HASH)) {
        const FIOBJ title_key = fiobj_str_new("title", strlen("title"));
        const FIOBJ title_value = fiobj_hash_get(request->params, title_key);
        fiobj_free(title_key);

        if (title_value && FIOBJ_TYPE_IS(title_value, FIOBJ_T_STRING)) {
            title_filter = fiobj_obj2cstr(title_value).data;
        }
    }
    
    const char* sql = title_filter ?
        "SELECT * FROM REVIEW WHERE LOWER(title) LIKE LOWER(?)" :
        "SELECT * FROM REVIEW";
    sqlite3_stmt* stmt;

    int response = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (response != SQLITE_OK) {
        http_send_error(request, 500);
    }

    if (title_filter) {
        char pattern[256];
        // prepare SQL statement (with the title filter)
        snprintf(pattern, sizeof(pattern), "%%%s%%", title_filter);
        sqlite3_bind_text(stmt, 1, pattern, -1, SQLITE_TRANSIENT);
    }
    
    // prepare JSON response fields
    FIOBJ fields[TABLE_COUNT];
    fields[ID] = fiobj_str_new("id", strlen("id"));
    fields[TITLE] = fiobj_str_new("title", strlen("title"));
    fields[NOTE] = fiobj_str_new("note", strlen("note"));
    fields[DATE] = fiobj_str_new("date", strlen("date"));
    fields[SEASON] = fiobj_str_new("season", strlen("season"));
    const FIOBJ reviews = fiobj_ary_new();

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        // Fetch SQLite row data: id, title, note, date, season
        const FIOBJ review = fiobj_hash_new();
        const FIOBJ id = fiobj_num_new(sqlite3_column_int(stmt, ID));
        const double note = fiobj_float_new(sqlite3_column_double(stmt, NOTE));

        const char* title_str = (const char*) sqlite3_column_text(stmt, TITLE);
        const FIOBJ title = fiobj_str_new(title_str, strlen(title_str));

        char* date_str = (char*) sqlite3_column_text(stmt, DATE);
        date_str = date_str? date_str : "";
        const FIOBJ date = fiobj_str_new(date_str, strlen(date_str));

        // Build the JSON for the current row
        fiobj_hash_set(review, fields[ID], id);
        fiobj_hash_set(review, fields[TITLE], title);
        fiobj_hash_set(review, fields[NOTE], note);
        fiobj_hash_set(review, fields[DATE], date);

        if (sqlite3_column_type(stmt, SEASON) == SQLITE_NULL) {
            fiobj_hash_set(review, fields[SEASON], fiobj_null());
        } else {
            const FIOBJ season = fiobj_num_new(sqlite3_column_int(stmt, SEASON));
            fiobj_hash_set(review, fields[SEASON], season);
            fiobj_free(season);
        }
        
        fiobj_ary_push(reviews, review);
        fiobj_free(id);
        fiobj_free(note);
        // Do not free strings (JSON alloc)!
    }

    const FIOBJ mimetype = http_mimetype_find("json", strlen("json"));
    http_set_header(request, HTTP_HEADER_CONTENT_TYPE, mimetype);

    const FIOBJ json = fiobj_obj2json(reviews, 0);
    const fio_str_info_s str = fiobj_obj2cstr(json);
    http_send_body(request, str.data, str.len);

    fiobj_free(json);
    fiobj_free(reviews);
}
