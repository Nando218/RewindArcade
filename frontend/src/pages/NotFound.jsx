
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { NeonText } from '@/components/ui/neon-text';
import { ArcadeButton } from '@/components/ui/arcade-button';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <NeonText color="purple" className="text-6xl mb-4" glitch>
              404
            </NeonText>
            <NeonText color="blue" className="text-2xl mb-6">
              PAGE NOT FOUND
            </NeonText>
          </div>
          
          <p className="text-gray-300 font-pixel mb-8 max-w-md mx-auto">
            GAME OVER - The page you are looking for does not exist in the Rewind Arcade universe.
            Want to go back to the home screen to keep playing?
          </p>
          
          <Link to="/">
            <ArcadeButton variant="green" className="animate-pulse">
              INSERT COIN TO CONTINUE
            </ArcadeButton>
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
