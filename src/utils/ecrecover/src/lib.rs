use std::{borrow::BorrowMut, convert::TryInto, sync::RwLock};

use anyhow::anyhow;
use neon::{prelude::*, types::buffer::TypedArray};
use num_bigint::BigUint;
use secp256k1::{
    recovery::{RecoverableSignature, RecoveryId},
    All, Message, Secp256k1,
};
use std::time::Instant;

#[macro_use]
extern crate lazy_static;

fn hello(mut cx: FunctionContext) -> JsResult<JsString> {
    Ok(cx.string("hello node"))
}

lazy_static! {
    static ref SECP: RwLock<Secp256k1<All>> = RwLock::new(Secp256k1::new());
}

/**************** Neon functions *****************/

fn get_valid_sender_public_key(mut cx: FunctionContext) -> JsResult<JsBuffer> {
    // Extract arguments
    let start = Instant::now(); // Start timing
    let hash: Handle<JsTypedArray<u8>> = cx.argument(0)?;
    let v: Handle<JsNumber> = cx.argument(1)?;
    let r: Handle<JsTypedArray<u8>> = cx.argument(2)?;
    let s: Handle<JsTypedArray<u8>> = cx.argument(3)?;
    let chain_id: Option<Handle<JsValue>> = cx.argument_opt(4);

    // Cast chain_id (Ugly)
    let hash = hash.as_slice(&cx).to_vec();
    let v = v.value(&mut cx) as u64;
    let r = r.as_slice(&cx).to_vec();
    let s = s.as_slice(&cx).to_vec();
    let chain_id: Option<u64> = match chain_id {
        Some(chain_id) => {
            let downcast: Result<Handle<'_, JsNumber>, neon::handle::DowncastError<JsValue, _>> =
                chain_id.downcast(&mut cx);

            // Current behavior is to return None if the chain_id is not a number
            match downcast {
                Ok(chain_id) => Some(chain_id.value(&mut cx) as u64),
                Err(_) => None,
            }
        }
        None => None,
    };

    // Call into impl TODO: error handling
    let hash: &[u8; 32] = hash[0..32].try_into().unwrap();
    let r: &[u8; 32] = r[0..32].try_into().unwrap();
    let s: &[u8; 32] = s[0..32].try_into().unwrap();
    let result = get_valid_sender_public_key_impl(hash, v, r, s, chain_id);
    match result {
        Ok(address) => {
            // Create a new JS TypedArray (Uint8Array) with the same length as the Rust array
            let mut js_array = JsBuffer::new(&mut cx, address.len() as usize)?;
            // Copy data from the Rust array into the JS TypedArray
            {
                let js_array_guard = js_array.borrow_mut();
                js_array_guard
                    .as_mut_slice(&mut cx)
                    .copy_from_slice(&address);
            }

            let duration = start.elapsed(); // Time elapsed since `start`
            println!("Time taken inside all rust: {:?}", duration);
            Ok(js_array)
        }
        Err(e) => cx.throw_error(format!("Error: {:?}", e)),
    }
}

// fn ecrecover(mut cx: FunctionContext) -> JsResult<JsBuffer> {
//     let start = Instant::now(); // Start timing

//     // Extract arguments
//     let hash: Handle<JsTypedArray<u8>> = cx.argument(0)?;
//     let v: Handle<JsNumber> = cx.argument(1)?;
//     let r: Handle<JsTypedArray<u8>> = cx.argument(2)?;
//     let s: Handle<JsTypedArray<u8>> = cx.argument(3)?;

//     // println!("After parsing: hash: {:?}, v: {:?}, r: {:?}, s: {:?}", hash, v, r, s);
//     // Cast
//     let hash = hash.as_slice(&cx).to_vec();
//     let v = v.value(&mut cx) as u64;
//     let r = r.as_slice(&cx).to_vec();
//     let s = s.as_slice(&cx).to_vec();

//     // println!("After cast: hash: {:?}, v: {:?}, r: {:?}, s: {:?}", hash, v, r, s);
//     // Call into impl TODO: error handling
//     let hash: &[u8; 32] = hash[0..32].try_into().unwrap();
//     let r: &[u8; 32] = r[0..32].try_into().unwrap();
//     let s: &[u8; 32] = s[0..32].try_into().unwrap();

//     let inside_start = Instant::now(); // Start timing
//     let result = ecrecover_impl(hash, v, r, s);
//     let inside_end = inside_start.elapsed(); // Time elapsed since `start`
//     println!("Time taken inside ecrecover: {:?}", inside_end);

