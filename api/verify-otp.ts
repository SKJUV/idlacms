import crypto from 'crypto';
import { getOtpSecret } from './send-otp';

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
  const cleanOtp = String(otpCode).trim();

  const parts = String(token).split('.');
  if (parts.length !== 2) {
    return res.status(400).json({ 
      success: false, 
      error: 'Jeton de vérification invalide ou altéré.' 
    });
  }

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Jeton de vérification corrompu.' 
    });
  }

  // Vérification stricte de l'expiration
  if (Date.now() > expiresAt) {
    return res.status(400).json({ 
      success: false, 
      error: 'Le code de vérification a expiré (délai de 5 minutes dépassé). Veuillez en demander un nouveau.' 
    });
  }

  // Recalcul du HMAC attendu
  const secret = getOtpSecret();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${cleanEmail}:${cleanOtp}:${expiresAt}`)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedSignature, 'hex');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
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
