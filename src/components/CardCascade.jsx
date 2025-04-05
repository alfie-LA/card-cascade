import React, { useState, useEffect, useRef } from 'react';
import { initializeGrid, addRandomCard, moveGrid, hasAvailableMoves } from '../utils/gameLogic';

const GRID_SIZE = 4;

const classStyles = {
  Mammals: 'bg-red-100/70 border-red-300',
  Birds: 'bg-green-100/70 border-green-300',
  Reptiles: 'bg-orange-100/70 border-orange-300',
  Amphibians: 'bg-yellow-100/70 border-yellow-300',
  Fish: 'bg-blue-100/70 border-blue-300'
};

const sparkleColors = {
  Mammals: 'bg-red-300',
  Birds: 'bg-green-300',
  Reptiles: 'bg-orange-300',
  Amphibians: 'bg-yellow-300',
  Fish: 'bg-blue-300'
};

const jokerGlowClass = "ring-4 ring-yellow-400 ring-offset-2 animate-pulse";

const CardCascade = () => {
  const [jokerCards, setJokerCards] = useState([]);
  const [grid, setGrid] = useState(initializeGrid(GRID_SIZE));
  const [score, setScore] = useState(0);
  const [bonusCards, setBonusCards] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const mergeSound = useRef(new Audio('/assets/sounds/merge.mp3'));
  const [showInstructions, setShowInstructions] = useState(false);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('highScore') || '0', 10));

  useEffect(() => {
    if (hasMoved && !gameOver) {
      setGrid(prev => addRandomCard(prev));
      setHasMoved(false);
    }
  }, [hasMoved, gameOver]);

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    };

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 30) return;

      let simulatedKey = null;
      if (absDx > absDy) {
        simulatedKey = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      } else {
        simulatedKey = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      }

      const keyboardEvent = new KeyboardEvent('keydown', { key: simulatedKey });
      window.dispatchEvent(keyboardEvent);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!keys.includes(e.key) || gameOver) return;

      setBonusCards([]);

      const { newGrid, moved, scoreGained, bonusCards, jokerCards } = moveGrid(grid, e.key);
      const updatedScore = score + scoreGained;
      const noMovesLeft = !hasAvailableMoves(newGrid);

      if (updatedScore > highScore) {
        localStorage.setItem('highScore', updatedScore.toString());
        setHighScore(updatedScore);
      }

      if (noMovesLeft) {
        setGameOver(true);
      }

      if (moved) {
        setGrid(newGrid);
        setScore(updatedScore);
        setBonusCards(bonusCards || []);
        setJokerCards(jokerCards || []);
        setHasMoved(!noMovesLeft);

        if ((bonusCards.length || jokerCards.length) && mergeSound.current) {
          try {
            mergeSound.current.currentTime = 0;
            mergeSound.current.play();
          } catch (e) {
            console.warn("Sound playback error:", e);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grid, score, highScore, gameOver]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-2 py-6 sm:py-10 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/images/eco-bg.png')" }}
    >
      <div className="absolute top-4 left-0 w-full flex justify-between items-start px-4 z-50">
        <div className="text-center">
          <div className="text-5xl sm:text-6xl font-extrabold text-white bg-black/50 px-4 py-2 rounded-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
            Score: {score}
          </div>
          <div className="text-xl sm:text-2xl text-white font-semibold bg-black/50 mt-2 px-3 py-1 rounded-md drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
            Best: {highScore}
          </div>
        </div>
        <button
          onClick={() => setShowInstructions(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1 rounded"
        >
          ❓ How to Play
        </button>
      </div>

      <div className="grid grid-cols-4 w-full max-w-[95vw] gap-1">
        {grid.flat().map((card, index) => (
          <div key={index} className="flex items-center justify-center w-full aspect-square p-1">
            {card ? (
              <div
                className={`relative w-full h-full rounded-xl flex flex-col items-center justify-center text-center shadow-sm backdrop-blur-md transition-all duration-300 ${classStyles[card.className]} border-2 ${bonusCards.some(b => b.id === card.id) && card.className === 'Mammals' ? jokerGlowClass : ''}`}
              >
                <img
                  src={`/assets/icons/${card.className.toLowerCase()}.png`}
                  alt={card.className}
                  className="w-[65%] h-[65%] max-w-[65%] max-h-[65%] object-contain mb-1"
                />
                <div className="text-5xl sm:text-4xl font-bold leading-none">{card.rank}</div>
                {(bonusCards.some(b => b.id === card.id) || jokerCards.some(j => j.id === card.id)) && (
                  <>
                    <div className={`absolute w-16 h-16 animate-ping rounded-full opacity-70 z-10 ${sparkleColors[card.className]}`}></div>
                    <div className="absolute top-0 w-full text-center text-sm sm:text-base text-white font-bold bg-black/70 px-1 py-0.5 rounded-t z-20 animate-fadeIn">
                      {bonusCards.some(b => b.id === card.id)
                        ? '💥 Double Points!'
                        : '🃏 Mammal Merge!'}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-full rounded-xl border border-gray-300 bg-white/10" />
            )}
          </div>
        ))}
      </div>

      {gameOver && (
        <button
          onClick={() => {
            setGrid(initializeGrid(GRID_SIZE));
            setScore(0);
            setBonusCards([]);
            setGameOver(false);
          }}
          className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          🔄 Restart
        </button>
      )}

      {showInstructions && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-md text-sm shadow-lg relative">
            <h2 className="text-lg font-bold mb-2">How to Play</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-800 text-sm sm:text-base">
              <li>Use arrow keys or swipe to slide cards in any direction.</li>
              <li>Merge cards of the <strong>same class and rank</strong> to level up and earn <strong>Double Points!</strong></li>
              <li><strong>Mammals are jokers</strong> — they can merge with <em>any class or rank</em>.</li>
              <li>When a Mammal merges with another card, it displays <strong>“Mammal Merge”</strong>.</li>
              <li>Each merge adds to your score — try to keep the board from filling up!</li>
              <li>The game ends when no more moves are possible.</li>
             </ul>

            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <audio ref={mergeSound} src="/assets/sounds/merge.mp3" preload="auto" />
    </div>
  );
};

export default CardCascade;







