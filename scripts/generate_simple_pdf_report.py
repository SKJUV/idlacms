import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def build_pdf():
    pdf_paths = [
        "/home/skjuve/.gemini/antigravity-cli/brain/698c21ea-a3a2-444d-934d-d7bf6e1a165c/Rapport_Synthese_IDLA.pdf",
        "/home/skjuve/Documents/Rapport_Synthese_IDLA.pdf"
    ]

    for pdf_path in pdf_paths:
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        
        primary_color = colors.HexColor('#1E3A8A')   # Navy Blue
        secondary_color = colors.HexColor('#0284C7') # Sky Blue
        dark_text = colors.HexColor('#1F2937')       # Dark Charcoal

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=primary_color,
            spaceAfter=6
        )

        subtitle_style = ParagraphStyle(
            'DocSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#475569'),
            spaceAfter=15
        )

        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=primary_color,
            spaceBefore=14,
            spaceAfter=8
        )

        bullet_style = ParagraphStyle(
            'BulletItem',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10.5,
            leading=15,
            textColor=dark_text,
            spaceAfter=8
        )

        story = []

        # Title & Header
        story.append(Paragraph("RAPPORT DE SYNTHÈSE DES CORRECTIONS ET AMÉLIORATIONS", title_style))
        story.append(Paragraph("Plateforme IDLA (International Distance Learning Academy)", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=2, color=secondary_color, spaceAfter=15))

        # SECTION 1: NOUVEAUTÉS ET AMÉLIORATIONS
        story.append(Paragraph("1. Nouveautés et Améliorations Apportées", section_heading))
        story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

        apports = [
            ("Pages de profil personnalisées pour tous les espaces :", "Création des espaces de profil dédiés pour les enseignants, les administrateurs et les étudiants. Chacun peut désormais consulter ses informations personnelles, sa photo et ses cours assignés."),
            ("Vérification automatique à l'inscription :", "Mise en place d'un contrôle automatique qui empêche l'inscription avec une adresse e-mail déjà utilisée, évitant la création de comptes en double."),
            ("Restauration intégrale du catalogue des diplômes et certifications :", "Remise en place de la totalité des 64 programmes de formation (informatique Cisco, soins de santé AMCA/ASHI, comptabilité, Bachelors, Masters et Doctorats)."),
            ("Attribution et association des programmes d'enseignement :", "Configuration de la plateforme pour associer directement les enseignants actifs à leurs programmes de cours correspondants."),
            ("Sauvegarde sécurisée et continue :", "Mise en place d'un système de mise à jour intelligent qui préserve l'ensemble des données existantes sans jamais tout effacer lors des synchronisations.")
        ]

        for title, desc in apports:
            bullet_text = f"• <b>{title}</b> {desc}"
            story.append(Paragraph(bullet_text, bullet_style))

        story.append(Spacer(1, 15))

        # SECTION 2: DYSFONCTIONNEMENTS CORRIGÉS
        story.append(Paragraph("2. Dysfonctionnements Corrigés", section_heading))
        story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

        corrections = [
            ("Suppression définitive de l'écran noir lors de la navigation :", "Résolution du problème d'affichage qui provoquait un écran noir lors du passage d'un onglet à un autre (emploi du temps, messagerie, profil)."),
            ("Rétablissement des boutons et de l'affichage du Profil :", "Correction des boutons 'Profil' qui n'affichaient aucune page lorsqu'on cliquait dessus."),
            ("Nettoyage des comptes enseignants de démonstration :", "Suppression définitive des profils fictifs de démonstration qui encombraient la base de données de la plateforme.")
        ]

        for title, desc in corrections:
            bullet_text = f"• <b>{title}</b> {desc}"
            story.append(Paragraph(bullet_text, bullet_style))

        story.append(Spacer(1, 25))

        # Footer note
        footer_text = "Rapport établi le 10 août 2026 — Plateforme IDLA (International Distance Learning Academy)"
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#64748B'), alignment=1)))

        doc.build(story)
        print("PDF mis à jour avec succès:", pdf_path)

if __name__ == '__main__':
    build_pdf()
