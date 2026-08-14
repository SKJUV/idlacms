import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_deep_audit_pdf():
    pdf_path = "/home/skjuve/Documents/IDLA_Documentation/Rapport_Audit_Technique_Approfondi_IDLA.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'DocH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#004d34'),
        spaceBefore=14,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=12,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'DocCode',
        parent=body_style,
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a'),
        leftIndent=15,
        spaceAfter=6
    )

    story = []

    # Title Banner
    story.append(Paragraph("🔬 RAPPORT D'AUDIT TECHNIQUE & ARCHITECTURAL APPROFONDI", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#004d34'), spaceAfter=8))
    story.append(Paragraph("<b>Plateforme auditée :</b> IDLA CMS (Institut de Développement et de Leadership en Afrique)", body_style))
    story.append(Paragraph("<b>Niveau d'exigence :</b> Senior Full-Stack Architect / PhD in Computer Science", body_style))
    story.append(Paragraph("<b>Date d'Inspection :</b> 14 Août 2026", body_style))
    story.append(Spacer(1, 10))

    # 1. Synthèse
    story.append(Paragraph("1. 📋 Synthèse Exécutive & Matrice de Maturité", h1_style))
    story.append(Paragraph("L'analyse rigoureuse du code source, de la base de données Appwrite Cloud et des mécanismes de sécurité révèle un système <b>pleinement fonctionnel et prêt pour l'exploitation académique</b>, mais présentant une dette technique de type 'Prototype Évolué' (MVP Avancé) nécessitant une refactorisation industrielle.", body_style))

    table_data = [
        [Paragraph("<b>Axe d'Évaluation</b>", body_style), Paragraph("<b>Statut</b>", body_style), Paragraph("<b>Note</b>", body_style), Paragraph("<b>Diagnostic Technique Synthétique</b>", body_style)],
        [Paragraph("Fonctionnalités Métier", body_style), Paragraph("✅ Conforme", body_style), Paragraph("9.5/10", body_style), Paragraph("100% des flux (64 programmes, candidatures, emplois du temps) fonctionnels.", body_style)],
        [Paragraph("Modularité Frontend", body_style), Paragraph("⚠️ Dette Tech", body_style), Paragraph("5.5/10", body_style), Paragraph("Fichiers monolithiques majeurs (StudentPortal >3000 LOC, TeacherPortal >1250 LOC).", body_style)],
        [Paragraph("Gestion des États", body_style), Paragraph("⚠️ À refondre", body_style), Paragraph("6.0/10", body_style), Paragraph("Stockage hybride localStorage + Appwrite direct sans State Manager global.", body_style)],
        [Paragraph("Modélisation DB", body_style), Paragraph("✅ Conforme", body_style), Paragraph("7.5/10", body_style), Paragraph("11 collections Appwrite configurées. Tableaux JSON complexes à normaliser.", body_style)],
        [Paragraph("Sécurité & Droits ACL", body_style), Paragraph("⚠️ Attention Prod", body_style), Paragraph("6.5/10", body_style), Paragraph("Permissions souples MVP (create/update any) à restreindre par document/rôle.", body_style)],
        [Paragraph("Performance Build", body_style), Paragraph("✅ Excellent", body_style), Paragraph("9.5/10", body_style), Paragraph("Compilation Vite en 2.48s avec 0 erreur TypeScript et découpage en chunks.", body_style)],
    ]

    t = Table(table_data, colWidths=[110, 80, 45, 265])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # 2. Frontend
    story.append(Paragraph("2. 🏗️ Audit Approfondi du Frontend (React / TypeScript / Vite)", h1_style))
    story.append(Paragraph("<b>2.1. Anatomie des Composants Monolithiques :</b>", h2_style))
    story.append(Paragraph("• <b>StudentPortal.tsx (3 050 lignes)</b> : Monolithe gérant authentification, cours, devoirs, chat en direct et localStorage.", bullet_style))
    story.append(Paragraph("• <b>TeacherPortal.tsx (1 260 lignes)</b> : Gère simultanément profil, attribution de cours, algorithme d'horaires et chat de classe.", bullet_style))
    story.append(Paragraph("• <b>ApplicationForm.tsx (1 140 lignes)</b> : Formulaire 4 étapes, envoi d'OTP, création Auth Appwrite et profil DB.", bullet_style))

    story.append(Paragraph("<b>2.2. Moteur de Routage Ad-hoc vs Standard React Router :</b>", h2_style))
    story.append(Paragraph("L'application utilise un état string local <code>activeTab</code> dans <code>App.tsx</code> avec manipulation manuelle de <code>window.history.pushState</code>. Ce choix empêche le découpage de code par route (Code-Splitting via React.lazy).", body_style))

    story.append(Spacer(1, 10))

    # 3. Database
    story.append(Paragraph("3. 🗄️ Audit Exhaustif de la Base de Données (Appwrite Cloud DB)", h1_style))
    story.append(Paragraph("La base de données <code>idla_cms</code> contient <b>11 collections actives</b> :", body_style))
    story.append(Paragraph("1. <b>programs (65 docs)</b> : Formations indexées par type, catégorie et titre (Fulltext).", bullet_style))
    story.append(Paragraph("2. <b>news (6 docs)</b> : Actualités et annonces académiques.", bullet_style))
    story.append(Paragraph("3. <b>testimonials (5 docs)</b> : Témoignages et avis certifiés.", bullet_style))
    story.append(Paragraph("4. <b>applications (5 docs)</b> : Candidatures d'étudiants (Statuts: New, In Review, Accepted, Rejected).", bullet_style))
    story.append(Paragraph("5. <b>cms_users (4 docs)</b> : Source de vérité des utilisateurs avec rôles stricts (Super Admin, teacher, student).", bullet_style))
    story.append(Paragraph("6. <b>candidate_documents (2 docs)</b> : Pièces justificatives liées aux candidatures.", bullet_style))
    story.append(Paragraph("7. <b>messages (1 doc)</b> : Messagerie candidat/conseiller avec Document Security activé.", bullet_style))
    story.append(Paragraph("8. <b>custom_forms (1 doc) & form_responses (0 doc)</b> : Moteur de formulaires dynamiques.", bullet_style))
    story.append(Paragraph("9. <b>teachers (3 docs) & activity_logs (0 doc)</b> : Collections dérivées et journal d'activité.", bullet_style))

    story.append(Spacer(1, 10))

    # 4. Security
    story.append(Paragraph("4. 🛡️ Audit de Sécurité & Droits d'Accès (ACL)", h1_style))
    story.append(Paragraph("• <b>Protection de la Clé Master :</b> La clé d'administration master <code>APPWRITE_API_KEY</code> est strictement confinée aux scripts Node.js et absente du bundle client.", bullet_style))
    story.append(Paragraph("• <b>Permissions de Collections :</b> Les permissions <code>update('any')</code> et <code>create('any')</code> sur <code>cms_users</code> et <code>applications</code> facilitent l'accès client-side mais doivent être verrouillées par <code>Document Security</code> en production d'entreprise.", bullet_style))

    story.append(Spacer(1, 10))

    # 5. Roadmap
    story.append(Paragraph("5. 🚀 Feuille de Route & Recommandations d'Architecture", h1_style))
    story.append(Paragraph("1. <b>Phase 1 (Effectuée) :</b> Filtrage universel multi-critères, sync complète enseignants/emplois du temps et attribution stricte des rôles.", bullet_style))
    story.append(Paragraph("2. <b>Phase 2 (Sécurité Prod) :</b> Activation du verrouillage Document Security sur <code>applications</code> et <code>cms_users</code>.", bullet_style))
    story.append(Paragraph("3. <b>Phase 3 (Refactoring Frontend) :</b> Migration vers React Router v6, intégration de TanStack Query (React Query) et modularisation des monolithes.", bullet_style))

    doc.build(story)
    print(f"✅ PDF approfondi généré avec succès : {pdf_path}")

if __name__ == "__main__":
    generate_deep_audit_pdf()
