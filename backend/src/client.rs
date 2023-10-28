use reqwest;
use std::env;
use regex::Regex;
use serde::Deserialize;
use urlencoding;
use crate::utils;
use deadpool_redis::{Pool, redis::{cmd}};

#[derive(Deserialize, Debug)]
pub struct NameStruct {
    pub name: [u128; 4],
    pub parent: String,
    pub resolver: u128
}

fn get_base_uri() -> String {
    let url_host = env::var("URL_HOST").unwrap_or_else(|_| "https://api.explorer.aleo.org/v1".to_string());
    let program = env::var("PROGRAM").unwrap_or_else(|_| "aleo_name_service_registry_v1.aleo".to_string());
    let base_uri = format!("{}/testnet3/program/{}", url_host, program);
    base_uri
}

async fn call_api(url: String) -> Result<String, String> {
    // Make the request
    let resp = reqwest::get(&url).await;

    // Check if the request was successful
    let resp = match resp {
        Ok(resp) => resp,
        Err(err) => {
            println!("Error getting content: {}", err);
            return Err(err.to_string());
        }
    };

    // Parse the response text
    let resp = resp.text().await.unwrap();

    if resp.trim() == "null" {
        return Err("Error getting content".to_string());
    }

    Ok( resp )
}


fn parse(content: &str) -> String {
    let lines: Vec<&str> = content.trim_matches('"').split("\\n").collect();
    let mut json_lines = Vec::new();
    let mut in_array = false;

    for line in lines {
        let line = line.trim();

        // Detect array start
        if line.ends_with("[") {
            in_array = true;
            let re = Regex::new(r#"(\w+): \[$"#).unwrap();
            let json_line = re.replace_all(line, r#""$1": ["#);
            json_lines.push(json_line.to_string());
            continue;
        }

        // Detect array end
        if line.starts_with("]") {
            in_array = false;
            json_lines.push("],".to_string());  // Add a comma after the array
            continue;
        }

        // Inside an array
        if in_array {
            let re = Regex::new(r#"(\d+)u\d+(,)?$"#).unwrap();
            let json_line = re.replace_all(line, r#"$1$2"#);
            json_lines.push(json_line.to_string());
            continue;
        }

        // Object keys and values
        if line.contains(":") {
            let re = Regex::new(r#"(\w+): (\w+)u\d+(,)?$"#).unwrap();
            let json_line = re.replace_all(line, r#""$1": $2$3"#);

            let re = Regex::new(r#"(\w+): (\w+)(,)?$"#).unwrap();
            let json_line = re.replace_all(&json_line, r#""$1": "$2"$3"#);

            let re = Regex::new(r#"(\w+): (\d+)$"#).unwrap();
            let json_line = re.replace_all(&json_line, r#""$1": $2"#);

            json_lines.push(json_line.to_string());
            continue;
        }

        // Just append braces and other lines as-is
        json_lines.push(line.to_string());
    }

    // Remove the trailing comma in the last key-value pair
    if let Some(last) = json_lines.last_mut() {
        if last.ends_with(",") {
            last.pop();
        }
    }

    // Join lines into a single JSON string
    let json = json_lines.join("\n");

    json
}


pub async fn get_owner(name_hash: String) -> Result<String, String> {
    // get address from name_hash
    let url = format!("{}/mapping/nft_owners/{}", get_base_uri(), name_hash);
    let resp = call_api(url).await?;

    let address = parse(&resp);

    Ok( address )
}


pub async fn get_name(name_hash: String) -> Result<NameStruct, String> {
    // get address from name_hash
    let url = format!("{}/mapping/names/{}", get_base_uri(), name_hash);
    println!("{}", url);
    let resp = call_api(url).await?;
    println!("{}", resp);
    let json = parse(&resp);
    println!("{}", json);
    let ans: NameStruct = serde_json::from_str(&json).map_err(|_| "Failed to convert to json")?;

    Ok( ans )
}


pub async fn get_full_name(pool: &Pool, name_hash: String) -> Result<String, String> {
    // Create a Redis key
    let redis_key = format!("hash_to_name/{}", name_hash);

    let mut conn = pool.get().await.unwrap();
    let cached_value: Option<String> = match cmd("GET").arg(&[redis_key.as_str()]).query_async(&mut conn).await {
        Ok(value) => value,
        Err(err) => {
            println!("Error getting content: {}", err);
            None
        }
    };
    if let Some(value) = cached_value {
        return Ok(value);
    }

    let mut ans = get_name(name_hash.clone()).await?;

    let mut names = Vec::new();

    while ans.parent != "0field" {
        names.push(utils::reverse_parse_label(ans.name[0], ans.name[1], ans.name[2], ans.name[3]).unwrap());
        ans = get_name(ans.parent).await?;
    }

    names.push(utils::reverse_parse_label(ans.name[0], ans.name[1], ans.name[2], ans.name[3]).unwrap());

    // Join all the names with "."
    let name = names.join(".");

    cmd("SET").arg(&[redis_key.as_str(), name.as_str()]).query_async::<_, ()>(&mut conn).await.unwrap();

    Ok(name)
}


pub async fn get_primary_name_hash(address: &str) -> Result<String, String> {
    // get name_hash from address
    let url = format!("{}/mapping/primary_names/{}", get_base_uri(), address);
    let resp = call_api(url).await?;
    let resp = &resp[1..resp.len()-1];
    Ok( resp.to_string() )
}

pub async fn get_resolver(category: &str, name: &str) -> Result<String, String> {
    // get name_hash from name
    let name_hash = utils::parse_name_hash(name)?;
    let category = utils::string_to_u128(&category)?;
    // get resolver from name_hash and category
    let resolver = format!("{{name:{}, category:{}u128, version: 1u64}}", name_hash, category);
    // encode resolver with urlencoding
    let resolver_encoded = urlencoding::encode(&resolver);
    let url = format!("{}/mapping/resolvers/{}", get_base_uri(), resolver_encoded);
    let resp = call_api(url).await?;
    let json = parse(&resp);
    let name: [u128; 4] = serde_json::from_str(&json).map_err(|_| "Failed to convert to json")?;
    let content = utils::reverse_parse_label(name[0], name[1], name[2], name[3])?;
    Ok( content )
}