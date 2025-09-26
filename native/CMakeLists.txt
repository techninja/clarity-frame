cmake_minimum_required(VERSION 3.10)
project(ClarityFrame)

set(CMAKE_CXX_STANDARD 17)

find_package(PkgConfig REQUIRED)
pkg_check_modules(SDL2 REQUIRED sdl2)
pkg_check_modules(SDL2_IMAGE REQUIRED SDL2_image)

add_executable(clarity-frame main.cpp)

target_link_libraries(clarity-frame ${SDL2_LIBRARIES} ${SDL2_IMAGE_LIBRARIES})
target_include_directories(clarity-frame PRIVATE ${SDL2_INCLUDE_DIRS} ${SDL2_IMAGE_INCLUDE_DIRS})
target_compile_options(clarity-frame PRIVATE ${SDL2_CFLAGS_OTHER} ${SDL2_IMAGE_CFLAGS_OTHER})