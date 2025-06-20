import React, { useState, useRef, useEffect } from "react";
import { useInterval } from "./useInterval";
import { useAuth } from "@/lib/auth";
import { useScores } from "@/lib/scores";
import { ArcadeButton } from "@/components/ui/arcade-button";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrientation } from "@/hooks/use-orientation";
import {
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Audio } from "../audio";
import GameOverGlitchText from "../tetris/GameOverGlitchText";
import SnakeMusic from "./SnakeMusic";

// Tamaño del canvas
const CANVAS_SIZE = [480, 320];
const SNAKE_START = [
  [12, 7],
  [12, 8],
];
const APPLE_START = [12, 3]; 
const SCALE = 20;
const SPEED = 100;
const DIRECTIONS = {
  38: [0, -1], // up
  40: [0, 1], // down
  37: [-1, 0], // left
  39: [1, 0], // right
};

const audio = new Audio();

export function SnakeGame() {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState(SNAKE_START);
  const [apple, setApple] = useState(APPLE_START);
  const [dir, setDir] = useState([0, -1]);
  const [speed, setSpeed] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);

  const { isAuthenticated } = useAuth();
  const { addScore } = useScores();
  const isMobile = useIsMobile();
  const orientation = useOrientation();

  useEffect(() => {
    const storedHighScore = localStorage.getItem("snakeHighScore") || 0;
    setHighScore(Number(storedHighScore));
  }, []);

  // Bucle del juego usando el hook personalizado useInterval
  useInterval(() => gameLoop(), speed);

  // Bucle principal del juego
  const gameLoop = () => {
    const snakeCopy = JSON.parse(JSON.stringify(snake));
    const newSnakeHead = [snakeCopy[0][0] + dir[0], snakeCopy[0][1] + dir[1]];
    snakeCopy.unshift(newSnakeHead);

    // Check si game over
    if (isCollision(newSnakeHead) || isSnakeCollapsed(newSnakeHead)) {
      handleGameOver();
      return;
    }

    // Verificar si se comió la manzana
    let newApple = apple;
    if (newSnakeHead[0] === apple[0] && newSnakeHead[1] === apple[1]) {
      // La serpiente crece (no se quita la cola)
      setScore((prevScore) => {
        const newScore = prevScore + 10;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("snakeHighScore", newScore);
        }
        return newScore;
      });
      newApple = createApple();
      setApple(newApple);
      audio.playLineClear(); // Reproduce sonido de comer
    } else {
      snakeCopy.pop();
    }

    setSnake(snakeCopy);
    // audio.playMove(); // Reproduce sonido de movimiento 
  };

  // Check si hay colisión con los bordes del canvas
  const isCollision = (snakeHead) => {
    return (
      snakeHead[0] * SCALE >= CANVAS_SIZE[0] ||
      snakeHead[0] < 0 ||
      snakeHead[1] * SCALE >= CANVAS_SIZE[1] ||
      snakeHead[1] < 0
    );
  };

  // Check si la serpiente choca consigo misma
  const isSnakeCollapsed = (snakeHead) => {
    // Check si la cabeza de la serpiente colisiona con cualquier segmento del cuerpo
    for (let i = 1; i < snake.length; i++) {
      if (snakeHead[0] === snake[i][0] && snakeHead[1] === snake[i][1]) {
        return true;
      }
    }
    return false;
  };

  // Crear una nueva manzana en una posición random
  const createApple = () => {
    const newApple = [
      Math.floor(Math.random() * (CANVAS_SIZE[0] / SCALE)),
      Math.floor(Math.random() * (CANVAS_SIZE[1] / SCALE)),
    ];
    // Verificar si la manzana no está en la serpiente
    for (const segment of snake) {
      if (segment[0] === newApple[0] && segment[1] === newApple[1]) {
        return createApple(); // Try again
      }
    }
    return newApple;
  };

  // Start game
  const startGame = () => {
    setSnake(SNAKE_START);
    setApple(APPLE_START);
    setDir([0, -1]); 
    setSpeed(SPEED);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    audio.playStart(); // Play start sound
  };

  // Handle game over
  const handleGameOver = async () => {
    setSpeed(null);
    setGameOver(true);
    setGameStarted(false);
    audio.playGameOver(); // Play game over sound

    if (isAuthenticated && score > 0) {
      try {
        await addScore({
          gameId: "snake",
          points: score,
        });
        toast.success(`Score saved! ${score} points`);
      } catch (error) {
        console.error("Error saving score:", error);
        toast.error("Error saving score");
      }
    }
  };

  // Handle key press for movement
  const moveSnake = ({ keyCode }) => handleDirectionChange(keyCode);

  // Handle touch controls (mobile)
  const handleMobileDirection = (keyCode) => {
    if (!gameStarted || gameOver) return;
    handleDirectionChange(keyCode);
  };

  // Shared direction change logic
  const handleDirectionChange = (keyCode) => {
    // Arriba: no puede ir abajo, Abajo: no puede ir arriba, Izquierda: no puede ir a la derecha, Derecha: no puede ir a la izquierda
    const opposites = {
      38: 40, // arriba no puede ir abajo
      40: 38, // abajo no puede ir arriba
      37: 39, // izquierda no puede ir a la derecha
      39: 37, // derecha no puede ir a la izquierda
    };

    if (keyCode in DIRECTIONS) {
      const currentDir = Object.keys(DIRECTIONS).find(
        (key) => DIRECTIONS[key][0] === dir[0] && DIRECTIONS[key][1] === dir[1]
      );

      if (Number(currentDir) !== opposites[keyCode]) {
        setDir(DIRECTIONS[keyCode]);
      }
    }
  };

  // Dibujar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Limpiar canvas
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar cuadricula
      ctx.strokeStyle = "#333";
      for (let i = 0; i <= CANVAS_SIZE[0]; i += SCALE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE[1]);
        ctx.stroke();
      }
      for (let i = 0; i <= CANVAS_SIZE[1]; i += SCALE) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE[0], i);
        ctx.stroke();
      }

      // Dibujar serpiente
      snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? "#39FF14" : "#00BB00";
        ctx.fillRect(segment[0] * SCALE, segment[1] * SCALE, SCALE, SCALE);
        ctx.strokeStyle = "#111";
        ctx.strokeRect(segment[0] * SCALE, segment[1] * SCALE, SCALE, SCALE);

        // Dibujar ojos en la cabeza de la serpiente
        if (index === 0) {
          ctx.fillStyle = "#111";
          const eyeSize = SCALE / 4;
          let eyeX1, eyeY1, eyeX2, eyeY2;

          if (dir[0] === 1 && dir[1] === 0) {
            // derecha
            eyeX1 = segment[0] * SCALE + SCALE - eyeSize - 2;
            eyeY1 = segment[1] * SCALE + 2;
            eyeX2 = segment[0] * SCALE + SCALE - eyeSize - 2;
            eyeY2 = segment[1] * SCALE + SCALE - eyeSize - 2;
          } else if (dir[0] === -1 && dir[1] === 0) {
            // izquierda
            eyeX1 = segment[0] * SCALE + 2;
            eyeY1 = segment[1] * SCALE + 2;
            eyeX2 = segment[0] * SCALE + 2;
            eyeY2 = segment[1] * SCALE + SCALE - eyeSize - 2;
          } else if (dir[0] === 0 && dir[1] === -1) {
            // Arriba
            eyeX1 = segment[0] * SCALE + 2;
            eyeY1 = segment[1] * SCALE + 2;
            eyeX2 = segment[0] * SCALE + SCALE - eyeSize - 2;
            eyeY2 = segment[1] * SCALE + 2;
          } else {
            // abajo
            eyeX1 = segment[0] * SCALE + 2;
            eyeY1 = segment[1] * SCALE + SCALE - eyeSize - 2;
            eyeX2 = segment[0] * SCALE + SCALE - eyeSize - 2;
            eyeY2 = segment[1] * SCALE + SCALE - eyeSize - 2;
          }

          ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize);
          ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize);
        }
      });

      // dibujar manzana
      ctx.fillStyle = "#FF5555";
      ctx.beginPath();
      ctx.arc(
        apple[0] * SCALE + SCALE / 2,
        apple[1] * SCALE + SCALE / 2,
        SCALE / 2 - 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.fillStyle = "#FF9999";
      ctx.beginPath();
      ctx.arc(
        apple[0] * SCALE + SCALE / 3,
        apple[1] * SCALE + SCALE / 3,
        SCALE / 6,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  }, [snake, apple, gameStarted]);

  // manejar eventos de teclado
  useEffect(() => {
    window.addEventListener("keydown", moveSnake);
    return () => {
      window.removeEventListener("keydown", moveSnake);
    };
  }, [snake, apple, dir]);

  // prevenir el scroll del body cuando el juego está iniciado
  useEffect(() => {
    if (gameStarted) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [gameStarted]);

  return (
    <div className="flex flex-col items-center">
      <SnakeMusic play={true} muted={musicMuted} />
      <div
        className={`flex ${
          isMobile && orientation === "landscape"
            ? "flex-row items-center justify-center gap-6"
            : isMobile
            ? "flex-col items-start justify-center gap-6"
            : "flex-row items-start justify-center gap-6"
        }`}
      >
        {/* Área de juego */}
        <div className="flex flex-col items-center">
          {/* Panel de puntuacion y puntuaciones altas */}
          <div className="flex justify-between w-full max-w-[480px] mb-3">
            <div className="text-center">
              <p className="text-sm font-pixel text-gray-300 mb-1">SCORE</p>
              <span className="text-xl">{score}</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-pixel text-gray-300 mb-1">HIGH</p>
              <span className="text-xl">{highScore}</span>
            </div>
          </div>

          {/* Game area */}
          <div className="relative bg-arcade-dark border-2 border-arcade-neon-green shadow-[0_0_8px_rgba(57,255,20,0.6)] rounded-md overflow-hidden w-full max-w-[480px] aspect-[3/2] mx-auto">
            <canvas
              ref={canvasRef}
              width={`${CANVAS_SIZE[0]}px`}
              height={`${CANVAS_SIZE[1]}px`}
              className="block w-full max-w-[480px] aspect-[3/2] h-auto"
            />

            {/* Game Over overlay */}
            {gameOver && (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
                <GameOverGlitchText text="GAME OVER" className="mb-6" />
                <p className="text-white font-pixel mb-6">Score: {score}</p>
                <ArcadeButton
                  onClick={startGame}
                  className="bg-arcade-neon-green hover:bg-arcade-neon-green/80 text-black font-bold pointer-events-auto"
                >
                  Play Again
                </ArcadeButton>
                {!isAuthenticated && (
                  <p className="text-gray-400 text-sm mt-4 text-center">
                    Log in to save your score
                  </p>
                )}
              </div>
            )}

            {/* Pantalla de inicio overlay */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col gap-3">
                  <ArcadeButton
                    onClick={startGame}
                    variant="green"
                    className="text-black font-bold mb-2"
                  >
                    START GAME
                  </ArcadeButton>
                </div>
              </div>
            )}
          </div>

          {/* Controles de teclado (escritorio) */}
          {!isMobile && gameStarted && !gameOver && (
            <div className="mt-4 flex gap-4 justify-center">
              <ArcadeButton
                onClick={startGame}
                variant="purple"
                className="text-white font-pixel flex gap-2 items-center"
              >
                <RefreshCw size={18} />
                Reset
              </ArcadeButton>
              <ArcadeButton
                onClick={() => setMusicMuted(m => !m)}
                variant="purple"
                className="font-pixel flex gap-2 items-center"
                size="sm"
                aria-label={musicMuted ? 'Unmute music' : 'Mute music'}
              >
                {musicMuted ? '🔇' : '🔊'}
              </ArcadeButton>
            </div>
          )}
        </div>

        {/* Controles móviles en landscape: a la derecha */}
        {isMobile && orientation === "landscape" && gameStarted && !gameOver && (
          <div className="flex flex-col items-center justify-center ml-4 min-w-[120px] relative z-50">
            <ArcadeButton
              onClick={startGame}
              variant="green"
              className="text-black font-pixel flex justify-center items-center gap-1 mb-4 w-20 z-50"
              size="sm"
            >
              <RefreshCw size={16} />
              Reset
            </ArcadeButton>
            {/* Botonera direccional tipo cruceta */}
            <div className="flex flex-col items-center gap-2 z-50">
              <ArcadeButton
                onClick={() => handleMobileDirection(38)} // arriba
                variant="green"
                className="w-20 h-20 text-black font-pixel flex items-center justify-center z-50"
                style={{ touchAction: 'none', position: 'relative' }}
              >
                <ArrowUp size={32} />
              </ArcadeButton>
              <div className="flex flex-row gap-2">
                <ArcadeButton
                  onClick={() => handleMobileDirection(37)} // izquierda
                  variant="green"
                  className="w-20 h-20 text-black font-pixel flex items-center justify-center z-50"
                  style={{ touchAction: 'none', position: 'relative' }}
                >
                  <ArrowLeft size={32} />
                </ArcadeButton>
                <ArcadeButton
                  onClick={() => handleMobileDirection(40)} // abajo
                  variant="green"
                  className="w-20 h-20 text-black font-pixel flex items-center justify-center z-50"
                  style={{ touchAction: 'none', position: 'relative' }}
                >
                  <ArrowDown size={32} />
                </ArcadeButton>
                <ArcadeButton
                  onClick={() => handleMobileDirection(39)} // derecha
                  variant="green"
                  className="w-20 h-20 text-black font-pixel flex items-center justify-center z-50"
                  style={{ touchAction: 'none', position: 'relative' }}
                >
                  <ArrowRight size={32} />
                </ArcadeButton>
              </div>
            </div>
          </div>
        )}

        {/* Controles móviles en portrait: debajo */}
        {isMobile && orientation !== "landscape" && gameStarted && !gameOver && (
          <div className="mt-4 w-full max-w-[400px]">
            <div className="flex justify-center mb-4">
              <ArcadeButton
                onClick={startGame}
                variant="green"
                className="text-black font-pixel flex justify-center items-center gap-1"
                size="sm"
              >
                <RefreshCw size={16} />
                Reset
              </ArcadeButton>
            </div>

            <div className="flex flex-col items-center gap-2">
              <ArcadeButton
                onClick={() => handleMobileDirection(38)} // arriba
                variant="green"
                className="w-16 h-16 text-black font-pixel flex items-center justify-center"
              >
                <ArrowUp size={24} />
              </ArcadeButton>

              <div className="flex gap-2 mt-1">
                <ArcadeButton
                  onClick={() => handleMobileDirection(37)} // izquierda
                  variant="green"
                  className="w-16 h-16 text-black font-pixel flex items-center justify-center"
                >
                  <ArrowLeft size={24} />
                </ArcadeButton>

                <ArcadeButton
                  onClick={() => handleMobileDirection(40)} // abajo
                  variant="green"
                  className="w-16 h-16 text-black font-pixel flex items-center justify-center"
                >
                  <ArrowDown size={24} />
                </ArcadeButton>

                <ArcadeButton
                  onClick={() => handleMobileDirection(39)} // derecha
                  variant="green"
                  className="w-16 h-16 text-black font-pixel flex items-center justify-center"
                >
                  <ArrowRight size={24} />
                </ArcadeButton>
              </div>
            </div>
          </div>
        )}

        {/* Panel lateral con instrucciones */}
        <div
          className={`flex flex-col gap-4 ${
            isMobile ? "w-full mt-4" : "w-[220px] mt-48"
          }`}
        >
          <div className="bg-arcade-dark border border-arcade-neon-green/30 rounded-md p-3">
            <h3 className="text-arcade-neon-green font-pixel mb-2">
              Controls:
            </h3>
            <ul className="text-sm text-gray-300 font-pixel space-y-1">
              <li>⬅️ ➡️ : Move left/right</li>
              <li>⬆️ ⬇️ : Move up/down</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
