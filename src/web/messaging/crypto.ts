import crypto from "crypto";

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519");
  return {
    publicKey: publicKey.export({ type: "spki", format: "der" }).toString("base64"),
    privateKey: privateKey.export({ type: "pkcs8", format: "der" }).toString("base64"),
  };
}

function importPublicKey(b64: string): crypto.KeyObject {
  return crypto.createPublicKey({ key: Buffer.from(b64, "base64"), type: "spki", format: "der" });
}

function importPrivateKey(b64: string): crypto.KeyObject {
  return crypto.createPrivateKey({ key: Buffer.from(b64, "base64"), type: "pkcs8", format: "der" });
}

export function sharedSecret(privateKeyB64: string, publicKeyB64: string): Buffer {
  const secret = crypto.diffieHellman({
    privateKey: importPrivateKey(privateKeyB64),
    publicKey: importPublicKey(publicKeyB64),
  });
  return crypto.createHash("sha256").update(secret).digest();
}

export interface Encrypted {
  iv: string;
  ct: string;
}

export function encrypt(secret: Buffer, plaintext: string): Encrypted {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secret, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString("base64"), ct: Buffer.concat([ciphertext, tag]).toString("base64") };
}

export function decrypt(secret: Buffer, ivB64: string, ctB64: string): string {
  const data = Buffer.from(ctB64, "base64");
  const tag = data.subarray(data.length - 16);
  const ciphertext = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", secret, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
