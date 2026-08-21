import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PublicPortal from '../components/PublicPortal';
import { LanguageProvider } from '../context/LanguageContext';
import { Program, NewsArticle, Testimonial } from '../types';

const mockPrograms: Program[] = [
  {
    id: 'p1',
    title: 'Bachelor of Science in Computer Applications (BCA)',
    description: 'Formation diplômante internationale en génie logiciel et développement web.',
    type: 'Bachelor',
    duration: '3 ans',
    price: '450 000 FCFA / an',
    category: 'Tech',
    image: '/bca.jpg',
  },
];

const mockNews: NewsArticle[] = [
  {
    id: 'n1',
    title: 'Ouverture du Concours Direct International 2026-2027',
    description: 'Les inscriptions au concours IDLA sont ouvertes.',
    category: 'Annonces',
    date: '20/08/2026',
    image: '/news1.jpg',
  },
];

const mockTestimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Samuel M.',
    role: 'Cybersecurity Analyst',
    text: 'IDLA m\'a permis d\'acquérir des compétences concrètes et reconnues.',
    promo: 'Promotion 2025',
    category: 'Master',
    image: '/alumni1.jpg',
  },
];

describe('PublicPortal Component - Homepage Integrity Tests', () => {
  const defaultProps = {
    activeTab: 'home' as const,
    setActiveTab: vi.fn(),
    onApplyNow: vi.fn(),
    programs: mockPrograms,
    news: mockNews,
    testimonials: mockTestimonials,
    onSubmitTestimonial: vi.fn(),
    onSubmitDonation: vi.fn(),
  };

  const renderPublicPortal = (props = defaultProps) => {
    return render(
      <LanguageProvider>
        <PublicPortal {...props} />
      </LanguageProvider>
    );
  };

  it('renders Hero Banner section with title and CTA buttons', () => {
    renderPublicPortal();
    expect(screen.getByText(/L'Excellence IDLA|Academic Excellence at IDLA/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Découvrir nos Filières|Explore Degree Programs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Postuler au Concours 2026-2027|Apply for Concours 2026-2027/i })).toBeInTheDocument();
  });

  it('renders 4 Stats Counter items', () => {
    renderPublicPortal();
    expect(screen.getByText('5,000+')).toBeInTheDocument();
    expect(screen.getByText(/Alumni Actifs|Active Alumni/i)).toBeInTheDocument();
    expect(screen.getByText(/Programmes & Certifications|Degree Programs & Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Pays Représentés|Countries Represented/i)).toBeInTheDocument();
    expect(screen.getByText(/Partenaires Corporate|Corporate Partners/i)).toBeInTheDocument();
  });

  it('renders Why IDLA section with 3 pillars of excellence', () => {
    renderPublicPortal();
    expect(screen.getByText(/Pourquoi l'IDLA est le Choix n°1 en Afrique \?|Why is IDLA the #1 Choice in Africa\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Pédagogie d'Élite & Flexible|Elite & Flexible Pedagogy/i)).toBeInTheDocument();
    expect(screen.getByText(/Réseau Alumni & Mentorat|Alumni Network & Mentorship/i)).toBeInTheDocument();
    expect(screen.getByText(/Reconnaissance Internationale|International Accreditation/i)).toBeInTheDocument();
  });

  it('renders Featured Programs snippet section', () => {
    renderPublicPortal();
    expect(screen.getByText(/Nos Filières d'Excellence|Our Programs of Excellence/i)).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Science in Computer Applications (BCA)')).toBeInTheDocument();
  });

  it('triggers onApplyNow callback when hero CTA button is clicked', () => {
    renderPublicPortal();
    const applyBtn = screen.getByRole('button', { name: /Postuler au Concours 2026-2027|Apply for Concours 2026-2027/i });
    fireEvent.click(applyBtn);
    expect(defaultProps.onApplyNow).toHaveBeenCalledTimes(1);
  });
});
