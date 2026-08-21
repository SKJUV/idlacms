import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EntranceModal from '../components/EntranceModal';
import { LanguageProvider } from '../context/LanguageContext';

describe('EntranceModal Component - Concours Announcement Tests', () => {
  it('renders Concours announcement popup with title and tag', () => {
    const onOpenConcoursForm = vi.fn();
    render(
      <LanguageProvider>
        <EntranceModal onOpenConcoursForm={onOpenConcoursForm} />
      </LanguageProvider>
    );

    expect(screen.getByText(/Concours Officiel|Official Concours/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-2027 ONSITE AND ONLINE ADMISSION CONCOURS IDLA/i)).toBeInTheDocument();
  });

  it('triggers onOpenConcoursForm callback when CTA button is clicked', () => {
    const onOpenConcoursForm = vi.fn();
    render(
      <LanguageProvider>
        <EntranceModal onOpenConcoursForm={onOpenConcoursForm} />
      </LanguageProvider>
    );

    const ctaBtn = screen.getByRole('button', { name: /S'inscrire au Concours Direct|Apply for Direct Concours/i });
    expect(ctaBtn).toBeInTheDocument();
    fireEvent.click(ctaBtn);
    expect(onOpenConcoursForm).toHaveBeenCalledTimes(1);
  });
});
