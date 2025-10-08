use rocket::http::Status;
use rocket::serde::json::{Json, json, Value};
use rocket::State;
use crate::db::*;

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
