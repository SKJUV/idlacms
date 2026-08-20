import dns from 'dns';
import https from 'https';
import fs from 'fs';
import path from 'path';

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

export default async function handler(req: any, res: any) {
  // CORS Headers
  const allowedOrigins = [
    'https://idlaacademy.online',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendApiKey = getResendApiKey();
  if (!resendApiKey) {
    return res.status(500).json({ 
      error: 'La clé RESEND_API_KEY n\'est pas configurée dans les variables d\'environnement Vercel ou .env.' 
    });
  }

  const { from, to, subject, text, html } = req.body || {};

  if (!to || !subject) {
    return res.status(400).json({ error: 'Champs "to" et "subject" obligatoires' });
  }

  const sender = from || 'IDLA Admissions <admissions@idlaacademy.online>';

  const { ok, status, data } = await postToResend(resendApiKey, {
    from: sender,
    to,
    subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
  });

  if (!ok) {
    return res.status(status).json({
      error: data.error || data.message || data.name || 'Échec de l\'envoi via l\'API Resend',
      details: data,
    });
  }

  return res.status(200).json(data);
}
