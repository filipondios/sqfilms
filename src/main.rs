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
        .mount("/", routes![
            api::get_reviews,
            api::create_review,
            api::delete_review,
            api::update_review,
            index, 
            new_review_form,
            edit_review_form])
        .attach(Template::fairing())
}

#[get("/?<title>")]
fn index(db: &State<SQConn>, title: Option<String>) -> Template {
    let connection = db.lock().expect("failed to lock DB");

    let reviews = match db::fetch_reviews(&connection, title.as_deref()) {
        Ok(reviews_list) => reviews_list,
        Err(e) => {
            eprintln!("Error loading reviews: {}", e);
            Vec::new()
        }
    };

    let series = reviews.iter().filter(|r| r.season.is_some()).count();
    let films = reviews.len() - series;

    Template::render("index", rocket_dyn_templates::context! {
        title: "Film & Series Reviews",
        reviews: reviews, series: series, films: films,
        total: (series + films), title_filter: title.as_deref()
    })
}

#[get("/new")]
fn new_review_form() -> Template {
    Template::render("new", rocket_dyn_templates::context! {
        title: "Add New Review"
    })
}

#[get("/edit/<id>")]
fn edit_review_form(db: &State<SQConn>, id: i32) -> Template {
    let conn = db.lock().expect("failed to lock DB");
    let review = db::get_review_by_id(&conn, id);

    Template::render("edit", rocket_dyn_templates::context! {
        title: "Edit Review", review: review
    })
}