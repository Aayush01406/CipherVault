/**
 * Secure encryption using AES-256-GCM and PBKDF2 for key derivation
 */

const ITERATIONS = 100000;
const KEY_LEN = 256;
const SALT_LEN = 16;
const IV_LEN = 12;

export const deriveKey = async (password: string, salt: Uint8Array, debug = false) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LEN
  );

  if (debug) {
    // Generate a fingerprint of the key for debugging purposes
    const fingerprint = new Uint8Array(derivedBits.slice(0, 8));
    console.log('Key fingerprint (first 8 bytes):', uint8ArrayToHex(fingerprint));
  }

  return window.crypto.subtle.importKey(
    'raw',
    derivedBits,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptData = async (data: ArrayBuffer | string, password: string) => {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt, true);
  
  const enc = new TextEncoder();
  const encodedData = typeof data === 'string' ? enc.encode(data) : new Uint8Array(data);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv, tagLength: 128 },
    key,
    encodedData
  );

  console.log('Encryption successful:', {
    originalSize: encodedData.byteLength,
    encryptedSize: encryptedContent.byteLength,
    salt: uint8ArrayToHex(salt),
    iv: uint8ArrayToHex(iv),
    passwordLen: password.length
  });

  return {
    encryptedContent,
    salt: uint8ArrayToHex(salt),
    iv: uint8ArrayToHex(iv),
  };
};

export const decryptData = async (
  encryptedContent: ArrayBuffer,
  password: string,
  saltHex: string,
  ivHex: string
) => {
  // Clean hex inputs but NOT the password
  const cleanSaltHex = saltHex.replace(/[^0-9a-fA-F]/g, '');
  const cleanIvHex = ivHex.replace(/[^0-9a-fA-F]/g, '');

  const salt = hexToUint8Array(cleanSaltHex);
  const iv = hexToUint8Array(cleanIvHex);

  if (salt.length === 0 || iv.length === 0) {
    throw new Error('Invalid security metadata format (Salt/IV)');
  }

  const key = await deriveKey(password, salt, true);

  // CRITICAL: Ensure we have a fresh Uint8Array view of the EXACT buffer
  const contentUint8 = new Uint8Array(encryptedContent);
  
  console.log('Decryption Attempt Details:', { 
    salt: cleanSaltHex, 
    iv: cleanIvHex, 
    saltBytes: salt.byteLength,
    ivBytes: iv.byteLength,
    contentSize: contentUint8.byteLength,
    passwordLen: password.length,
    first8Bytes: uint8ArrayToHex(contentUint8.slice(0, 8)),
    last16Bytes: uint8ArrayToHex(contentUint8.slice(-16)) // GCM tag
  });

  try {
    // Some browsers prefer ArrayBuffer over Uint8Array for the data parameter
    // We'll use the buffer directly but ensured it's not sliced
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      key,
      encryptedContent
    );
    return decryptedContent;
  } catch (error: any) {
    console.error('SubtleCrypto Decrypt Error Details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      saltSize: salt.byteLength,
      ivSize: iv.byteLength,
      contentSize: encryptedContent.byteLength,
      keyAlgorithm: JSON.stringify(key.algorithm),
    });
    throw new Error(`Decryption failed (${error.name}). This usually means the password, salt, or IV is incorrect, or the file is corrupted.`);
  }
};

export const uint8ArrayToHex = (arr: Uint8Array) => {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const hexToUint8Array = (hex: string) => {
  // Remove any non-hex characters (spaces, colons, etc.)
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  if (cleanHex.length % 2 !== 0) {
    console.warn('Hex string has odd length:', cleanHex.length);
  }
  const matches = cleanHex.match(/.{1,2}/g);
  if (!matches) {
    console.error('Failed to parse hex string:', hex);
    return new Uint8Array(0);
  }
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  console.log('Converted ArrayBuffer to Base64:', { 
    bufferSize: buffer.byteLength, 
    base64Len: base64.length 
  });
  return base64;
};

export const base64ToArrayBuffer = (base64: string) => {
  // Clean base64 string of whitespace/newlines/nulls
  const cleanBase64 = base64.replace(/[\s\x00]/g, '');
  try {
    const binaryString = window.atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('Converted Base64 to ArrayBuffer:', { 
      base64Len: cleanBase64.length, 
      bufferSize: bytes.byteLength 
    });
    return bytes.buffer;
  } catch (e) {
    console.error('Base64 decoding failed. String sample:', cleanBase64.substring(0, 50));
    throw new Error('Invalid encrypted data format (Base64 error)');
  }
};
