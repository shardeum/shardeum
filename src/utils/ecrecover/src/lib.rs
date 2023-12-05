use std::{convert::TryInto, borrow::BorrowMut, sync::RwLock};

use neon::{prelude::*, types::buffer::TypedArray};
use secp256k1::{recovery::{RecoveryId, RecoverableSignature}, Message, Secp256k1, All};
use std::time::Instant;

#[macro_use]
extern crate lazy_static;

fn hello(mut cx: FunctionContext) -> JsResult<JsString> {
    Ok(cx.string("hello node"))
}

lazy_static! {
    static ref SECP: RwLock<Secp256k1<All>> = RwLock::new(Secp256k1::new());
}

fn ecrecover(mut cx: FunctionContext) -> JsResult<JsBuffer> {
    let start = Instant::now(); // Start timing
    // Extract arguments
    let hash: Handle<JsTypedArray<u8>> = cx.argument(0)?;
    let v: Handle<JsNumber> = cx.argument(1)?;
    let r: Handle<JsTypedArray<u8>> = cx.argument(2)?;
    let s: Handle<JsTypedArray<u8>> = cx.argument(3)?;

    // println!("After parsing: hash: {:?}, v: {:?}, r: {:?}, s: {:?}", hash, v, r, s);
    // Cast
    let hash = hash.as_slice(&cx).to_vec();
    let v = v.value(&mut cx) as u64;
    let r = r.as_slice(&cx).to_vec();
    let s = s.as_slice(&cx).to_vec();

    // println!("After cast: hash: {:?}, v: {:?}, r: {:?}, s: {:?}", hash, v, r, s);
    // Call into impl TODO: error handling
    let hash : &[u8;32] = hash[0..32].try_into().unwrap();
    let r : &[u8;32] = r[0..32].try_into().unwrap();
    let s : &[u8;32] = s[0..32].try_into().unwrap();

    let inside_start = Instant::now(); // Start timing
    let result = ecrecover_impl(hash,v,r,s);
    let inside_end = inside_start.elapsed(); // Time elapsed since `start`
    println!("Time taken inside ecrecover: {:?}", inside_end);

    match result {
        Ok(address) => {

            // Create a new JS TypedArray (Uint8Array) with the same length as the Rust array
            let mut js_array = JsBuffer::new(&mut cx, address.len() as usize)?;
            // Copy data from the Rust array into the JS TypedArray
            {
                let mut js_array_guard = js_array.borrow_mut();
                js_array_guard.as_mut_slice(&mut cx).copy_from_slice(&address);
            }

            let duration = start.elapsed(); // Time elapsed since `start`
            println!("Time taken inside all rust: {:?}", duration);
            Ok(js_array)
        },
        Err(e) => cx.throw_error(format!("Error: {:?}", e))
    }
}

fn ecrecover_impl(hash: &[u8; 32], v: u64, r: &[u8; 32], s: &[u8; 32]) -> Result<[u8;64], secp256k1::Error> {
    //assuming no chainID right now.
    let recovery_id = RecoveryId::from_i32((v as i64 - 27) as i32)?;
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

// Utils
fn concat_slices(a: &[u8; 32], b: &[u8; 32]) -> Vec<u8> {
    let mut combined = Vec::with_capacity(64);
    combined.extend_from_slice(a);
    combined.extend_from_slice(b);
    combined
}

fn convert_slice_to_array(slice: &[u8]) -> Result<[u8; 64], String> {
    if slice.len() == 64 {
        let array: [u8; 64] = slice.try_into()
            .map_err(|_| "Failed to convert slice to array")?;
        Ok(array)
    } else {
        Err("Slice does not have 64 elements".to_string())
    }
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("hello", hello)?;
    cx.export_function("ecrecover", ecrecover)?;
    Ok(())
}
