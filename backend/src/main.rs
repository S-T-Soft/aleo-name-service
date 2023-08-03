use actix_web::{App, get, HttpResponse, HttpServer, Responder, web};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use serde_json;

mod utils;
mod client;
mod command;

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

#[get("/primary_name/{address}")]
async fn name_api(address: web::Path<String>) -> impl Responder {
    let address = address.into_inner();
    let name = primary_name_of_address(&address);

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


#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .wrap(
                Cors::permissive()
                    .allow_any_origin()
            )
            .service(name_to_hash)
            .service(name_api)
            .service(address_api)
            .service(resolver)
    })
    .bind("0.0.0.0:8000")?
    .run()
    .await
}


async fn primary_name_of_address(_address: &str) -> Result<String, String> {
    // get name_hash from address
    let name_hash = client::get_primary_name_hash(_address).await?;

    if name_hash == "0field" {
        return Err("Deleted".to_string());
    }

    let address = client::get_owner(name_hash.clone()).await?;
    if address != _address {
        return Err("Not owned".to_string());
    }

    let mut ans = client::get_name(name_hash.clone()).await?;

    let mut names = Vec::new();

    while ans.parent != "0field" {
        names.push(utils::reverse_parse_label(ans.data1, ans.data2, ans.data3, ans.data4).unwrap());
        ans = client::get_name(ans.parent).await?;
    }

    names.push(utils::reverse_parse_label(ans.data1, ans.data2, ans.data3, ans.data4).unwrap());
    names.push("ans".to_string());

    // Join all the names with "."
    let name = names.join(".");

    Ok(name)
}


async fn address_of_name(_name: &str) -> Result<String, String> {
    let name_hash = utils::parse_name_hash(_name);
    let name_hash = match name_hash {
        Ok(value) => value.to_string(),
        Err(e) => {
            return Err (e);
        }
    };

    let available = client::has_sub_names(name_hash.clone()).await?;

    if !available {
        let address = client::get_owner(name_hash).await;
        match address {
            Ok(address) => return Ok(address),
            Err(_e) => return Ok("Private Register".to_string()),
        }
    }

    Err("Not Register".to_string())
}
