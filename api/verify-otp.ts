import crypto from 'crypto';
import { getOtpSecret, decryptToken } from './send-otp';

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

  // Vérification du code OTP (comparaison en temps constant pour éviter les timing attacks)
  const otpBuf = Buffer.from(cleanOtp.padEnd(6, '\0'));
  const expectedBuf = Buffer.from(String(payload.otp).padEnd(6, '\0'));
  if (otpBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(otpBuf, expectedBuf)) {
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
