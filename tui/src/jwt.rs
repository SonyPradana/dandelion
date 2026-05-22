use std::collections::HashSet;
use chrono::{Utc, Duration, NaiveDate};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub license_id: String,
    pub features: Vec<String>,
    pub total_limit: u64,
    pub daily_limit: u64,
    pub version_allowed: Vec<String>,
    pub iss: String,
    pub aud: String,
    pub sub: String,
    pub iat: u64,
    pub exp: u64,
}

fn parse_expiry(value: &str) -> Result<u64, String> {
    if let Ok(d) = NaiveDate::parse_from_str(value, "%Y-%m-%d") {
        let dt = d.and_hms_opt(23, 59, 59).unwrap();
        return Ok(dt.and_utc().timestamp() as u64);
    }

    let re = regex_lite::Regex::new(r"^(\d+)(d|m|y)$").map_err(|e| e.to_string())?;
    let caps = re.captures(value).ok_or_else(|| {
        format!("Invalid expiry format: {value}. Use: 90d, 12m, 1y, or 2027-01-01")
    })?;

    let num: i64 = caps[1].parse().map_err(|_| "Invalid number".to_string())?;
    let now = Utc::now();
    let exp = match &caps[2] {
        "d" => now + Duration::days(num),
        "m" => now + Duration::days(num * 30),
        "y" => now + Duration::days(num * 365),
        _ => return Err("Invalid unit".to_string()),
    };
    Ok(exp.timestamp() as u64)
}

pub fn generate_token(
    private_key_pem: &str,
    token_id: &str,
    expiry: &str,
    total_limit: u64,
    daily_limit: u64,
    version_allowed: &str,
    features: &HashSet<String>,
) -> Result<(String, u64), String> {
    let exp = parse_expiry(expiry)?;

    let version_list: Vec<String> = if version_allowed.trim().is_empty() {
        vec!["*".to_string()]
    } else {
        version_allowed.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()
    };

    let feature_list: Vec<String> = {
        let all = [
            "skriningform",
            "skrining",
            "skrining-form-not-checked",
            "zen-mode",
        ];
        if features.is_empty() {
            all.iter().map(|s| s.to_string()).collect()
        } else {
            let mut v: Vec<String> = features.iter().cloned().collect();
            v.sort();
            v
        }
    };

    let claims = Claims {
        license_id: token_id.to_string(),
        features: feature_list,
        total_limit,
        daily_limit,
        version_allowed: version_list,
        iss: "Dandelion".to_string(),
        aud: "dandelion-extension".to_string(),
        sub: "license".to_string(),
        iat: Utc::now().timestamp() as u64,
        exp,
    };

    let key = EncodingKey::from_ec_pem(private_key_pem.as_bytes())
        .map_err(|e| format!("Invalid EC private key PEM: {e}"))?;

    let header = Header::new(jsonwebtoken::Algorithm::ES256);
    let token = encode(&header, &claims, &key)
        .map_err(|e| format!("Failed to sign JWT: {e}"))?;

    Ok((token, exp))
}
