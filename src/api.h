#ifndef _SQFILMS_API_H_
#define _SQFILMS_API_H_

#include <http.h>
#include <sqlite3.h>

/*** Fields/indexes of the reviews table & fields count ***/
enum TableIndexes {ID, TITLE, NOTE, DATE, SEASON, TABLE_COUNT};

void handle_get_reviews(http_s* request, sqlite3* db);
void send_json_error(http_s* request, int status, const char* message);

#endif
