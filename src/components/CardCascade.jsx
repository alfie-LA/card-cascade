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
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold">🧬 Card Cascade</h1>
        <div className="text-3xl sm:text-4xl font-semibold">Score: {score}</div>
        <div className="text-2xl sm:text-3xl text-yellow-600 font-semibold">🏆 High Score: {highScore}</div>
        {gameOver && (
          <div className="text-red-600 font-bold animate-bounce text-lg sm:text-xl">💀 Game Over – No Moves Left!</div>
        )}
        <button
          onClick={() => setShowInstructions(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ❓ How to Play
        </button>
      </div>

      <div className="grid grid-cols-4 w-full max-w-[95vw] sm:max-w-[80vw] md:max-w-[500px] lg:max-w-[450px] xl:max-w-[400px] gap-1">
        {grid.flat().map((card, index) => (
          <div key={index} className="flex items-center justify-center w-full aspect-square p-1">
            {card ? (
              <div
                className={`relative w-full h-full rounded-xl flex flex-col items-center justify-center text-center shadow-sm backdrop-blur-md transition-all duration-300 ${classStyles[card.className]} border-2 ${bonusCards.includes(card.id) && card.className === 'Mammals' ? jokerGlowClass : ''}`}
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
                    <div className="absolute top-0 text-xs text-white font-bold bg-black/70 px-1 rounded z-20 animate-fadeIn">
                      {bonusCards.includes(card.id)
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
            <ul className="list-disc list-inside space-y-2 text-gray-800">
              <li>Use arrow keys or swipe to move cards in any direction.</li>
              <li>Cards of the same class and rank merge into higher ranks.</li>
              <li><strong>Mammals are jokers</strong> — they can merge with any class and rank!</li>
              <li>Merging same-class cards of the same rank earns <strong>Double Points</strong>.</li>
              <li>Try to keep the board from filling up — the game ends when no moves are left!</li>
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



