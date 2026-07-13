export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, fullName, selectedProgram, otpCode } = req.body || {};

  if (!email || !fullName || !selectedProgram || !otpCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API key is not configured on Vercel' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'IDLA Admissions <onboarding@resend.dev>',
        to: email,
        subject: '🔐 Votre code de vérification — Candidature IDLA',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #0d9488; padding: 24px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.05em;">INTERNATIONAL DISTANCE LEARNING ACADEMY</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Service des Admissions</p>
            </div>
            <div style="padding: 24px; color: #334155; font-size: 15px; line-height: 1.6;">
              <p>Bonjour <strong>${fullName}</strong>,</p>
              <p>Nous avons bien enregistré votre demande de soumission de candidature à l'IDLA pour le programme :</p>
              <p style="padding-left: 12px; border-left: 4px solid #0d9488; font-weight: bold; color: #0d9488; margin: 16px 0;">▸ ${selectedProgram}</p>
              <p>Afin de confirmer votre identité et sécuriser votre dossier, veuillez utiliser le code de vérification unique ci-dessous :</p>
              <div style="text-align: center; margin: 32px 0;">
                <span style="display: inline-block; background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 12px 32px; color: #0f172a;">${otpCode}</span>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                ⚠️ Ne partagez jamais ce code avec quiconque. L'IDLA ne vous demandera jamais ce code par téléphone ou par un autre canal.<br/>
                Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errorData.message || 'Failed to send email via Resend' });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
