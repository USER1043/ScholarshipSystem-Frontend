import api from "../api/api";

// Uses the browser's built-in Web Crypto API. Note: crypto.subtle is only
// available in secure contexts (HTTPS or localhost).

const bytesToHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

const hexToBytes = (hex) =>
  Uint8Array.from(hex.match(/.{2}/g), (byte) => parseInt(byte, 16));

const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));

const pemToDer = (pem) => {
  const base64 = pem
    .replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

const getSubtle = () => {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "Web Crypto is unavailable. The app must be served over HTTPS or localhost.",
    );
  }
  return globalThis.crypto.subtle;
};

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
    throw new Error("Could not initialize security context", { cause: error });
  }
};

/**
 * Generate a random 32-byte AES key
 * @returns {string} - Hex string of the key
 */
export const generateAESKey = () => {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(key);
};

const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;

/**
 * Encrypt data using AES-256-GCM (authenticated, matching the server's aesUtil)
 * @param {string} data - Plain text data
 * @param {string} keyHex - Hex string of the AES key
 * @returns {Promise<object>} - { iv, encryptedData, authTag } (all hex)
 */
export const encryptWithAES = async (data, keyHex) => {
  const subtle = getSubtle();
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
  const key = await subtle.importKey(
    "raw",
    hexToBytes(keyHex),
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const encrypted = new Uint8Array(
    await subtle.encrypt(
      { name: "AES-GCM", iv, tagLength: GCM_TAG_LENGTH * 8 },
      key,
      new TextEncoder().encode(data),
    ),
  );

  // Web Crypto appends the auth tag to the ciphertext; the server expects it separately
  const tagStart = encrypted.length - GCM_TAG_LENGTH;
  return {
    iv: bytesToHex(iv),
    encryptedData: bytesToHex(encrypted.slice(0, tagStart)),
    authTag: bytesToHex(encrypted.slice(tagStart)),
  };
};

/**
 * Encrypt the raw AES key bytes using the Server's Public RSA Key.
 * Uses RSA-OAEP with SHA-256, matching the server's rsaUtil
 * (RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256").
 * @param {string} aesKeyHex - Hex string of the AES key
 * @param {string} publicKeyPem - PEM string of Server Public Key
 * @returns {Promise<string>} - Base64 encoded encrypted key
 */
export const encryptAESKeyWithRSA = async (aesKeyHex, publicKeyPem) => {
  const subtle = getSubtle();
  const publicKey = await subtle.importKey(
    "spki",
    pemToDer(publicKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  const encrypted = await subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    hexToBytes(aesKeyHex),
  );

  return bytesToBase64(new Uint8Array(encrypted));
};
