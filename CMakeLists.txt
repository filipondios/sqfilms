cmake_minimum_required(VERSION 3.21)
project(sqfilms VERSION 1.0.0 LANGUAGES C)
set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "Static library" FORCE)

set(CMAKE_C_FLAGS_DEBUG "-O0 -g3 -Wall -Wextra -Wpedantic")
set(CMAKE_C_FLAGS_RELEASE "-O3 -DNDEBUG -march=native -flto -Wall -Wextra -Wpedantic")

file(GLOB_RECURSE SOURCES "${CMAKE_CURRENT_SOURCE_DIR}/src/*.c")
add_executable(sqfilms ${SOURCES})

set_target_properties(sqfilms PROPERTIES
  OUTPUT_NAME sqfilms
  POSITION_INDEPENDENT_CODE ON)

add_subdirectory(external/facil.io)
add_subdirectory(external/sqlite3-cmake)

target_link_libraries(sqfilms PRIVATE facil.io SQLite3)
set_property(TARGET sqfilms PROPERTY POSITION_INDEPENDENT_CODE ON)
