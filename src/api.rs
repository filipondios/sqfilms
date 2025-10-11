use rocket::http::Status;
use rocket::serde::json::{Json, json, Value};
use rocket::State;
use crate::db::*;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct APIReview {
    pub title: String,
    pub note: f64,
    pub date: Option<String>,
    pub season: Option<i32>,
}

#[get("/reviews?<title>")]
pub fn get_reviews(title: Option<String>, db: &State<SQConn>)
    -> Result<Json<Vec<Review>>, (Status, Value)> {

    let connection = db.lock().map_err(|_| {
        let error_message = "Failed to acquire DB lock";
        (Status::InternalServerError, json!({"error": error_message}))
    })?;

    match fetch_reviews(&connection, title.as_deref()) {        
        Ok(reviews) => Ok(Json(reviews)),
        Err(e) => Err((Status::InternalServerError, json!({"error": e.to_string()}))),
    }
}

#[post("/reviews", format = "json", data = "<payload>")]
pub fn create_review(db: &State<SQConn>, payload: Json<APIReview>)
    -> Result<Json<Review>, (Status, String)> {

    let conn = db.lock().map_err(|_|
        (Status::InternalServerError, "DB lock failed".into()))?;
    let p = payload.into_inner();

    match insert_review(&conn, &p.title, p.note, p.date.as_deref(), p.season) {
        Ok(review) => Ok(Json(review)),
        Err(e) => Err((Status::InternalServerError, e.to_string())),
    }
}

#[post("/delete/<id>")]
pub fn delete_review(db: &State<SQConn>, id: i32)
    -> Result<Json<Value>, (Status, String)> {

    let conn = db.lock().map_err(|_| 
        (Status::InternalServerError, "DB lock failed".into()))?;

    match crate::db::delete_review(&conn, id) {
        Ok(_) => Ok(Json(json!({"success": "Review deleted successfully"}))),
        Err(e) => Err((Status::InternalServerError, e.to_string())),
    }
}