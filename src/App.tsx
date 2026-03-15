/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const HERRY_IMAGE = "https://lcaryepoaiuzuppladzq.supabase.co/storage/v1/object/public/ccc/herry.png";
const CA = "AMbTjmCCUoWH96dwAn1ukG5WigK86RBfZZ39K5ubpump";

const XLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644z" />
  </svg>
);

// --- Game Component ---
const HerryGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(6);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = () => {
    setScore(0);
    setLives(6);
    setIsGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let frameCount = 0;
    let currentLives = 6;
    let currentIsGameOver = false;

    // Game state
    const herry = {
      x: 100,
      y: 0,
      width: 80, // Slightly smaller for better gameplay balance
      height: 60,
      targetY: 0,
      image: new Image(),
      trail: [] as { x: number, y: number }[]
    };
    herry.image.src = HERRY_IMAGE;
    
    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 3 + 2
    }));

    let items = [] as { x: number, y: number, size: number, type: 'SOL' | 'MOON' | 'ENEMY' }[];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80;
      herry.y = canvas.height / 2;
      herry.targetY = herry.y;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Improved Pointer Controls (Mobile + Desktop)
    const handlePointerMove = (e: PointerEvent) => {
      if (currentIsGameOver) return;
      const rect = canvas.getBoundingClientRect();
      const clientY = e.clientY - rect.top;
      // Smooth follow with a bit of vertical offset for finger visibility on mobile
      const offset = e.pointerType === 'touch' ? -60 : 0;
      herry.targetY = clientY + offset - herry.height / 2;
    };

    canvas.addEventListener('pointermove', handlePointerMove);

    const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];

    const draw = () => {
      if (!gameStarted || currentIsGameOver) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = '#001a33'; // Darker space
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Stars
      ctx.fillStyle = 'white';
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }
      });

      // Update Herry Position (smooth follow)
      const dy = herry.targetY - herry.y;
      herry.y += dy * 0.15; // Faster response
      
      // Clamp
      if (herry.y < 0) herry.y = 0;
      if (herry.y > canvas.height - herry.height) herry.y = canvas.height - herry.height;

      // Update Trail
      herry.trail.unshift({ x: herry.x, y: herry.y + herry.height / 2 });
      if (herry.trail.length > 30) herry.trail.pop();

      // Draw Rainbow Trail
      herry.trail.forEach((pos, i) => {
        const offset = i * 12;
        rainbowColors.forEach((color, j) => {
          ctx.fillStyle = color;
          const segmentHeight = herry.height / rainbowColors.length;
          const wave = Math.sin((frameCount - i) * 0.3) * 6;
          ctx.fillRect(pos.x - offset, pos.y - (herry.height / 2) + (j * segmentHeight) + wave, 14, segmentHeight);
        });
      });

      // Draw Herry
      ctx.drawImage(herry.image, herry.x, herry.y, herry.width, herry.height);

      // Spawn Logic
      if (frameCount % 45 === 0) {
        const rand = Math.random();
        let type: 'SOL' | 'MOON' | 'ENEMY' = 'SOL';
        if (rand > 0.7) type = 'ENEMY';
        else if (rand > 0.4) type = 'MOON';

        items.push({
          x: canvas.width,
          y: Math.random() * (canvas.height - 50),
          size: type === 'ENEMY' ? 45 : 35,
          type
        });
      }

      // Items Update
      items.forEach((item, index) => {
        item.x -= (6 + (score / 500)); // Speed increases with score
        
        // Collision
        const hitX = item.x < herry.x + herry.width * 0.8 && item.x + item.size > herry.x + herry.width * 0.2;
        const hitY = item.y < herry.y + herry.height * 0.8 && item.y + item.size > herry.y + herry.height * 0.2;

        if (hitX && hitY) {
          if (item.type === 'ENEMY') {
            currentLives -= 1;
            setLives(currentLives);
            if (currentLives <= 0) {
              currentIsGameOver = true;
              setIsGameOver(true);
            }
          } else {
            setScore(s => s + (item.type === 'MOON' ? 25 : 10));
          }
          items.splice(index, 1);
          return;
        }

        if (item.x < -item.size) {
          items.splice(index, 1);
          return;
        }

        // Draw Items
        if (item.type === 'ENEMY') {
          ctx.fillStyle = '#ff3333';
          // Draw a spikey enemy
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = i % 2 === 0 ? item.size / 2 : item.size / 4;
            ctx.lineTo(item.x + item.size/2 + Math.cos(angle) * r, item.y + item.size/2 + Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('FUD', item.x + item.size/2 - 12, item.y + item.size/2 + 5);
        } else {
          ctx.fillStyle = item.type === 'SOL' ? '#9945FF' : '#FFD700';
          ctx.beginPath();
          ctx.arc(item.x + item.size/2, item.y + item.size/2, item.size/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(item.type, item.x + item.size/2, item.y + item.size/2 + 4);
        }
      });

      frameCount++;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, [gameStarted]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#001a33] touch-none">
      <canvas ref={canvasRef} className="block w-full h-full cursor-none" />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-xl p-3 flex flex-col gap-1">
          <p className="text-white font-mono text-lg leading-none">SCORE: {score}</p>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-sm transition-colors ${i < lives ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-white/10'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Start/Game Over Overlays */}
      <AnimatePresence>
        {(!gameStarted || isGameOver) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl"
            >
              <img src={HERRY_IMAGE} alt="Herry" className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-purple-500" />
              <h2 className="text-4xl font-black mb-2 italic tracking-tighter">
                {isGameOver ? 'GAME OVER' : 'HERRY HORSE'}
              </h2>
              {isGameOver && <p className="text-purple-400 font-mono text-xl mb-6">FINAL SCORE: {score}</p>}
              <p className="text-white/60 mb-8 text-sm">
                Avoid the <span className="text-red-500 font-bold">RED FUD</span> spikes!<br />
                Collect <span className="text-purple-400 font-bold">SOL</span> and <span className="text-yellow-400 font-bold">MOON</span> tokens.
              </p>
              <button 
                onClick={resetGame}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(153,69,255,0.4)]"
              >
                {isGameOver ? 'TRY AGAIN' : 'START FLYING'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-white/30 text-[10px] font-mono uppercase tracking-widest">
        {window.ontouchstart !== undefined ? 'Drag to fly' : 'Move mouse to fly'}
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 bg-black border-b border-white/10 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500 shadow-[0_0_15px_rgba(153,69,255,0.5)]">
            <img 
              src={HERRY_IMAGE} 
              alt="Herry Horse" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            $HERRY
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest">CA:</span>
          <code className="text-xs font-mono text-purple-300 truncate max-w-[200px] lg:max-w-none">
            {CA}
          </code>
          <button 
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors relative group"
            title="Copy Contract Address"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/60" />}
            <AnimatePresence>
              {copied && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-green-500 text-white px-2 py-1 rounded"
                >
                  COPIED!
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <a 
            href="https://x.com/i/communities/2033232779266462136" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2.5 bg-white text-black rounded-full hover:scale-110 transition-transform flex items-center justify-center"
          >
            <XLogo size={20} />
          </a>
          <a 
            href={`https://dexscreener.com/solana/${CA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(153,69,255,0.4)] transition-all"
          >
            BUY NOW <ExternalLink size={14} />
          </a>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 relative">
        <HerryGame />
      </main>

      {/* Mobile CA bar */}
      <div className="md:hidden p-3 bg-black border-t border-white/10 flex items-center justify-between gap-2">
        <code className="text-[10px] font-mono text-purple-300 truncate">
          {CA}
        </code>
        <button 
          onClick={copyToClipboard}
          className="p-2 bg-white/5 rounded-lg"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/60" />}
        </button>
      </div>
    </div>
  );
}
