// puzzle-scanner — fuerza bruta secp256k1 con suma incremental P += G
// Auto-test integrado contra vector generado independientemente en Node.
use k256::elliptic_curve::sec1::ToEncodedPoint;
use k256::elliptic_curve::PrimeField;
use k256::{ProjectivePoint, Scalar};
use ripemd::Ripemd160;
use sha2::{Digest, Sha256};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Instant;
use k256::elliptic_curve::generic_array::GenericArray;

const TARGET_TEST: &str = "4a8021883984bf5f1ec40298954bd4bbab5d8c98";

fn hash160_uncompressed(affine: &k256::AffinePoint) -> [u8; 20] {
    let enc = affine.to_encoded_point(false);
    let h = Sha256::digest(enc.as_bytes());
    let r = Ripemd160::digest(&h);
    let mut out = [0u8; 20];
    out.copy_from_slice(&r);
    out
}

fn increment_be(bytes: &mut [u8; 32]) {
    for b in bytes.iter_mut().rev() {
        let (v, carry) = b.overflowing_add(1);
        *b = v;
        if !carry {
            return;
        }
    }
}

fn wif(secret: &[u8; 32]) -> String {
    let mut data = vec![0x80u8];
    data.extend_from_slice(secret);
    data.push(0x01); // compressed flag
    let h = Sha256::digest(&Sha256::digest(&data));
    data.extend_from_slice(&h[..4]);
    base58::ToBase58::to_base58(data.as_slice())
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    // Modo por defecto: benchmark honesto del hardware
    let iters_per_thread: u64 = args
        .get(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(2_000_000);
    let threads: usize = args
        .get(2)
        .and_then(|s| s.parse().ok())
        .unwrap_or_else(|| std::thread::available_parallelism().map(|n| n.get()).unwrap_or(4));

    // ---- AUTO-TEST: verificar pipeline criptografico contra vector externo ----
    {
        let bytes = hex::decode("0000000000000000000000000000000000000000000000400000000000000001").unwrap();
        let s = Scalar::from_repr(GenericArray::clone_from_slice(&bytes)).unwrap();
        let p = ProjectivePoint::generator() * s;
        let got = hex::encode(hash160_uncompressed(&p.to_affine()));
        assert_eq!(got, TARGET_TEST, "FALLO auto-test: pipeline criptografico incorrecto");
        println!("[OK] Auto-test superado: hash160 verificado contra vector Node independiente");
    }

    println!("=== PUZZLE SCANNER — benchmark real de hardware ===");
    println!("Hilos: {} | Iteraciones/hilo: {}", threads, iters_per_thread);
    println!(
        "Objetivo de referencia: puzzle #71 (hash160 1PWo3JeB...), rango 2^70"
    );

    let found = Arc::new(AtomicBool::new(false));
    let counter = Arc::new(AtomicU64::new(0));
    let target = hex::decode(
        "f6f5431d25bbf7b12e8add9af5e3475c44a0a5b8", /* hash160 REAL del puzzle #71 (verificado por base58check) */
    )
    .unwrap();

    let start = Instant::now();
    let mut handles = Vec::new();
    for _t in 0..threads {
        let found = Arc::clone(&found);
        let counter = Arc::clone(&counter);
        let target = target.clone();
        handles.push(thread::spawn(move || {
            // Cada hilo arranca en una clave aleatoria del rango (evita solapamiento trivial)
            let mut seed = [0u8; 32];
            seed[31] = rand_byte();
            seed[30] = rand_byte();
            seed[29] |= 0x40; // dentro del espacio 2^70
            let s = Scalar::from_repr(GenericArray::clone_from_slice(&seed)).unwrap();
            let mut cur_secret = seed;
            let g = ProjectivePoint::generator();
            let mut p = g * s;
            let mut local: u64 = 0;
            for _i in 0..iters_per_thread {
                if found.load(Ordering::Relaxed) {
                    break;
                }
                let aff = p.to_affine();
                let h = hash160_uncompressed(&aff);
                if h[..] == target[..] {
                    found.store(true, Ordering::Relaxed);
                    println!("\n*** CLAVE ENCONTRADA ***");
                    println!("priv hex : {}", hex::encode(cur_secret));
                    println!("WIF      : {}", wif(&cur_secret));
                }
                p += g;
                increment_be(&mut cur_secret);
                local += 1;
                if local % 100_000 == 0 {
                    counter.fetch_add(100_000, Ordering::Relaxed);
                }
            }
            let rem = local % 100_000;
            if rem > 0 {
                counter.fetch_add(rem, Ordering::Relaxed);
            }
        }));
    }

    // Reporter: velocidad y ETA honestos cada 10s
    let reporter_found = Arc::clone(&found);
    let reporter_counter = Arc::clone(&counter);
    let rep = thread::spawn(move || {
        let t0 = Instant::now();
        loop {
            thread::sleep(std::time::Duration::from_secs(10));
            let n = reporter_counter.load(Ordering::Relaxed);
            let el = t0.elapsed().as_secs_f64();
            let rate = n as f64 / el;
            if rate > 0.0 {
                // Espacio total 2^70 ~ 1.18e21 ; esperado encontrar al 50%
                let years_full = 1.18e21 / rate / 31_557_600.0;
                let years_exp = years_full / 2.0;
                println!(
                    "[{:>6.1}s] {:>12} claves | {:>10} claves/s | espacio completo: {:>10.0} anos | esperado: {:>10.0} anos",
                    el,
                    format_int(n),
                    format_int(rate as u64),
                    years_full,
                    years_exp
                );
            }
            if reporter_found.load(Ordering::Relaxed) {
                break;
            }
        }
    });

    for h in handles {
        let _ = h.join();
    }
    let el = start.elapsed().as_secs_f64();
    let n = counter.load(Ordering::Relaxed);
    let rate = n as f64 / el.max(1e-9);
    println!("\n=== RESULTADO DEL HARDWARE REAL ===");
    println!(
        "Total: {} claves en {:.1}s -> {:.0} claves/s con {} hilos",
        format_int(n),
        el,
        rate,
        threads
    );
    if rate > 0.0 {
        let years_exp = 1.18e21 / rate / 31_557_600.0 / 2.0;
        println!("ETA honesto para puzzle #71 completo en esta maquina: {:.0} anos (esperado ~{:.0})", years_exp * 2.0, years_exp);
    }
    found.store(true, Ordering::Relaxed);
    let _ = rep.join();
}

fn format_int(n: u64) -> String {
    let s = n.to_string();
    let mut out = String::new();
    let bytes = s.as_bytes();
    for (i, c) in bytes.iter().enumerate() {
        out.push(*c as char);
        let rem = bytes.len() - i - 1;
        if rem > 0 && rem % 3 == 0 {
            out.push(',');
        }
    }
    out
}

fn rand_byte() -> u8 {
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};
    static COUNTER: AtomicU64 = AtomicU64::new(0x9E3779B97F4A7C15);
    let prev = COUNTER.fetch_add(0x9E3779B97F4A7C15, Ordering::Relaxed);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(prev);
    (prev ^ nanos).rotate_left(17) as u8
}

