<!-- # sqfilms -->
<div align="center">
  <h1>sqfilms</h1>
  <p>A movie & series review web app built with <a href="https://rust-lang.org/">Rust</a>,
    <a href="https://rocket.rs/">Rocket</a> and <a href="https://sqlite.org/">SQLite</a>.</p>
  <img height="600" alt="image" src="https://github.com/user-attachments/assets/6e264936-23cb-4691-85da-e90901c57fce"/>
</div>

> [!IMPORTANT]
> Before reading how to run the program of this project, you should keep in mind that there
> is an example SQLite database located at `data/reviews.db` in this repository.

## Running with Docker

You can run this project inside a Docker container without installing any
dependencies on your machine, using the last version image from <a href='https://hub.docker.com/r/filipondios/sqfilms'>
this project's Docker Hub</a>:

```bash
docker pull filipondios/sqfilms:v1.0.0
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
  -p 8000:8000 \
  -v $DB_PATH:/data \
  sqfilms:v1.0.0
```

On the other hand, instead of pulling my docker image from Docker Hub, you
can clone this repository and build the Docker image:

```bash
git clone https://github.com/filipondios/sqfilms.git
cd sqfilms && docker build -t sqfilms .
```

Once the container is running, open
<a href='http://localhost:8000'>http://localhost:8000</a>
in your browser to access the web interface.


## Building from source

After cloning this repository, you just need to run cargo in
order to compile the program (ensure you have the rust toolchain
installed in your system).

```bash
git clone https://github.com/filipondios/sqfilms -b v1.0.0
cd sqfilms && cargo build --release
cargo run -- --path $DB_PATH
```
