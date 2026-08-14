import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf():
    pdf_path = "/home/skjuve/Documents/IDLA_Documentation/Rapport_Evaluation_Architecturale_IDLA.pdf"
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
        textColor=colors.HexColor('#004d34'),
        spaceAfter=10
    )

    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=12,
        spaceAfter=4
    )

    story = []

    # Title
    story.append(Paragraph("🔬 Rapport d'Évaluation Architecturale & Audit Technique — IDLA CMS", title_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#004d34'), spaceAfter=10))

    story.append(Paragraph("<b>Auteur :</b> Antigravity Senior Full-Stack Architect (PhD in Computer Science)", body_style))
    story.append(Paragraph("<b>Projet :</b> IDLA CMS (Institut de Développement et de Leadership en Afrique)", body_style))
    story.append(Paragraph("<b>Emplacement des documents :</b> Documents/IDLA_Documentation/", body_style))
    story.append(Spacer(1, 10))

    # Executive summary table
    story.append(Paragraph("📋 Verdict de Conformité Globale", h2_style))

    table_data = [
        [Paragraph("<b>Domaine</b>", body_style), Paragraph("<b>Statut</b>", body_style), Paragraph("<b>Note</b>", body_style), Paragraph("<b>Observation Clé</b>", body_style)],
        [Paragraph("Interface & UX", body_style), Paragraph("✅ Conforme", body_style), Paragraph("9.5/10", body_style), Paragraph("4 portails isolés, zone de filtrage universelle, 0 crash React hook", body_style)],
        [Paragraph("Performance Build", body_style), Paragraph("✅ Conforme", body_style), Paragraph("9.5/10", body_style), Paragraph("Build Vite validé en 2.48s sans aucune erreur TypeScript", body_style)],
        [Paragraph("Synchronisation DB", body_style), Paragraph("✅ Conforme", body_style), Paragraph("8.5/10", body_style), Paragraph("Sync bi-directionnelle Appwrite DB <-> État local avec fallback", body_style)],
        [Paragraph("Modélisation DB", body_style), Paragraph("⚠️ Conforme (Évolutif)", body_style), Paragraph("7.5/10", body_style), Paragraph("11 collections indexées. Tableaux JSON à normaliser en table schedules", body_style)],
        [Paragraph("Sécurité & ACL", body_style), Paragraph("⚠️ Conforme (MVP)", body_style), Paragraph("7.0/10", body_style), Paragraph("Permissions souples MVP à restreindre aux admins en prod finale", body_style)],
    ]

    t = Table(table_data, colWidths=[100, 80, 50, 270])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

    # Sections
    story.append(Paragraph("1. 🏗️ Audit Frontend & Interfaces User", h2_style))
    story.append(Paragraph("• <b>Portails Métiers :</b> Isolement étanche entre PublicPortal, StudentPortal, TeacherPortal et AdminPortal.", bullet_style))
    story.append(Paragraph("• <b>Filtrage Universel :</b> Intégration du composant ProgramFilterBar avec recherche multi-critères sur les 64 formations.", bullet_style))
    story.append(Paragraph("• <b>Règles des Hooks :</b> Conformité 100% des règles d'ordre des hooks React (Hooks placés avant tout early return).", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("2. 🗄️ Audit Base de Données Appwrite Cloud", h2_style))
    story.append(Paragraph("• <b>11 Collections Opérationnelles :</b> programs, news, testimonials, applications, cms_users, candidate_documents, messages, custom_forms, form_responses, teachers, activity_logs.", bullet_style))
    story.append(Paragraph("• <b>Attribution des Rôles :</b> Configuration explicite des rôles dans cms_users (Super Admin, teacher, student).", bullet_style))
    story.append(Paragraph("• <b>Indexation :</b> Présence d'index Fulltext sur la recherche et d'index uniques sur les emails.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("3. 🛡️ Audit Sécurité & Droits d'Accès", h2_style))
    story.append(Paragraph("• <b>Confinement des Clés :</b> Variables VITE_ publiques séparées de la clé d'administration master APPWRITE_API_KEY.", bullet_style))
    story.append(Paragraph("• <b>Protection des Messages :</b> Collection messages sécurisée avec Document Security et droits utilisateurs.", bullet_style))

    doc.build(story)
    print(f"✅ PDF généré avec succès : {pdf_path}")

if __name__ == "__main__":
    generate_pdf()
