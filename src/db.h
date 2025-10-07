#ifndef _SQFILMS_DB_H_
#define _SQFILMS_DB_H_

#include <sqlite3.h>

int init_database(const char* db_path, sqlite3** db, int no_force);
sqlite3_stmt* db_get_reviews(sqlite3* db, const char* title_filter);

#endif
