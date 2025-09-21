<!-- # sqfilms -->

A minimalist movie & series review web app built in C with facil.io and SQLite.

## Building with CMake

After cloning this repository, you first need to initialize the git submodules.  
In this case, the dependencies are [sqlite3 3.50.2](https://github.com/sqlite/sqlite/tree/9d7c5df7f0e42528bf514b5231d58273bea47e40)
and [facil.io 0.7.6](https://github.com/boazsegev/facil.io/tree/512a354dbd31e1895647df852d1565f9d408ed91).

```bash
git clone https://github.com/filipondios/sqfilms
cd sqfilms && git submodule update --init --recursive
```

The `CMakePresets.json` file supports building for `x64` and `x86` architectures, in
any mode `debug` or `release` for Linux. The compilation process is very
simple: first you must choose a preset and the compile that preset.
These are some examples:

```sh
# Compile the project for x64 linux release mode
cmake --preset x64-release-linux
cmake --build --preset x64-release-linux

# Compile the project for x86 linux debug mode
cmake --preset x86-debug-linux
cmake --build --preset x86-debug-linux
```

> [!IMPORTANT]
> After running build commands with a preset `<preset>`, you should find the application
> executable binary file at `out/build/<preset>/` and it must be named `sqfilms`.

Once you run the command `cmake --preset <preset>`, the `out/build/<preset>/compile_commands.json`
file will be created. This file is used by the [clangd](https://github.com/clangd/clangd) LSP
to provide C/C++ IDE features to many editors. However, this file needs to be in the
root of the project. The best option is to create a symlink to the file:

```sh
cd /path/to/mceliece
PRESET="x64-release-linux"
cmake --preset $PRESET
ln -s out/build/$PRESET/compile_commands.json compile_commands.json
```

> [!IMPORTANT]
> This project currently only runs on Linux (not on Windows, macOS, Unix, or Solaris)
> due to the nature of the facil.io library.
> For this reason, future versions of the project are intended to run inside a Docker container.
