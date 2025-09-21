
// Helper to get all factors of a number
export const getFactors = (num: number): number[] => {
  if (num === 0) return [];
  const factors = new Set<number>();
  for (let i = 1; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      factors.add(i);
      factors.add(num / i);
    }
  }
  return Array.from(factors);
};

// Helper to get all multiples of a number up to 100
export const getMultiples = (num: number): number[] => {
  if (num === 0) return [];
  const multiples: number[] = [];
  for (let i = num * 2; i <= 100; i += num) {
    multiples.push(i);
  }
  return multiples;
};

// Get all valid moves based on the last number and selected numbers
export const getValidMoves = (lastMove: number, selectedNumbers: Set<number>): number[] => {
  const factors = getFactors(lastMove);
  const multiples = getMultiples(lastMove);
  const potentialMoves = new Set([...factors, ...multiples]);

  potentialMoves.delete(lastMove);

  return Array.from(potentialMoves).filter(move => !selectedNumbers.has(move));
};

// AI move selection strategy
export const getAIMove = (lastMove: number, selectedNumbers: Set<number>): number | null => {
  const validMoves = getValidMoves(lastMove, selectedNumbers);
  if (validMoves.length === 0) {
    return null;
  }

  let bestMove: number | null = null;
  let minOpponentMoves = Infinity;

  // Strategy: find the move that leaves the opponent with the fewest options
  for (const move of validMoves) {
    const nextSelectedNumbers = new Set(selectedNumbers);
    nextSelectedNumbers.add(move);
    const opponentMoves = getValidMoves(move, nextSelectedNumbers);

    if (opponentMoves.length < minOpponentMoves) {
      minOpponentMoves = opponentMoves.length;
      bestMove = move;
    }
  }

  // If all available moves lead to an immediate win for the AI (opponent has 0 moves), pick any of them.
  if (minOpponentMoves === 0 && bestMove) {
    return bestMove;
  }

  // Fallback to the found best move or a random one if something went wrong
  return bestMove !== null ? bestMove : validMoves[Math.floor(Math.random() * validMoves.length)];
};
