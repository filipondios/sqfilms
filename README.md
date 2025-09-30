<!-- # sqfilms -->
<div align="center">
  <h1>sqfilms</h1>
  <p>A minimalist movie & series review web app built in C with <a href="https://facil.io/">facil.io</a> and
    <a href="sqlite.org">SQLite</a>.</p>
  <img height="600" alt="image" src="https://github.com/user-attachments/assets/9cce14ef-be92-438e-9d01-d583a19ce6ff"/>
</div>

> [!IMPORTANT]
> Before reading how to run the program of this project, you should keep in mind that there
> is an example SQLite database located at `data/reviews.db` in this repository.

## Running with Docker

You can run this project inside a Docker container without installing any
dependencies on your machine, using the last version image from <a href='https://hub.docker.com/r/filipondios/sqfilms'>
this project's Docker Hub</a>:

```bash
docker pull filipondios/sqfilms:beta
```

The container expects an SQLite database mounted from your host, but if the
database file does not exist, the application will create and initialize it
automatically on first run, unless you add the `--no-force` option, that
wont create any database if there is no database named `reviews.db` inside
the mounted directory.

For example, this commands will mount a host directory where the database
will be stored (`~/.films-db/reviews.db`) into the container at `/data`:

```bash
# Change this path to yours
DB_PATH="$HOME/.films-db"

docker run -it --rm \
  -p 3550:3550 \
  -v $DB_PATH:/data \
  sqfilms:beta
```

On the other hand, instead of pulling my docker image from Docker Hub, you
can clone this repository and build the Docker image:

```bash
git clone https://github.com/filipondios/sqfilms.git
cd sqfilms && docker build -t sqfilms .
```

Once the container is running, open
<a href='http://localhost:3550'>http://localhost:3550</a>
in your browser to access the web interface.


## Building with CMake

After cloning this repository, you first need to initialize the git submodules. In this case, the
dependencies are [sqlite3 3.50.2](https://github.com/sqlite/sqlite/tree/9d7c5df7f0e42528bf514b5231d58273bea47e40)
and [facil.io 0.7.6](https://github.com/boazsegev/facil.io/tree/512a354dbd31e1895647df852d1565f9d408ed91).

```bash
git clone https://github.com/filipondios/sqfilms
cd sqfilms && git submodule update --init --recursive
```

The `CMakePresets.json` file supports building for `x64` and `x86` architectures, in
any mode `debug` or `release` for Linux. The compilation process is very
simple: first you must choose a preset and then compile that preset.
These are some examples:

```sh
# Compile the project for x64 linux release mode
cmake --preset x64-release-linux
cmake --build --preset x64-release-linux

# Compile the project for x86 linux debug mode
cmake --preset x86-debug-linux
cmake --build --preset x86-debug-linux
```

> [!NOTE]
> After running build commands with a preset `<preset>`, you will find the application
> executable binary file at `out/build/<preset>/` and it must be named `sqfilms`.

> [!IMPORTANT]
> This project currently only runs on Linux (not on Windows, macOS, Unix, or Solaris)
> due to the nature of the facil.io library. For this reason, some users might prefer
> using the Docker container option.
