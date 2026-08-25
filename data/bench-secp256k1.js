// Benchmark secp256k1: clave privada -> pubkey -> hash160 (pipeline real de verificacion de direccion)
const crypto = require("crypto");
const N = parseInt(process.argv[2] || "20000", 10);
// hash160 del puzzle #71 (solo para simular la comparacion completa)
const target = Buffer.alloc(20);

const ecdh = crypto.createECDH("secp256k1");
let acc = 0;
const t0 = process.hrtime.bigint();
for (let i = 0; i < N; i++) {
  const priv = crypto.randomBytes(32);
  priv[0] &= 0x3f; // mantener en rango bajo (simula espacio del puzzle)
  ecdh.setPrivateKey(priv);
  const pub = ecdh.getPublicKey(null); // uncompressed (formato de los puzzles 2015)
  const h = crypto.createHash("sha256").update(pub).digest();
  const r = crypto.createHash("ripemd160").update(h).digest();
  for (let j = 0; j < 20; j++) if (r[j] === target[j]) acc++;
}
const t1 = process.hrtime.bigint();
const secs = Number(t1 - t0) / 1e9;
const ks = N / secs;
console.log(`${ks.toFixed(0)} keys/s por nucleo (${N} en ${secs.toFixed(2)}s, acc=${acc})`);
