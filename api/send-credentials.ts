export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, fullName, tempPassword, userDefinedPassword } = req.body || {};

  if (!email || !fullName || !tempPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API key is not configured' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'IDLA Admissions <Admission@idlaacademy.online>',
        to: email,
        subject: '🎓 Candidature IDLA — Vos identifiants d\'accès',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #0d9488; padding: 24px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.05em;">INTERNATIONAL DISTANCE LEARNING ACADEMY</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Service des Admissions</p>
            </div>
            <div style="padding: 24px; color: #334155; font-size: 15px; line-height: 1.6;">
              <p>Bonjour <strong>${fullName}</strong>,</p>
              <p>Votre inscription à l'International Distance Learning Academy (IDLA) a été enregistrée avec succès.</p>
              <p>Votre compte d'accès a été créé avec succès pour vous permettre d'explorer nos programmes et de postuler. Voici un rappel de vos informations de connexion :</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Email :</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #0d9488;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Mot de passe :</td>
                    <td style="padding: 6px 0; font-weight: bold; color: ${userDefinedPassword ? '#0d9488' : '#e11d48'}; font-family: monospace; font-size: ${userDefinedPassword ? '14px' : '16px'};">${userDefinedPassword ? 'Celui que vous avez choisi lors de l\'inscription' : tempPassword}</td>
                  </tr>
                </table>
              </div>
              ${!userDefinedPassword ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
                  ⚠️ IMPORTANT : Vous devez modifier ce mot de passe lors de votre première connexion pour sécuriser votre compte.
                </p>
              </div>` : ''}
              <p>Connectez-vous à votre espace candidat pour explorer les programmes, postuler et échanger avec votre conseillère d'admission :</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://idlaacademy.online/candidat" style="display: inline-block; background-color: #0d9488; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                  Accéder à mon espace candidat →
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                ⚠️ Ne partagez jamais ces identifiants avec quiconque. L'IDLA ne vous demandera jamais votre mot de passe par téléphone ou par un autre canal.<br/>
                Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errorData.message || 'Failed to send credentials email via Resend' });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
