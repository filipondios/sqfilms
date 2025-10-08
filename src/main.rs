#[macro_use]
extern crate rocket;
use rocket_dyn_templates::Template;
use clap::Parser;
mod api;
mod db;

#[derive(Parser, Debug)]
#[command(name = "sqfilms", about = "Film & Series Review App")]
struct Config {
    #[arg(short, long)]
    path: String,
    #[arg(long)]
    no_force: bool,
}

#[launch]
fn rocket() -> _ {
    let config = Config::parse();
    let db = db::init_db(&config.path, config.no_force);
    
    rocket::build().manage(db)
        .mount("/static", rocket::fs::FileServer::from("static"))
        .mount("/", routes![api::get_reviews, index])
        .attach(Template::fairing())
}

#[get("/")]
fn index() -> Template {
    Template::render("index", rocket_dyn_templates::context! {
        title: "Film & Series Reviews",
        message: "Welcome to SqFilms!"
    })
}