//     match result {
//         Ok(address) => {
//             // Create a new JS TypedArray (Uint8Array) with the same length as the Rust array
//             let mut js_array = JsBuffer::new(&mut cx, address.len() as usize)?;
//             // Copy data from the Rust array into the JS TypedArray
//             {
//                 let mut js_array_guard = js_array.borrow_mut();
//                 js_array_guard
//                     .as_mut_slice(&mut cx)
//                     .copy_from_slice(&address);
//             }

//             let duration = start.elapsed(); // Time elapsed since `start`
//             println!("Time taken inside all rust: {:?}", duration);
//             Ok(js_array)
//         }
//         Err(e) => cx.throw_error(format!("Error: {:?}", e)),
//     }
// }

/**************** impls *****************/

fn get_valid_sender_public_key_impl(
    hash: &[u8; 32],
    v: u64,
    r: &[u8; 32],
    s: &[u8; 32],
    chain_id: Option<u64>,
) -> Result<[u8; 64], anyhow::Error> {
    match validate_high_s(s) {
        Ok(_) => ecrecover_impl(hash, v, r, s, chain_id),
        Err(e) => Err(e),
    }
}

fn ecrecover_impl(
    hash: &[u8; 32],
    v: u64,
    r: &[u8; 32],
    s: &[u8; 32],
    chain_id: Option<u64>,
) -> Result<[u8; 64], anyhow::Error> {
    let recovery_id = match chain_id {
        Some(chain_id) => RecoveryId::from_i32((v - (chain_id * 2 + 35)) as i32)?,
        None => RecoveryId::from_i32((v - 27) as i32)?,
    };
    // println!("recovery_id: {:?}", recovery_id);
    let signature = RecoverableSignature::from_compact(&concat_slices(r, s), recovery_id)?;
    // println!("signature: {:?}", signature);
    let message = Message::from_slice(hash)?;
    // TODO error wrapping
    let secp_read_guard = SECP.read().unwrap();
    let public_key = secp_read_guard.recover(&message, &signature)?;
    // TODO error wrapping
    let x = convert_slice_to_array(&public_key.serialize_uncompressed()[1..65]).unwrap();
    // let addr = Keccak256::digest(&public_key.serialize_uncompressed()[1..]);
    Ok(x)
}

/******************* Utils ***************/

fn validate_high_s(s: &[u8; 32]) -> Result<(), anyhow::Error> {
    // Define the SECP256K1 order
    // https://asecuritysite.com/SECP256K1#:~:text=%5Bsecp256k1%20Home%5D%5BHome%5D&text=The%20order%20of%20the%20curve,public%20key%20of%20aG.
    let secp256k1_order = BigUint::parse_bytes(
        b"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
        16,
    )
    .expect("Invalid SECP256K1 order");

    // Calculate SECP256K1 order divided by 2
    let secp256k1_order_div_2 = &secp256k1_order / 2u32;

    // Convert s to BigUint
    let s_value = BigUint::from_bytes_be(s);

    // Validate if s is greater than SECP256K1 order divided by 2
    if s_value > secp256k1_order_div_2 {
        Err(anyhow!(
            "Invalid s value greater than SECP256K1 order divided by 2"
        ))
    } else {
        Ok(())
    }
}
// First pass
// fn validate_high_s(s: &[u8; 32]) {
//     let mut s = s.clone();
//     SECP.write().unwrap().
//     let half_order = [
//         0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfc, // 2^255 - 218
//         0xe8, 0x9b, 0x4a, 0x17, 0x75, 0xeb, 0x31, 0x28, // 2^255 - 19
//         0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, // 2^255 - 1
//         0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
//     ];
//     let mut high_s = false;
//     if s[0] > half_order[0] {
//         high_s = true;
//     } else if s[0] == half_order[0] {
//         for i in 1..32 {
//             if s[i] > half_order[i] {
//                 high_s = true;
//                 break;
//             } else if s[i] < half_order[i] {
//                 break;
//             }
//         }
//     }
//     if high_s {

//         Error??
//     }
// }

fn concat_slices(a: &[u8; 32], b: &[u8; 32]) -> Vec<u8> {
    let mut combined = Vec::with_capacity(64);
    combined.extend_from_slice(a);
    combined.extend_from_slice(b);
    combined
}

fn convert_slice_to_array(slice: &[u8]) -> Result<[u8; 64], String> {
    if slice.len() == 64 {
        let array: [u8; 64] = slice
            .try_into()
            .map_err(|_| "Failed to convert slice to array")?;
        Ok(array)
    } else {
        Err("Slice does not have 64 elements".to_string())
    }
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("hello", hello)?;
    // cx.export_function("ecrecover", ecrecover)?;
    cx.export_function("getValidSenderPublicKey", get_valid_sender_public_key)?;
    Ok(())
}
