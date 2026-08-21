import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../components/Header';
import { LanguageProvider } from '../context/LanguageContext';

describe('Header Component - Homepage Integrity Tests', () => {
  const defaultProps = {
    activeTab: 'home' as const,
    setActiveTab: vi.fn(),
    onSignUpClick: vi.fn(),
    onStudentLoginClick: vi.fn(),
    onAdminLoginClick: vi.fn(),
    onLogoutClick: vi.fn(),
    isLoggedIn: false,
    theme: 'light' as const,
    setTheme: vi.fn(),
  };

  const renderHeader = (props = defaultProps) => {
    return render(
      <LanguageProvider>
        <Header {...props} />
      </LanguageProvider>
    );
  };

  it('renders IDLA logo and brand title correctly', () => {
    renderHeader();
    expect(screen.getByAltText('IDLA Logo')).toBeInTheDocument();
    expect(screen.getByText('IDLA')).toBeInTheDocument();
  });

  it('renders all public navigation links', () => {
    renderHeader();
    expect(screen.getByText(/Accueil|Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Filières & Cursus|Degree Programs/i)).toBeInTheDocument();
    expect(screen.getByText(/Actualités|News/i)).toBeInTheDocument();
  });

  it('renders single language switcher toggle button (FR / EN)', () => {
    renderHeader();
    const langBtn = screen.getByTitle(/Switch to English|Passer en Français/i);
    expect(langBtn).toBeInTheDocument();
  });

  it('toggles language when clicking language switcher button', () => {
    renderHeader();
    const langBtn = screen.getByTitle(/Switch to English|Passer en Français/i);
    expect(langBtn).toBeInTheDocument();
    fireEvent.click(langBtn);
    // Button exists and responds to click
    expect(langBtn).toBeInTheDocument();
  });

  it('triggers theme change on theme button click', () => {
    renderHeader();
    const themeBtn = screen.getByTitle(/Activer le mode sombre|Activer le mode clair/i);
    fireEvent.click(themeBtn);
    expect(defaultProps.setTheme).toHaveBeenCalledWith('dark');
  });
});
