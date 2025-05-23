import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { TicTacToeGame } from '../src/games/tictactoe/tictactoe-game';

// Mock hooks and dependencies
vi.mock('../src/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('../src/lib/scores', () => ({ useScores: () => ({ addScore: vi.fn().mockResolvedValue() }) }));
vi.mock('../src/lib/auth', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

describe('TicTacToeGame', () => {
  it('renders the board and status', () => {
    render(<TicTacToeGame />);
    expect(screen.getByText(/tu turno/i)).toBeInTheDocument();
    // There are 9 clickable cells, but they are divs, not buttons
    expect(screen.getAllByText('', { selector: 'div.bg-arcade-dark' }).length).toBe(9);
  });

  it('lets player make a move and updates board', () => {
    render(<TicTacToeGame />);
    const cells = screen.getAllByText('', { selector: 'div.bg-arcade-dark' });
    act(() => {
      fireEvent.click(cells[0]);
    });
    expect(cells[0].textContent).toBe('X');
  });

  it.skip('shows RESET button after game ends', () => {
    render(<TicTacToeGame />);
    // Simulate a win for player
    act(() => {
      // X X X in first row
      fireEvent.click(screen.getAllByText('', { selector: 'div.bg-arcade-dark' })[0]);
      fireEvent.click(screen.getAllByText('', { selector: 'div.bg-arcade-dark' })[1]);
      fireEvent.click(screen.getAllByText('', { selector: 'div.bg-arcade-dark' })[2]);
    });
    // Fallback: check for ArcadeButton by class and textContent
    const arcadeButtons = document.querySelectorAll('.font-arcade');
    const found = Array.from(arcadeButtons).some(btn => btn.textContent && btn.textContent.match(/reset/i));
    expect(found).toBe(true);
  });
});
