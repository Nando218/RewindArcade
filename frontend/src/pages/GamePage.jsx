import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { NeonText } from '@/components/ui/neon-text';
import { getGameById } from '@/lib/games';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TetrisGame } from '@/games/tetris/tetris-game';
import { TicTacToeGame } from '@/games/tictactoe/tictactoe-game';
import { SnakeGame } from '@/games/snake/snake-game';
import { ArcadeButton } from '@/components/ui/arcade-button';
import { ArrowLeft } from 'lucide-react';
import { useScores } from '@/lib/scores';
import { useIsMobile } from '@/hooks/use-mobile';

export default function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = gameId ? getGameById(gameId) : undefined;
  const { fetchScoresByGame, getTopScoresByGame } = useScores();
  const [topScores, setTopScores] = useState([]);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!game) {
      navigate('/');
    }
  }, [game, navigate]);
  
  // Load top scores
  useEffect(() => {
    if (game) {
      fetchScoresByGame(game.id, 5).then(() => {
        setTopScores(getTopScoresByGame(game.id, 5));
      });
    }
  }, [game, fetchScoresByGame, getTopScoresByGame]);
  
  if (!game) return null;
  
  const renderGame = () => {
    switch (game.id) {
      case 'tetris':
        return <TetrisGame />;
      case 'tictactoe':
        return <TicTacToeGame />;
      case 'snake':
        return <SnakeGame />;
      default:
        return (
          <div className="text-center py-12">
            <span className="text-2xl mb-4 text-yellow-400">
              EN DESARROLLO
            </span>
           
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-2 flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-5xl">
            <Link to="/home" className="inline-flex items-center gap-2 text-gray-400 hover:text-arcade-neon-blue mb-2 font-pixel">
              <ArrowLeft size={16} />
              <span>BACK TO GAMES</span>
            </Link>
            
            <div className={`bg-arcade-dark border-2 border-arcade-neon-blue/50 shadow-[0_0_15px_rgba(0,255,255,0.2)] rounded-lg p-4 ${isMobile ? 'p-2' : 'p-4'}`}>
              <div className="text-center mb-3">
                <span className={`${isMobile ? 'text-xl' : 'text-4xl'} mb-2`}>
                  {game.name}
                </span>
              </div>
              
              {/* Main game content */}
              <div className="flex justify-center overflow-hidden">
                {renderGame()}
              </div>
              
              {/* Top scores (only shown for games other than Tetris) */}
              {game.id !== 'tetris' && (
                <div className="mt-4 flex justify-center">
                  <div className="bg-arcade-dark border border-arcade-neon-blue/30 rounded-lg p-3 w-full max-w-md">
                    <h3 className="text-arcade-neon-blue font-pixel mb-3 text-center">
                      TOP SCORES
                    </h3>
                    
                    {topScores.length > 0 ? (
                      <ol className="space-y-2">
                        {topScores.map((score, index) => (
                          <li key={score.id} className="flex justify-between items-center font-pixel border-b border-arcade-neon-blue/20 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">{index + 1}.</span>
                              <span className="text-white">{score.username}</span>
                            </div>
                            <span className="text-arcade-neon-green">{score.points.toLocaleString()}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-center text-gray-400 font-pixel">
                        No scores yet
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
