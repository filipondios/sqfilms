#[macro_use]
extern crate rocket;
use rocket::State;
use rocket_dyn_templates::Template;
use clap::Parser;

use crate::db::SQConn;
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
        .mount("/", routes![api::get_reviews, api::create_review,  index])
        .attach(Template::fairing())
}

#[get("/")]
fn index(db: &State<SQConn>) -> Template {
    let connection = db.lock()
        .expect("failed to lock DB");

    let reviews = match db::fetch_reviews(&connection, None) {
        Ok(reviews_list) => reviews_list,
        Err(e) => {
            eprintln!("Error loading reviews: {}", e);
            Vec::new()
        }
    };
    
    Template::render("index", rocket_dyn_templates::context! {
        title: "Film & Series Reviews",
        reviews: reviews
    })
}
