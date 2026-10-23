import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkillNode } from '../components/graph/SkillNode';
import { GraphNodeData } from '../types';

// Mock @xyflow/react Handle component
vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="rf-handle" />,
  Position: { Left: 'left', Right: 'right' },
}));

describe('SkillNode Component', () => {
  it('renders skill label, category, and demonstrated badge', () => {
    const mockData: GraphNodeData = {
      id: '1',
      skill_id: 1,
      label: 'React',
      slug: 'react',
      category: 'Frameworks',
      difficulty: 'intermediate',
      status: 'demonstrated',
      proficiency_score: 92,
      is_prerequisite_ready: true,
      missing_prerequisites: [],
      evidence_type: 'assessment',
      is_role_required: true,
      role_importance: 'mandatory',
      position: { x: 100, y: 100 },
    };

    render(<SkillNode data={mockData} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
    expect(screen.getByText(/Demonstrated/i)).toBeInTheDocument();
    expect(screen.getByText('92% verified')).toBeInTheDocument();
  });
});
