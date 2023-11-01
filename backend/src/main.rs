use actix_web::{App, get, HttpResponse, HttpServer, Responder, web};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use serde_json;
use deadpool_redis::{Config, Runtime, Pool};
use std::env;


mod utils;
mod client;
mod db;

#[derive(Serialize)]
struct NameHash {
    name_hash: String,
    name: String,
}

#[derive(Serialize)]
struct AddressName {
    address: String,
    name: String,
}

#[derive(Deserialize)]
struct GetResolverParams {
    name: String,
    category: String,
}

#[derive(Serialize)]
struct ResolverContent {
    category: String,
    name: String,
    content: String,
}

#[get("/name_to_hash/{name}")]
async fn name_to_hash(name: web::Path<String>) -> impl Responder {
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

    let result = NameHash {
        name_hash,
        name,
    };

    HttpResponse::Ok().json(result)
}

#[get("/hash_to_name/{name_hash}")]
async fn hash_to_name(pool: web::Data<Pool>, name_hash: web::Path<String>) -> impl Responder {
    let name_hash = name_hash.into_inner();
    let name = client::get_full_name(&pool,name_hash.clone());

    match name.await {
        Ok(name) => HttpResponse::Ok().json(NameHash { name_hash, name }),
        Err(_e) => {
            HttpResponse::NotFound().finish()
        },
    }
}

#[get("/primary_name/{address}")]
async fn name_api(pool: web::Data<Pool>, address: web::Path<String>) -> impl Responder {
    let address = address.into_inner();
    let name = primary_name_of_address(&pool,&address);

    match name.await {
        Ok(name) => HttpResponse::Ok().json(AddressName { address: address.clone(), name }),
        Err(_e) => HttpResponse::NotFound().finish(),
    }
}

#[get("/address/{name}")]
async fn address_api(name: web::Path<String>) -> impl Responder {
    let name = name.into_inner();
    let address = address_of_name(&name);

    match address.await {
        Ok(address) => HttpResponse::Ok().json(AddressName { address, name: name.clone() }),
        Err(_e) => HttpResponse::NotFound().finish(),
    }
}


#[get("/resolver")]
async fn resolver(resolver_params: web::Query<GetResolverParams>) -> impl Responder {
    let name = resolver_params.name.clone();
    let category = resolver_params.category.clone();
    println!("name: {}, category: {}", name, category);
    let content = client::get_resolver(&category, &name).await;

    match content {
        Ok(content) => HttpResponse::Ok().json(ResolverContent { content, name: name.clone() , category: category.clone()}),
        Err(_e) => HttpResponse::NotFound().finish(),
    }
}


#[get("/public_ans/{address}")]
async fn public_ans(address: web::Path<String>) -> impl Responder {
    let address = address.into_inner();
    let names = db::get_names_by_addr(&address).await;

    match names {
        Ok(data) => HttpResponse::Ok().json(data),
        Err(_e) => HttpResponse::NotFound().finish(),
    }
}

#[get("/resolver/{name}")]
async fn resolvers(name: web::Path<String>) -> impl Responder {
    let name = name.into_inner();

    let name_hash = utils::parse_name_hash(&name);
    let name_hash = match name_hash {
        Ok(name_hash_field) => name_hash_field.to_string(),
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({ "error": format!("Error parsing name: {}", e) }));
        }
    };

    let name_resolvers = db::get_resolvers_by_namehash(&name_hash).await;

    match name_resolvers {
        Ok(data) => HttpResponse::Ok().json(data),
        Err(_e) => HttpResponse::NotFound().finish(),
    }
}


#[get("/subdomain/{name}")]
async fn subdomains(name: web::Path<String>) -> impl Responder {
    let name = name.into_inner();

    let name_hash = utils::parse_name_hash(&name);
    let name_hash = match name_hash {
        Ok(name_hash_field) => name_hash_field.to_string(),
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({ "error": format!("Error parsing name: {}", e) }));
        }
    };

    let name_subdomains = db::get_subdomains_by_namehash(&name_hash).await;

    match name_subdomains {
        Ok(data) => HttpResponse::Ok().json(data),
        Err(_e) => HttpResponse::NotFound().finish(),
    }
}


#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379/0".to_string());

    let cfg = Config::from_url(redis_url);

    let pool = cfg.create_pool(Some(Runtime::Tokio1)).unwrap();

    HttpServer::new(move || {
        App::new()
            .wrap(
                Cors::permissive()
                    .allow_any_origin()
            )
            .app_data(web::Data::new(pool.clone()))
            .service(name_to_hash)
            .service(hash_to_name)
            .service(name_api)
            .service(address_api)
            .service(resolver)
            .service(public_ans)
            .service(resolvers)
            .service(subdomains)
            
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}


async fn primary_name_of_address(pool: &Pool, _address: &str) -> Result<String, String> {
    // get name_hash from address
    let name_hash = client::get_primary_name_hash(_address).await?;

    let address = client::get_owner(name_hash.clone()).await?;
    if address != _address {
        return Err("Not owned".to_string());
    }

    let name = client::get_full_name(pool,name_hash.clone()).await?;

    Ok( name )
}


async fn address_of_name(_name: &str) -> Result<String, String> {
    let name_hash = utils::parse_name_hash(_name);
    let name_hash = match name_hash {
        Ok(value) => value.to_string(),
        Err(e) => {
            return Err (e);
        }
    };

    client::get_name(name_hash.clone()).await?;

    let address = client::get_owner(name_hash).await;
    match address {
        Ok(address) => return Ok(address),
        Err(_e) => return Ok("Private Registration".to_string()),
    }
}
