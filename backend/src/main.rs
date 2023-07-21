use actix_web::{App, get, HttpResponse, HttpServer, Responder, web};
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

#[get("/api/v1/name_to_hash/{name}")]
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

#[get("/api/v1/primary_name/{address}")]
async fn name_api(address: web::Path<String>) -> impl Responder {
    // TODO: Implement your logic here to find the name by address
    let address = address.into_inner();
    let name = name_of_address(&address);

    match name.await {
        Ok(name) => HttpResponse::Ok().json(AddressName { address: address.clone(), name }),
        Err(_e) => HttpResponse::NotFound().finish(),
    }
}

#[get("/api/v1/address/{name}")]
async fn address_api(name: web::Path<String>) -> impl Responder {
    let name = name.into_inner();
    let address = address_of_name(&name);

    match address.await {
        Ok(address) => HttpResponse::Ok().json(AddressName { address, name: name.clone() }),
        Err(_e) => HttpResponse::NotFound().finish(),
    }
}


#[get("/api/v1/resolver")]
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
            .service(name_to_hash)
            .service(name_api)
            .service(address_api)
            .service(resolver)
            .service(command::register)
            .service(command::set_primary_name)
            .service(command::set_resolver)
    })
    .bind("127.0.0.1:8000")?
    .run()
    .await
}


async fn name_of_address(_address: &str) -> Result<String, String> {
    // get name_hash from address
    let name_hash = client::get_primary_name_hash(_address).await?;

    println!("name_hash: {}", name_hash);

    let mut ans = client::get_name(name_hash).await?;
    let mut names = Vec::new();

    println!("ans: {:?}", ans);

    while ans.parent != "0scalar" {
        names.push(utils::reverse_parse_label(ans.name.n1, ans.name.n2, ans.name.n3, ans.name.n4).unwrap());
        ans = client::get_name(ans.parent).await?;
        println!("ans: {:?}", ans);
    }

    names.push(utils::reverse_parse_label(ans.name.n1, ans.name.n2, ans.name.n3, ans.name.n4).unwrap());
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

    let ans = client::get_name(name_hash).await?;
    Ok( ans.addr )
}
