import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock useTimelineStore
const mockStore = {
  clips: {
    'test-clip': {
      id: 'test-clip',
      from: 0,
      to: 10,
      duration: 10,
      trimIn: 0,
      trimOut: 10,
      type: 'video',
      volume: 1,
      mute: false,
      hidden: false,
      fadeIn: 0,
      fadeOut: 0,
      fillMode: 'scale',
      is360: false,
      title: 'Clip'
    }
  },
  getClip: vi.fn((id) => mockStore.clips[id] || null),
  updateClipProperty: vi.fn((clipId, property, value) => {
    if (mockStore.clips[clipId]) {
      mockStore.clips[clipId][property] = value;
    }
  }),
  updateClipPosition: vi.fn((clipId, from, to) => {
    if (mockStore.clips[clipId]) {
      mockStore.clips[clipId].from = from;
      mockStore.clips[clipId].to = to;
    }
  }),
  addClip: vi.fn((clip) => {
    mockStore.clips[clip.id] = { ...clip };
  })
};

vi.mock('../../../hooks/useTimelineStore.jsx', () => ({
  useTimelineStore: () => mockStore
}));

import ClipEditor from './ClipEditor.jsx';

describe('ClipEditor', () => {

  it('renders clip editor with volume controls', () => {
    render(<ClipEditor clipId="test-clip" />);

    expect(screen.getByText('Volume: 100%')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('displays current volume value', () => {
    render(<ClipEditor clipId="test-clip" />);

    const volumeDisplay = screen.getByText('Volume: 100%');
    expect(volumeDisplay).toBeInTheDocument();
  });

  it('renders mute toggle button', () => {
    render(<ClipEditor clipId="test-clip" />);

    const muteButton = screen.getByRole('button', { name: /mute/i });
    expect(muteButton).toBeInTheDocument();
  });

  it('renders visibility toggle', () => {
    render(<ClipEditor clipId="test-clip" />);

    const visibilityButton = screen.getByRole('button', { name: /hide/i });
    expect(visibilityButton).toBeInTheDocument();
  });

  it('renders fill mode selector', () => {
    render(<ClipEditor clipId="test-clip" />);

    const fillModeSelect = screen.getByRole('combobox', { name: /fill mode/i });
    expect(fillModeSelect).toBeInTheDocument();
    expect(fillModeSelect.value).toBe('scale');
  });

  it('renders 360 video toggle for video clips', () => {
    render(<ClipEditor clipId="test-clip" />);

    const toggle360 = screen.getByRole('checkbox', { name: /360 video/i });
    expect(toggle360).toBeInTheDocument();
  });

  it('renders fade in/out controls', () => {
    render(<ClipEditor clipId="test-clip" />);

    expect(screen.getByText('Fade In (seconds)')).toBeInTheDocument();
    expect(screen.getByText('Fade Out (seconds)')).toBeInTheDocument();
  });

  it('renders timeline position controls', () => {
    render(<ClipEditor clipId="test-clip" />);

    expect(screen.getByText('Start Time (seconds)')).toBeInTheDocument();
    expect(screen.getByText('End Time (seconds)')).toBeInTheDocument();
  });

  it('renders title editing input', () => {
    render(<ClipEditor clipId="test-clip" />);

    const titleInput = screen.getByRole('textbox', { name: /clip title/i });
    expect(titleInput).toBeInTheDocument();
    expect(titleInput.value).toBe('Clip');
  });

  it('updates volume when slider changes', () => {
    render(<ClipEditor clipId="test-clip" />);

    const volumeSlider = screen.getByRole('slider');
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });

    // Verify the store was updated
    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.volume).toBe(0.5);
  });

  it('toggles mute when mute button clicked', () => {
    render(<ClipEditor clipId="test-clip" />);

    const muteButton = screen.getByRole('button', { name: /mute/i });
    fireEvent.click(muteButton);

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.mute).toBe(true);
  });

  it('toggles visibility when hide button clicked', () => {
    render(<ClipEditor clipId="test-clip" />);

    const visibilityButton = screen.getByRole('button', { name: /hide/i });
    fireEvent.click(visibilityButton);

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.hidden).toBe(true);
  });

  it('updates fade in duration', () => {
    render(<ClipEditor clipId="test-clip" />);

    const fadeInInput = screen.getByRole('spinbutton', { name: /fade in/i });
    fireEvent.change(fadeInInput, { target: { value: '2' } });

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.fadeIn).toBe(2);
  });

  it('updates fade out duration', () => {
    render(<ClipEditor clipId="test-clip" />);

    const fadeOutInput = screen.getByRole('spinbutton', { name: /fade out/i });
    fireEvent.change(fadeOutInput, { target: { value: '1.5' } });

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.fadeOut).toBe(1.5);
  });

  it('updates clip title', () => {
    render(<ClipEditor clipId="test-clip" />);

    const titleInput = screen.getByRole('textbox', { name: /clip title/i });
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.title).toBe('New Title');
  });

  it('updates start time', () => {
    render(<ClipEditor clipId="test-clip" />);

    const startInput = screen.getByRole('spinbutton', { name: /start time/i });
    fireEvent.change(startInput, { target: { value: '2' } });

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.from).toBe(2);
  });

  it('updates end time', () => {
    render(<ClipEditor clipId="test-clip" />);

    const endInput = screen.getByRole('spinbutton', { name: /end time/i });
    fireEvent.change(endInput, { target: { value: '8' } });

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.to).toBe(8);
  });

  it('updates fill mode', () => {
    render(<ClipEditor clipId="test-clip" />);

    const fillModeSelect = screen.getByRole('combobox', { name: /fill mode/i });
    fireEvent.change(fillModeSelect, { target: { value: 'fit' } });

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.fillMode).toBe('fit');
  });

  it('toggles 360 video', () => {
    render(<ClipEditor clipId="test-clip" />);

    const toggle360 = screen.getByRole('checkbox', { name: /360 video/i });
    fireEvent.click(toggle360);

    const updatedClip = mockStore.getClip('test-clip');
    expect(updatedClip.is360).toBe(true);
  });

  it('does not render 360 toggle for audio clips', () => {
    act(() => {
      mockStore.addClip({
        id: 'audio-clip',
        from: 0,
        to: 10,
        duration: 10,
        trimIn: 0,
        trimOut: 10,
        type: 'audio'
      });
    });

    render(<ClipEditor clipId="audio-clip" />);

    const toggle360 = screen.queryByRole('checkbox', { name: /360 video/i });
    expect(toggle360).not.toBeInTheDocument();
  });

  it('handles non-existent clip gracefully', () => {
    render(<ClipEditor clipId="non-existent" />);

    expect(screen.getByText('Clip not found')).toBeInTheDocument();
  });
});