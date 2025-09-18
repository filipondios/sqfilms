cmake_minimum_required(VERSION 3.21)
project(mceliece VERSION 1.0.0 LANGUAGES C)
set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "Static library" FORCE)

file(GLOB_RECURSE SOURCES "${CMAKE_CURRENT_SOURCE_DIR}/src/*.c")
add_executable(films ${SOURCES})

set_target_properties(films PROPERTIES
  OUTPUT_NAME films
  POSITION_INDEPENDENT_CODE ON)

add_subdirectory(external/facil.io)
add_subdirectory(external/sqlite3-cmake)

target_link_libraries(films PRIVATE facil.io SQLite3)
set_property(TARGET films PROPERTY POSITION_INDEPENDENT_CODE ON)
