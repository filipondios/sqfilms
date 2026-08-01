<!-- # sqfilms -->
<div align="center">
  <h1>sqfilms</h1>
  <p>A movie & series review web app built with <a href="https://fastapi.tiangolo.com/">FastAPI</a> and <a href="https://sqlite.org/">SQLite</a>.</p>  
    <img height="600" alt="image" src="https://github.com/user-attachments/assets/cc6c2628-72dc-4f52-b756-c3f2d9a87d47"/>
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
  sqfilms:v2.0.0
```

Once the container is running, open
<a href='http://localhost:8000'>http://localhost:8000</a>
in your browser to access the web interface.


## Running from source

After cloning this repository, you just need to puthon in
order to run the program (ensure you have python installed
in your system).

```bash
git clone https://github.com/filipondios/sqfilms
cd sqfilms && python -m venv venv
python .\main.py -p $DB_PATH
```
