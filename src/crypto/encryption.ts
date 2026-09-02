// Encryption utilities using Web Crypto API

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

/**
 * Generate a random salt (16 bytes)
 */
export async function generateSalt(): Promise<string> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(randomBytes.buffer);
}

/**
 * Derive a 256-bit key from password using PBKDF2-SHA256
 */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const saltBuffer = base64ToArrayBuffer(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 250000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-256-GCM
 * Returns { iv, ciphertext } both as base64 strings
 */
export async function encryptData(data: string, key: CryptoKey): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ENCODER.encode(data)
  );
  
  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decryptData(iv: string, ciphertext: string, key: CryptoKey): Promise<string> {
  const ivBuffer = base64ToArrayBuffer(iv);
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    ciphertextBuffer
  );
  
  return DECODER.decode(decrypted);
}

/**
 * Create a password verifier by encrypting a known string
 * Returns { iv, ciphertext } both as base64 strings
 */
export async function createPasswordVerifier(key: CryptoKey): Promise<{ iv: string; ciphertext: string }> {
  const knownString = 'GHARKHATA_VERIFIER_2024';
  return encryptData(knownString, key);
}

/**
 * Verify password by checking if it can decrypt the verifier
 * Verifier should be in format: "iv:ciphertext"
 */
export async function verifyPassword(verifier: string, password: string, salt: string): Promise<boolean> {
  try {
    const [iv, ciphertext] = verifier.split(':');
    if (!iv || !ciphertext) return false;
    
    const key = await deriveKey(password, salt);
    const decrypted = await decryptData(iv, ciphertext, key);
    return decrypted === 'GHARKHATA_VERIFIER_2024';
  } catch {
    return false;
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
