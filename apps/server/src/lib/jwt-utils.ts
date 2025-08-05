// Simple JWT utility functions for Socket.IO authentication
// This is a basic implementation - in production, use your existing auth system

export interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const createSimpleJWT = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 hours
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifySimpleJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    
    // Verify signature
    const expectedSignature = createSignature(`${header}.${payload}`);
    if (signature !== expectedSignature) return null;

    // Decode payload
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decodedPayload;
  } catch (error) {
    return null;
  }
};

const createSignature = (data: string): string => {
  const crypto = require('crypto');
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
};