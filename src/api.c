#include <stdio.h>
#include <sqlite3.h>
#include "api.h"
#include "db.h"

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

    sqlite3_stmt* stmt = db_get_reviews(db, title_filter);
    if (!stmt) {
        send_json_error(request, 500, "Database query failed");
        return;
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

void send_json_error(http_s* request, int status, const char* message) {
    request->status = status;
    http_set_header(request, HTTP_HEADER_CONTENT_TYPE,
        http_mimetype_find("json", strlen("json")));

    FIOBJ obj = fiobj_hash_new();
    fiobj_hash_set(obj, fiobj_str_new("error", strlen("error")),
        fiobj_str_new(message, strlen(message)));

    FIOBJ json = fiobj_obj2json(obj, 0);
    fio_str_info_s str = fiobj_obj2cstr(json);
    http_send_body(request, str.data, str.len);

    fiobj_free(json);
    fiobj_free(obj);
}
