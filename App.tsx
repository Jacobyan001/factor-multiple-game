
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Player, GameMode, CellState } from './types';
import { getValidMoves, getAIMove } from './services/gameLogic';

const initialBoard = (): CellState[] =>
  Array.from({ length: 100 }, (_, i) => ({
    number: i + 1,
    owner: null,
  }));

interface GameMenuProps {
  onStart: (mode: GameMode) => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ onStart }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-800">
    <h1 className="text-5xl font-bold mb-4 text-cyan-400">Factor Multiple Game</h1>
    <p className="text-slate-300 mb-8 max-w-lg text-center">Select a number. The next player must select a factor or multiple of that number. A number can only be chosen once. The player with no valid moves left loses.</p>
    <div className="space-y-4">
      <button
        onClick={() => onStart('vsAI')}
        className="w-64 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
      >
        1 Player vs. AI
      </button>
      <button
        onClick={() => onStart('vsPlayer')}
        className="w-64 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
      >
        2 Players
      </button>
    </div>
  </div>
);

interface GameInfoProps {
  currentPlayer: Player;
  lastMove: number | null;
  winner: Player | null;
  message: string;
  onRestart: () => void;
  onMenu: () => void;
  gameMode: GameMode;
}

const GameInfo: React.FC<GameInfoProps> = ({ currentPlayer, lastMove, winner, message, onRestart, onMenu, gameMode }) => (
  <div className="p-4 bg-slate-800 rounded-lg shadow-lg mb-4 text-center">
    <h2 className="text-2xl font-bold mb-2">Game Status</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="p-3 bg-slate-700 rounded-lg">
            <p className="text-sm text-slate-400">Current Turn</p>
            <p className={`text-2xl font-bold ${currentPlayer === 1 ? 'text-blue-400' : 'text-green-400'}`}>
                {winner ? '-' : (gameMode === 'vsAI' && currentPlayer === 2 ? 'AI' : `Player ${currentPlayer}`)}
            </p>
        </div>
        <div className="p-3 bg-slate-700 rounded-lg">
            <p className="text-sm text-slate-400">Last Number</p>
            <p className="text-2xl font-bold text-yellow-400">{lastMove || '-'}</p>
        </div>
        <div className="p-3 bg-slate-700 rounded-lg h-full flex flex-col justify-center">
             <p className={`text-lg font-semibold ${winner ? 'text-yellow-300' : 'text-slate-300'} transition-colors duration-300`}>{message}</p>
        </div>
    </div>
    <div className="mt-4 flex justify-center space-x-4">
        <button onClick={onRestart} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition">Restart Game</button>
        <button onClick={onMenu} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition">Back to Menu</button>
    </div>
  </div>
);

