import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ColorMemoryGame } from '../../components/color-memory-game';
import * as api from '../../lib/api';

// Mock for next/dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const MockedComponent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
    MockedComponent.displayName = 'MockedComponent';
    return MockedComponent;
  },
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
});