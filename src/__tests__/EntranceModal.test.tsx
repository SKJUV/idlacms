import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EntranceModal from '../components/EntranceModal';
import { LanguageProvider } from '../context/LanguageContext';

describe('EntranceModal Component - Concours Announcement Hover Tests', () => {
  it('shows Concours information card on mouse enter and hides on mouse leave', () => {
    const onOpenConcoursForm = vi.fn();
    const { container } = render(
      <LanguageProvider>
        <EntranceModal onOpenConcoursForm={onOpenConcoursForm} />
      </LanguageProvider>
    );

    // Initial state: details card is hidden until hovered
    expect(screen.queryByText(/2026-2027 ONSITE AND ONLINE ADMISSION CONCOURS IDLA/i)).not.toBeInTheDocument();

    // Mouse Enter triggers info display
    const triggerBtn = container.querySelector('.fixed.bottom-6')!;
    fireEvent.mouseEnter(triggerBtn);
    expect(screen.getByText(/2026-2027 ONSITE AND ONLINE ADMISSION CONCOURS IDLA/i)).toBeInTheDocument();

    // Mouse Leave collapses info card back into button
    fireEvent.mouseLeave(triggerBtn);
    expect(screen.queryByText(/2026-2027 ONSITE AND ONLINE ADMISSION CONCOURS IDLA/i)).not.toBeInTheDocument();
  });

  it('triggers onOpenConcoursForm callback when floating button is clicked', () => {
    const onOpenConcoursForm = vi.fn();
    const { container } = render(
      <LanguageProvider>
        <EntranceModal onOpenConcoursForm={onOpenConcoursForm} />
      </LanguageProvider>
    );

    const triggerBtn = container.querySelector('.fixed.bottom-6 .group')!;
    fireEvent.click(triggerBtn);
    expect(onOpenConcoursForm).toHaveBeenCalledTimes(1);
  });
});
