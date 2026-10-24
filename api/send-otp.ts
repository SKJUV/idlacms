import dns from 'dns';
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

function getResendApiKey(): string {
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY;
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^RESEND_API_KEY=["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (e) {}
  return '';
}

export function getOtpSecret(): string {
  // Priorité : variable dédiée → fallback stable hardcodé.
  // Le fallback est identique dans send-otp et verify-otp → pas de désync.
  return process.env.OTP_SECRET || 'idla-secure-master-otp-secret-2026';
}

/** Chiffre un payload JSON avec AES-256-GCM. Retourne un token base64url. */
export async function encryptToken(payload: object, secret: string): Promise<string> {
  const keyMaterial = crypto.createHash('sha256').update(secret).digest(); // 32 bytes
  const iv = crypto.randomBytes(12); // 96-bit IV pour GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', keyMaterial, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes
  // Format : iv(12) + authTag(16) + ciphertext → base64url
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64url');
}

/** Déchiffre un token AES-256-GCM. Retourne le payload ou null si invalide. */
export function decryptToken(token: string, secret: string): object | null {
  try {
    const keyMaterial = crypto.createHash('sha256').update(secret).digest();
    const combined = Buffer.from(token, 'base64url');
    if (combined.length < 28) return null; // 12 + 16 minimum
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

function postToResend(apiKey: string, payload: any): Promise<{ ok: boolean; status: number; data: any }> {
  const jsonPayload = JSON.stringify(payload);

  return new Promise(async (resolve) => {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: jsonPayload,
      });
      const data = await res.json().catch(() => ({}));
      return resolve({ ok: res.ok, status: res.status, data });
    } catch (fetchErr) {
      const req = https.request('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(jsonPayload),
        },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          let data: any = {};
          try { data = JSON.parse(body || '{}'); } catch { data = {}; }
          const ok = (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300;
          resolve({ ok, status: res.statusCode || 500, data });
        });
      });

      req.on('error', (reqErr: any) => {
        resolve({
          ok: false,
          status: 500,
          data: { error: `Erreur réseau: ${reqErr.message || 'Connexion à Resend impossible'}` }
        });
      });

      req.write(jsonPayload);
      req.end();
    }
  });
}

function escapeHtml(unsafe: string): string {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

  const { email, fullName } = req.body || {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || !fullName) {
    return res.status(400).json({ error: 'Adresse e-mail ou nom complet manquant ou invalide.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Génération sécurisée côté serveur d'un code OTP à 6 chiffres
  const generatedOtp = Math.floor(100000 + crypto.randomInt(0, 900000)).toString();

  // Chiffrement AES-256-GCM : le token est auto-suffisant (contient email + otp + expiresAt)
  // Aucune variable d'env externe requise pour la vérification.
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const secret = getOtpSecret();
  const token = await encryptToken({ email: cleanEmail, otp: generatedOtp, expiresAt }, secret);

  const resendApiKey = getResendApiKey();
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API key is not configured' });
  }

  const safeFullName = escapeHtml(fullName);
  const safeOtpCode = escapeHtml(generatedOtp);

  const { ok, status, data } = await postToResend(resendApiKey, {
    from: 'IDLA Admissions <Admission@idlaacademy.online>',
    to: cleanEmail,
    subject: '🔐 Votre code de vérification — Candidature IDLA',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0d9488; padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.05em;">INTERNATIONAL DISTANCE LEARNING ACADEMY</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Service des Admissions</p>
        </div>
        <div style="padding: 24px; color: #334155; font-size: 15px; line-height: 1.6;">
          <p>Bonjour <strong>${safeFullName}</strong>,</p>
          <p>Nous avons bien enregistré votre demande d'inscription à l'International Distance Learning Academy (IDLA).</p>
          <p>Afin de confirmer votre identité et sécuriser votre compte, veuillez utiliser le code de vérification unique ci-dessous (valable 5 minutes) :</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="display: inline-block; background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 12px 32px; color: #0f172a;">${safeOtpCode}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            ⚠️ Ne partagez jamais ce code avec quiconque. L'IDLA ne vous demandera jamais ce code par téléphone ou par un autre canal.<br/>
            Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
          </p>
        </div>
      </div>
    `,
  });

  if (!ok) {
    return res.status(status).json({ error: data.error || data.message || 'Échec de l\'envoi du code par e-mail.' });
  }

  // Le code OTP n'est JAMAIS renvoyé dans la réponse au client
  return res.status(200).json({ success: true, token, expiresAt });
}