interface GameBoardProps {
  board: CellState[];
  onCellClick: (num: number) => void;
  lastMove: number | null;
  validMoves: Set<number>;
  isAITurn: boolean;
  winner: Player | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, onCellClick, lastMove, validMoves, isAITurn, winner }) => {
  const getCellClasses = (cell: CellState): string => {
    const baseClasses = "w-full h-full flex items-center justify-center rounded-md text-sm md:text-base font-bold transition-all duration-200";

    // Cell is already taken
    if (cell.owner !== null) {
      // Is it the most recent move? Highlight it strongly.
      if (cell.number === lastMove) {
        return cell.owner === 1
          ? `${baseClasses} bg-blue-500 shadow-lg scale-105`
          : `${baseClasses} bg-green-500 shadow-lg scale-105`;
      }
      // It's a previously taken number. Style it with a muted version of the player's color.
      return cell.owner === 1
        ? `${baseClasses} bg-blue-900 text-blue-200 cursor-not-allowed`
        : `${baseClasses} bg-green-900 text-green-200 cursor-not-allowed`;
    }
    
    // Cell is not taken yet
    const isClickable = !winner && !isAITurn && (!lastMove ? cell.number < 50 : validMoves.has(cell.number));

    if (isClickable) {
        if (validMoves.has(cell.number)) {
            // Highlight valid moves
            return `${baseClasses} bg-slate-700 hover:bg-cyan-500 hover:ring-2 hover:ring-cyan-300 cursor-pointer ring-2 ring-cyan-600`;
        }
        // First move is clickable
        return `${baseClasses} bg-slate-700 hover:bg-slate-600 cursor-pointer`;
    }
    
    // Any other case, it's an unavailable number
    return `${baseClasses} bg-slate-800 text-slate-500 cursor-not-allowed`;
  };

  return (
    <div className="grid grid-cols-10 gap-1.5 p-4 bg-slate-900/50 rounded-lg">
      {board.map(cell => (
        <div key={cell.number} className="aspect-square">
          <button
            onClick={() => onCellClick(cell.number)}
            disabled={cell.owner !== null || isAITurn || winner !== null}
            className={getCellClasses(cell)}
          >
            <span className={cell.number === lastMove ? "relative flex items-center justify-center ring-4 ring-yellow-400 rounded-full w-10 h-10 md:w-12 md:h-12" : ""}>
                {cell.number}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [board, setBoard] = useState<CellState[]>(initialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState('');
  const [isAITurn, setIsAITurn] = useState(false);

  const validMoves = useMemo(() => {
    if (!lastMove) return new Set();
    return new Set(getValidMoves(lastMove, selectedNumbers));
  }, [lastMove, selectedNumbers]);

  const checkGameOver = useCallback((currentLastMove: number, nextPlayer: Player) => {
    const nextValidMoves = getValidMoves(currentLastMove, selectedNumbers);
    if (nextValidMoves.length === 0) {
      const winnerPlayer = nextPlayer === 1 ? 2 : 1;
      setWinner(winnerPlayer);
      const winnerName = (gameMode === 'vsAI' && winnerPlayer === 2) ? "AI" : `Player ${winnerPlayer}`;
      setMessage(`${winnerName} wins! No more moves for ${nextPlayer === 1 ? 'Player 1' : (gameMode === 'vsAI' ? 'AI' : 'Player 2')}.`);
      return true;
    }
    return false;
  }, [selectedNumbers, gameMode]);

  const handleMove = useCallback((num: number) => {
    const newBoard = board.map(cell =>
      cell.number === num ? { ...cell, owner: currentPlayer } : cell
    );
    const newSelectedNumbers = new Set(selectedNumbers).add(num);

    setBoard(newBoard);
    setSelectedNumbers(newSelectedNumbers);
    setLastMove(num);

    const nextPlayer = currentPlayer === 1 ? 2 : 1;

    if (!checkGameOver(num, nextPlayer)) {
      setCurrentPlayer(nextPlayer);
      const nextPlayerName = (gameMode === 'vsAI' && nextPlayer === 2) ? "AI's" : `Player ${nextPlayer}'s`;
      setMessage(`${nextPlayerName} turn. Pick a factor or multiple of ${num}.`);
    }
  }, [board, currentPlayer, selectedNumbers, checkGameOver, gameMode]);

  const handleCellClick = (num: number) => {
    if (winner || isAITurn || selectedNumbers.has(num)) return;

    if (!lastMove) {
      if (num >= 50) {
        setMessage('First move must be less than 50.');
        return;
      }
      handleMove(num);
    } else {
      if (validMoves.has(num)) {
        handleMove(num);
      } else {
        setMessage('Invalid move. Please select a factor or multiple.');
      }
    }
  };

  const resetGame = useCallback(() => {
    setBoard(initialBoard());
    setCurrentPlayer(1);
    setLastMove(null);
    setSelectedNumbers(new Set());
    setWinner(null);
    setMessage('Player 1, select a number less than 50 to start.');
    setIsAITurn(false);
  }, []);

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    resetGame();
  };
    
  const backToMenu = () => {
    setGameMode('menu');
  }

  useEffect(() => {
    if (gameMode === 'vsAI' && currentPlayer === 2 && !winner && lastMove) {
      setIsAITurn(true);
      setMessage('AI is thinking...');
      
      const timer = setTimeout(() => {
        const aiMove = getAIMove(lastMove, selectedNumbers);
        if (aiMove !== null) {
          handleMove(aiMove);
        }
        setIsAITurn(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, winner, gameMode, lastMove]);
  
  useEffect(() => {
      if(gameMode !== 'menu') {
          resetGame();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode]);

  if (gameMode === 'menu') {
    return <GameMenu onStart={startGame} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">Factor Multiple Game</h1>
        <GameInfo 
            currentPlayer={currentPlayer}
            lastMove={lastMove}
            winner={winner}
            message={message}
            onRestart={resetGame}
            onMenu={backToMenu}
            gameMode={gameMode}
        />
        <GameBoard 
            board={board}
            onCellClick={handleCellClick}
            lastMove={lastMove}
            validMoves={validMoves}
            isAITurn={isAITurn}
            winner={winner}
        />
      </div>
    </div>
  );
}
