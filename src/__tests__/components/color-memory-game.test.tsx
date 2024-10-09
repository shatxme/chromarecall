import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ColorMemoryGame } from '../../components/color-memory-game';
import * as colorUtils from '../../lib/color-utils';
import * as api from '../../lib/api'; // This import is causing the warning

// Mock for next/dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const MockedComponent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
    MockedComponent.displayName = 'MockedComponent';
    return MockedComponent;
  },
}));

// Mock the color-utils functions
jest.mock('../../lib/color-utils', () => ({
  generateGameColors: jest.fn(),
  calculateColorDifference: jest.fn(),
  calculateDifficulty: jest.fn(),
}));

// Mock the api functions
jest.mock('../../lib/api', () => ({
  saveScore: jest.fn(),
}));

// Mock the toast function
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

describe('ColorMemoryGame', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders game intro when not playing', () => {
    render(<ColorMemoryGame />);
    expect(screen.getByText(/Start Game/i)).toBeInTheDocument();
  });

  it('starts game when start button is clicked', () => {
    render(<ColorMemoryGame />);
    const startButton = screen.getByText(/Start Game/i);
    fireEvent.click(startButton);
    act(() => {
      jest.advanceTimersByTime(100); // Advance timer a bit to allow state updates
    });
    expect(screen.getByLabelText('Time remaining')).toBeInTheDocument();
  });

  it('displays target color when game starts', async () => {
    render(<ColorMemoryGame />);
    const startButton = screen.getByText(/Start Game/i);
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(screen.getByLabelText('Target color')).toBeInTheDocument();
    }, { timeout: 4000 }); // Increase timeout to allow for the target color to appear
  });

  // Add more passing tests here if needed

  test('saves score when game ends with new high score', async () => {
    // Setup
    (colorUtils.generateGameColors as jest.Mock).mockReturnValue({
      target: '#FF0000',
      options: ['#FF0000', '#00FF00', '#0000FF'],
    });
    
    render(<ColorMemoryGame />);
    
    // Start game
    fireEvent.click(screen.getByText('Start Game'));
    
    // Play game and end it
    // ... (simulate gameplay)

    // Check if saveScore was called
    expect(api.saveScore).toHaveBeenCalledWith(expect.any(String), expect.any(Number), expect.any(Number));
  });
});