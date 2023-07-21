use actix_web::{get, web, Responder, HttpResponse};
use serde::Deserialize;
use crate::utils;

const BASE_COMMAND: &str = "snarkos developer execute --private-key=\"$PRIVATE_KEY\" --query=https://vm.aleo.org/api --broadcast=https://vm.aleo.org/api/testnet3/transaction/broadcast --fee=1 --record=\"$FEE_RECORD\" aleo_name_service_v0.aleo ";


#[derive(Deserialize)]
struct SetResolverParams {
    name: String,
    category: String,
    resolver: String,
}


#[get("/api/v1/command/register/{name}")]
async fn register(name: web::Path<String>) -> impl Responder {
    let name = name.into_inner();
    let is_sub = name.split(".").count() > 2;
    let params = utils::parse_name(&name);
    let params = match params {
        Ok(value) => value.to_string(),
        Err(e) => {
            // Handle the error here
            println!("Error parsing name: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({ "error": format!("Error parsing name: {}", e) }));
        }
    };
    let function = if is_sub {
        "register_sub"
    } else {
        "register"
    };
    HttpResponse::Ok().body(format!("{} {} {} \"$COST_RECORD\"", BASE_COMMAND, function, params))
}


#[get("/api/v1/command/set_primary_name/{name}")]
async fn set_primary_name(name: web::Path<String>) -> impl Responder {
    let name = name.into_inner();
    let name_hash = utils::parse_name_hash(&name);
    let name_hash = match name_hash {
        Ok(value) => value.to_string(),
        Err(e) => {
            // Handle the error here
            println!("Error parsing name: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({ "error": format!("Error parsing name: {}", e) }));
        }
    };
    HttpResponse::Ok().body(format!("{} set_primary_name {}", BASE_COMMAND, name_hash))
}


#[get("/api/v1/command/set_resolver")]
async fn set_resolver(resolver_params: web::Query<SetResolverParams>) -> impl Responder {
    let name = resolver_params.name.clone();
    let category = resolver_params.category.clone();
    let resolver = resolver_params.resolver.clone();

    let category = utils::string_to_u128(&category);
    let category = match category {
        Ok(value) => value.to_string(),
        Err(e) => {
            // Handle the error here
            println!("Error parsing category: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({ "error": format!("Error parsing category: {}", e) }));
        }
    };

    let name = utils::parse_name_hash(&name);
    let name = match name {
        Ok(value) => value.to_string(),
        Err(e) => {
            // Handle the error here
            println!("Error parsing name: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({ "error": format!("Error parsing name: {}", e) }));
        }
    };

    let resolver = utils::parse_label_string(&resolver, false);
    let resolver = match resolver {
        Ok(value) => value.to_string(),
        Err(e) => {
            // Handle the error here
            println!("Error parsing resolver: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({ "error": format!("Error parsing resolver: {}", e) }));
        }
    };
    HttpResponse::Ok().body(format!("{} set_resolver {} {}u128 \"{}\"", BASE_COMMAND, name, category, resolver))
}