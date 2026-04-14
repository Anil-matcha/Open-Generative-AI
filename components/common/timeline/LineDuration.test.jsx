import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock useTimelineStore
vi.mock('../../../src/components/hooks/useTimelineStore.js', () => ({
  default: () => ({
    updateClipDuration: vi.fn(),
    snapEnabled: false
  })
}));

// Mock interact.js
const mockInteract = {
  draggable: vi.fn(() => ({
    unset: vi.fn()
  }))
};

vi.mock('interactjs', () => ({
  default: vi.fn(() => mockInteract)
}));

import LineDuration from './LineDuration.jsx';

describe('LineDuration Component', () => {
  const mockProps = {
    clipId: 1,
    start: 0,
    end: 10,
    trimIn: 2,
    trimOut: 8,
    onDurationChange: vi.fn(),
    onTrimChange: vi.fn()
  };

  it('should render with correct structure', () => {
    render(<LineDuration {...mockProps} />);

    // Check if the main container renders
    expect(screen.getByLabelText('Trim in point')).toBeInTheDocument();
    expect(screen.getByLabelText('Trim out point')).toBeInTheDocument();

    // Check if duration display shows correct value (8 - 2 = 6)
    expect(screen.getByText('6.00s')).toBeInTheDocument();
  });

  it('should display correct duration range', () => {
    render(<LineDuration {...mockProps} />);

    // The component should show the trimmed duration (6 seconds: 8-2)
    const durationDisplay = screen.getByText('6.00s');
    expect(durationDisplay).toBeInTheDocument();
  });

  it('should handle keyboard navigation for in-point', () => {
    render(<LineDuration {...mockProps} />);

    const inHandle = screen.getByLabelText('Trim in point');

    // Test arrow key navigation - right arrow should increase trimIn
    fireEvent.keyDown(inHandle, { key: 'ArrowRight' });

    expect(mockProps.onTrimChange).toHaveBeenCalledWith({
      trimIn: 2.1, // Assuming 0.1s increment
      trimOut: 8
    });
  });

  it('should handle keyboard navigation for out-point', () => {
    render(<LineDuration {...mockProps} />);

    const outHandle = screen.getByLabelText('Trim out point');

    // Test arrow key navigation - left arrow should decrease trimOut
    fireEvent.keyDown(outHandle, { key: 'ArrowLeft' });

    expect(mockProps.onTrimChange).toHaveBeenCalledWith({
      trimIn: 2,
      trimOut: 7.9 // Assuming 0.1s decrement
    });
  });

  it('should respect shift key for larger steps', () => {
    render(<LineDuration {...mockProps} />);

    const inHandle = screen.getByLabelText('Trim in point');

    // Test shift + arrow key for larger step
    fireEvent.keyDown(inHandle, { key: 'ArrowRight', shiftKey: true });

    expect(mockProps.onTrimChange).toHaveBeenCalledWith({
      trimIn: 3, // Assuming 1s increment with shift
      trimOut: 8
    });
  });

  it('should prevent trim in from exceeding trim out during keyboard navigation', () => {
    const constrainedProps = {
      ...mockProps,
      trimIn: 7.5,
      trimOut: 8
    };

    render(<LineDuration {...constrainedProps} />);

    const inHandle = screen.getByLabelText('Trim in point');

    // Try to move in-point beyond out-point
    fireEvent.keyDown(inHandle, { key: 'ArrowRight' });

    // Should not allow trimIn >= trimOut
    const call = mockProps.onTrimChange.mock.calls[0][0];
    expect(call.trimIn).toBeLessThan(call.trimOut);
  });

  it('should prevent trim out from going below trim in during keyboard navigation', () => {
    const constrainedProps = {
      ...mockProps,
      trimIn: 2,
      trimOut: 2.5
    };

    render(<LineDuration {...constrainedProps} />);

    const outHandle = screen.getByLabelText('Trim out point');

    // Try to move out-point below in-point
    fireEvent.keyDown(outHandle, { key: 'ArrowLeft' });

    // Should not allow trimOut <= trimIn
    const call = mockProps.onTrimChange.mock.calls[0][0];
    expect(call.trimOut).toBeGreaterThan(call.trimIn);
  });

  it('should display time markers', () => {
    render(<LineDuration {...mockProps} />);

    // Check for start and end time markers
    expect(screen.getByText('0.0s')).toBeInTheDocument();
    expect(screen.getByText('10.0s')).toBeInTheDocument();
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<LineDuration {...mockProps} />);

    const inHandle = screen.getByLabelText('Trim in point');
    const outHandle = screen.getByLabelText('Trim out point');

    expect(inHandle).toHaveAttribute('tabIndex', '0');
    expect(outHandle).toHaveAttribute('tabIndex', '0');
  });

  it('should render with custom width and height', () => {
    const customProps = {
      ...mockProps,
      width: 300,
      height: 60
    };

    render(<LineDuration {...customProps} />);

    const container = screen.getByText('6.00s').closest('.line-duration');
    expect(container).toHaveStyle({ width: '300px', height: '60px' });
  });
});