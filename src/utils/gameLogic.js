const classes = ['Mammals', 'Birds', 'Reptiles', 'Amphibians', 'Fish'];

export const initializeGrid = (size) => {
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  return addRandomCard(addRandomCard(grid));
};

export const addRandomCard = (grid) => {
  const emptyCells = [];
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) emptyCells.push([x, y]);
    });
  });
  if (emptyCells.length === 0) return grid;
  const [x, y] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  const rank = Math.floor(Math.random() * 3) + 1;
  const newGrid = grid.map(row => [...row]);
  newGrid[y][x] = { id: Date.now() + Math.random(), className: randomClass, rank };
  return newGrid;
};

const rotateClockwise = (matrix) => matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
const rotateCounterClockwise = (matrix) => rotateClockwise(rotateClockwise(rotateClockwise(matrix)));
const rotate180 = (matrix) => rotateClockwise(rotateClockwise(matrix));

const mergeRow = (row, mergedCardIds, bonusCardCards, jokerCardCards) => {
  const compacted = row.filter(Boolean);
  let merged = false;
  let scoreGained = 0;

  for (let i = 0; i < compacted.length - 1; i++) {
    const a = compacted[i];
    const b = compacted[i + 1];

    if (!a || !b) continue;

    const isJokerMerge = a.className === 'Mammals' || b.className === 'Mammals';
    const sameClass = a.className === b.className;
    const sameRank = a.rank === b.rank;

    if (sameClass || isJokerMerge) {
      const newRank = Math.min(a.rank + b.rank, 10);
      const mergedCard = {
        ...a,
        id: Date.now() + Math.random(),
        className: a.className === 'Mammals' ? b.className : a.className,
        rank: newRank,
      };

      compacted[i] = mergedCard;
      compacted[i + 1] = null;

      mergedCardIds.push(mergedCard.id);
      scoreGained += newRank * 10;
      merged = true;

      if (!isJokerMerge && sameClass && sameRank) {
        bonusCardCards.push(mergedCard); // Same class & rank = bonus
      } else if (isJokerMerge) {
        jokerCardCards.push(mergedCard); // Joker merge but not bonus
      }
    }
  }

  const newRow = compacted.filter(Boolean);
  while (newRow.length < row.length) newRow.push(null);
  return [newRow, merged, scoreGained];
};



export const moveGrid = (grid, direction) => {
  let workingGrid;
  if (direction === 'ArrowUp') workingGrid = rotateCounterClockwise(grid);
  else if (direction === 'ArrowDown') workingGrid = rotateClockwise(grid);
  else if (direction === 'ArrowRight') workingGrid = rotate180(grid);
  else workingGrid = grid.map(row => [...row]);

  let moved = false;
  let totalScore = 0;
  const mergedCardIds = [];
  const bonusCardCards = [];
  const jokerCardCards = [];

  const newGrid = workingGrid.map(row => {
    const [mergedRow, didMerge, rowScore] = mergeRow(row, mergedCardIds, bonusCardCards, jokerCardCards);
    if (didMerge || JSON.stringify(row) !== JSON.stringify(mergedRow)) moved = true;
    totalScore += rowScore;
    return mergedRow;
  });

  let finalGrid;
  if (direction === 'ArrowUp') finalGrid = rotateClockwise(newGrid);
  else if (direction === 'ArrowDown') finalGrid = rotateCounterClockwise(newGrid);
  else if (direction === 'ArrowRight') finalGrid = rotate180(newGrid);
  else finalGrid = newGrid;

  return {
    newGrid: finalGrid,
    moved,
    scoreGained: totalScore,
    mergedIds: mergedCardIds,
    bonusCards: bonusCardCards,
    jokerCards: jokerCardCards
  };
};


export const hasAvailableMoves = (grid) => {
  const size = grid.length;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = grid[y][x];
      if (!cell) return true; // Empty cell = valid move

      const directions = [
        [0, 1], [1, 0], [-1, 0], [0, -1]
      ];

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const neighbor = grid[ny][nx];
          if (!neighbor) continue;

          const bothSameClassAndRank =
            cell.className === neighbor.className &&
            cell.rank === neighbor.rank;

          const jokerInvolved =
            cell.className === 'Mammals' || neighbor.className === 'Mammals';

          if (bothSameClassAndRank || jokerInvolved) {
            return true; // valid merge
          }
        }
      }
    }
  }

  return false; // no moves possible
};

