import crypto from 'crypto';

function getOtpSecret(): string {
  return process.env.OTP_SECRET || 'idla-secure-master-otp-secret-2026';
}

function decryptToken(token: string, secret: string): { email?: string; otp?: string; expiresAt?: number } | null {
  try {
    const keyMaterial = crypto.createHash('sha256').update(secret).digest();
    const combined = Buffer.from(token, 'base64url');
    if (combined.length < 28) return null; // 12 bytes IV + 16 bytes auth tag minimum
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const ciphertext = combined.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyMaterial, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  const allowedOrigins = [
    'https://idlaacademy.online',
    'https://www.idlaacademy.online',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otpCode, token } = req.body || {};

  if (!email || !otpCode || !token) {
    return res.status(400).json({ 
      success: false, 
      error: 'Champs obligatoires manquants pour la vérification OTP.' 
    });
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const cleanOtp = String(otpCode).replace(/\D/g, '');

  if (!cleanOtp || cleanOtp.length !== 6) {
    return res.status(400).json({ 
      success: false, 
      error: 'Le code de vérification doit comporter exactement 6 chiffres.' 
    });
  }

  // Déchiffrement AES-256-GCM du token — auto-suffisant, aucune variable externe
  const secret = getOtpSecret();
  const payload = decryptToken(String(token), secret) as any;

  if (!payload) {
    return res.status(400).json({ 
      success: false, 
      error: 'Jeton de vérification invalide ou altéré. Veuillez redemander un code.' 
    });
  }

  // Vérification stricte de l'expiration
  if (typeof payload.expiresAt !== 'number' || Date.now() > payload.expiresAt) {
    return res.status(400).json({ 
      success: false, 
      error: 'Le code de vérification a expiré (délai de 5 minutes dépassé). Veuillez en demander un nouveau.' 
    });
  }

  // Vérification de l'email (protection contre la réutilisation cross-utilisateur)
  if (payload.email !== cleanEmail) {
    return res.status(400).json({ 
      success: false, 
      error: 'Ce code de vérification ne correspond pas à cette adresse e-mail.' 
    });
  }

  // Vérification du code OTP (comparaison en temps constant de hashes SHA-256 garantis 32 octets)
  const expectedOtp = String(payload.otp).replace(/\D/g, '');
  const otpHash = crypto.createHash('sha256').update(cleanOtp).digest();
  const expectedHash = crypto.createHash('sha256').update(expectedOtp).digest();

  if (!crypto.timingSafeEqual(otpHash, expectedHash)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Code de vérification incorrect. Veuillez vérifier le code reçu par e-mail et réessayer.' 
    });
  }

  return res.status(200).json({ 
    success: true, 
    message: 'Identité vérifiée avec succès.' 
  });
}
