use reqwest;
use std::env;
use regex::Regex;
use serde::Deserialize;
use urlencoding;
use crate::utils;


#[derive(Deserialize, Debug)]
pub struct Name {
    pub data1: u128,
    pub data2: u128,
    pub data3: u128,
    pub data4: u128,
}

#[derive(Deserialize, Debug)]
pub struct TokenId {
    pub data1: u128,
    pub data2: u128,
    pub data3: u128,
    pub data4: u128,
    pub parent: String,
}

fn get_base_uri() -> String {
    let url_host = env::var("URL_HOST").unwrap_or_else(|_| "http://localhost:3030".to_string());
    let program = env::var("PROGRAM").unwrap_or_else(|_| "aleo_name_service_v2.aleo".to_string());
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
    // Split into lines
    let content = &content[1..content.len()-1];
    let lines: Vec<&str> = content.split("\\n").collect();

    // Process each line
    let mut json_lines = Vec::new();
    for line in lines {
        if line.contains("{") || line.contains("}") {
            let line = line.trim();
            if line.contains("{") && line.len() > 1 {
                let re = Regex::new(r#"(\w+): \{$"#).unwrap();
                let line = re.replace_all(&line, r#""$1": {"#);
                json_lines.push(line.to_string());
            } else {
                json_lines.push(line.to_string());
            }
            continue;
        }

        // Add quotes around keys and string values that are not numbers
        let re = Regex::new(r#"(\w+): (\w+)u\d+(,)?$"#).unwrap();
        let json_line = re.replace_all(&line, r#""$1": $2$3"#);

        let re = Regex::new(r#"(\w+): (\w+)(,)?$"#).unwrap();
        let json_line = re.replace_all(&json_line, r#""$1": "$2"$3"#);

        let re = Regex::new(r#"(\w+): (\d+)$"#).unwrap();
        let json_line = re.replace_all(&json_line, r#""$1": $2"#);

        json_lines.push(json_line.into_owned());
    }

    // Join lines into a single JSON string
    let json = json_lines.join("\n");

    json
}


pub async fn has_sub_names(name_hash: String) -> Result<bool, String> {
    // get address from name_hash
    let url = format!("{}/mapping/has_sub_names/{}", get_base_uri(), name_hash);
    let resp = call_api(url).await?;

    let res = parse(&resp);
    let res = res.parse::<bool>().unwrap();

    Ok( res )
}


pub async fn get_owner(name_hash: String) -> Result<String, String> {
    // get address from name_hash
    let url = format!("{}/mapping/nft_owners/{}", get_base_uri(), name_hash);
    let resp = call_api(url).await?;

    let address = parse(&resp);

    Ok( address )
}


pub async fn get_name(name_hash: String) -> Result<TokenId, String> {
    // get address from name_hash
    let url = format!("{}/mapping/names/{}", get_base_uri(), name_hash);
    let resp = call_api(url).await?;

    let json = parse(&resp);

    let ans: TokenId = serde_json::from_str(&json).map_err(|_| "Failed to convert to json")?;

    Ok( ans )
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
    let resolver = format!("{{name:{}, category:{}u128}}", name_hash, category);
    // encode resolver with urlencoding
    let resolver_encoded = urlencoding::encode(&resolver);
    let url = format!("{}/mapping/resolvers/{}", get_base_uri(), resolver_encoded);
    let resp = call_api(url).await?;
    let json = parse(&resp);
    let name: Name = serde_json::from_str(&json).map_err(|_| "Failed to convert to json")?;
    let content = utils::reverse_parse_label(name.data1, name.data2, name.data3, name.data4)?;
    Ok( content )
}