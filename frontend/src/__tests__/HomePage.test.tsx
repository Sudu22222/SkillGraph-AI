import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HomePage } from '../pages/HomePage';

describe('HomePage Component', () => {
  it('renders brand title and purpose', () => {
    const handleGetStarted = vi.fn();
    const handleLogin = vi.fn();

    render(<HomePage onGetStarted={handleGetStarted} onLogin={handleLogin} />);

    expect(screen.getAllByText(/SkillGraph AI/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Understand your skills/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan your next move/i)).toBeInTheDocument();
  });

  it('renders the 5 workflow steps correctly', () => {
    render(<HomePage onGetStarted={vi.fn()} onLogin={vi.fn()} />);

    expect(screen.getByText(/Choose Target Role/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify Skills/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualize Dependencies/i)).toBeInTheDocument();
    expect(screen.getByText(/Follow Roadmap/i)).toBeInTheDocument();
    expect(screen.getByText(/Demonstrate Mastery/i)).toBeInTheDocument();
  });
});
