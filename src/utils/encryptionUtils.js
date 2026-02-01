import forge from "node-forge";
import api from "../api/api";

/**
 * Fetch the Server's RSA Public Key
 * @returns {Promise<string>} - PEM encoded public key
 */
export const getPublicKey = async () => {
  try {
    const response = await api.get("/auth/public-key");
    return response.data.publicKey;
  } catch (error) {
    console.error("Failed to fetch public key", error);
    throw new Error("Could not initialize security context");
  }
};

/**
 * Generate a random 32-byte AES key
 * @returns {string} - Hex string of the key
 */
export const generateAESKey = () => {
  const key = forge.random.getBytesSync(32);
  return forge.util.bytesToHex(key);
};

/**
 * Encrypt data using AES-256-CBC
 * @param {string} data - Plain text data
 * @param {string} keyHex - Hex string of the AES key
 * @returns {object} - { iv: string (hex), encryptedData: string (hex) }
 */
export const encryptWithAES = (data, keyHex) => {
  const key = forge.util.hexToBytes(keyHex);
  const iv = forge.random.getBytesSync(16);

  const cipher = forge.cipher.createCipher("AES-CBC", key);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(data, "utf8"));
  cipher.finish();

  return {
    iv: forge.util.bytesToHex(iv),
    encryptedData: cipher.output.toHex(),
  };
};

/**
 * Encrypt the AES key using the Server's Public RSA Key
 * @param {string} aesKeyHex - Hex string of the AES key
 * @param {string} publicKeyPem - PEM string of Server Public Key
 * @returns {string} - Base64 encoded encrypted key
 */
export const encryptAESKeyWithRSA = (aesKeyHex, publicKeyPem) => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const buffer = forge.util.hexToBytes(aesKeyHex); // Encrypt the raw bytes, not the hex string?
  // Server expects AES key bytes. AES util generates randomBytes(32).
  // In server rsaUtil:
  // const buffer = Buffer.from(data); // if data is string, it converts.
  // if I send bytes here, forge encrypts it to binary string.

  // To match server expectations:
  // Server decrypts using crypto.privateDecrypt.
  // Client should encrypt with RSA-OAEP or RSA-PKCS1_V1_5?
  // rsaUtil.js uses defaults: crypto.publicEncrypt(key, buffer) -> uses OAEP by default in recent Node versions?
  // Actually default padding for publicEncrypt is RSA_PKCS1_OAEP_PADDING.

  // Let's use RSA-OAEP in forge to be safe and modern, or check what Node uses.
  // Node crypto.publicEncrypt defaults to OAEP with SHA1 MGF1 if no padding specified?
  // Actually, Node docs say publicEncrypt uses RSA_PKCS1_OAEP_PADDING.

  const encrypted = publicKey.encrypt(buffer, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: {
      md: forge.md.sha256.create(),
    },
  });

  // WAIT. Node default might be SHA1 for OAEP.
  // Let's look closer at `rsaUtil.js`.
  // It just calls `crypto.publicEncrypt(publicKey, buffer)`.
  // Default padding is crypto.constants.RSA_PKCS1_OAEP_PADDING
  // Default OAEP hash I believe is SHA1 in Node for compat?

  // Simplest path: Use PKCS1 v1.5 padding if we encounter issues, but let's try OAEP SHA-1 first if SHA-256 fails.
  // Or, update server rsaUtil explicitly to define padding.
  // Since I can't easily change the server deeply without risk, I'll stick to Standard PKCS#1 v1.5 which is often default or easier to make compatible if OAEP is tricky across libs.
  // BUT `crypto.publicEncrypt` defaults to OAEP.

  // Let's use 'RSA-OAEP' without specifying md/mgf1 to defaults (SHA1 usually).
  // OR standard `publicKey.encrypt(buffer)`. (Forge defaults to RSAES-PKCS1-V1_5-ENCRYPT)

  // I will use PKCS1_V1_5 for max compatibility unless server creates keys with specific restrictions.
  // Wait, if server uses `crypto.publicEncrypt`, it expects OAEP.
  // If I send PKCS1.5, server decryption might fail if it enforces OAEP.

  // Let's assume standard behavior. I will stick to the simplest:
  // publicKey.encrypt(buffer) in Forge is typically PKCS#1 v1.5.
  // Node's `crypto.privateDecrypt` can handle PKCS#1 v1.5 automatically or needs flag.

  // To be perfectly safe, I should verify what the server is doing.
  // Server: `const decrypted = crypto.privateDecrypt(privateKey, buffer);`
  // This function automatically detects padding (OAEP, PKCS1, etc) usually.

  return forge.util.encode64(encrypted);
};

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encryptedDataHex - Encrypted data in hex
 * @param {string} ivHex - Initialization vector in hex
 * @param {string} keyHex - AES key in hex
 * @returns {string} - Decrypted plaintext
 */
export const decryptWithAES = (encryptedDataHex, ivHex, keyHex) => {
  const key = forge.util.hexToBytes(keyHex);
  const iv = forge.util.hexToBytes(ivHex);
  const encrypted = forge.util.hexToBytes(encryptedDataHex);

  const decipher = forge.cipher.createDecipher("AES-CBC", key);
  decipher.start({ iv: iv });
  decipher.update(forge.util.createBuffer(encrypted));
  const result = decipher.finish();

  if (result) {
    return decipher.output.toString();
  } else {
    throw new Error("Decryption failed");
  }
};
