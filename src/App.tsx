import { useEffect, useState, useMemo } from "react";

// Генерируем хаотичные позиции частиц один раз
const generateParticles = (count: number) => {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    depth: 0.3 + Math.random() * 0.7,
  }));
};

const staticParticles = generateParticles(45);

export default function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Используем статичные частицы чтобы они не менялись при ре-рендере
  const particlesData = useMemo(() => staticParticles, []);
  
  // Анимация разлёта при загрузке
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: e.clientX / window.innerWidth, 
        y: e.clientY / window.innerHeight 
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const gameIcons = [
    { name: "Action RPG", icon: "⚔️", color: "bg-red-500" },
    { name: "Racing", icon: "🏎️", color: "bg-blue-500" },
    { name: "Puzzle", icon: "🧩", color: "bg-green-500" },
    { name: "Strategy", icon: "♟️", color: "bg-purple-500" },
    { name: "Adventure", icon: "🗺️", color: "bg-yellow-500" },
    { name: "Shooter", icon: "🎯", color: "bg-orange-500" },
    { name: "Sports", icon: "⚽", color: "bg-teal-500" },
    { name: "Simulation", icon: "🏗️", color: "bg-indigo-500" },
    { name: "Horror", icon: "👻", color: "bg-gray-800" },
    { name: "Platformer", icon: "🦘", color: "bg-pink-500" },
    { name: "Fighting", icon: "👊", color: "bg-red-600" },
    { name: "Music", icon: "🎵", color: "bg-cyan-500" },
    { name: "Card Game", icon: "🃏", color: "bg-amber-500" },
    { name: "Arcade", icon: "🕹️", color: "bg-lime-500" },
    { name: "MMO", icon: "🌐", color: "bg-violet-500" },
    { name: "Casual", icon: "🎲", color: "bg-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-x-hidden">
      {/* Minimalist Header */}
      <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => window.location.reload()}
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-sm font-bold tracking-wide hover:border-white/40 hover:bg-white/10 transition-all duration-300 cursor-pointer"
          >
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">FS</span>
          </button>
          <nav className="hidden md:flex space-x-8">
            <button className="hover:text-cyan-400 transition-colors duration-300">Games</button>
            <button className="hover:text-cyan-400 transition-colors duration-300">About</button>
            <button className="hover:text-cyan-400 transition-colors duration-300">Contact</button>
          </nav>
          <button 
            className="h-10 px-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center gap-3 hover:border-white/40 hover:bg-white/10 transition-all duration-300 cursor-pointer"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="url(#profileGradient)" 
              strokeWidth="2" 
              viewBox="0 0 24 24"
            >
              <defs>
                <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="text-sm font-medium">
              Очки: <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-bold">1000</span>
            </span>
          </button>
        </div>
      </header>

      {/* Interactive Title Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/20"></div>
        <div className="relative z-10 text-center" style={{ perspective: '1000px' }}>
          <h1 
            className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tight leading-tight cursor-default select-none text-white transition-transform duration-1000 ease-out"
            style={{
              transform: `rotateY(${(mousePosition.x - 0.5) * 10}deg) rotateX(${(mousePosition.y - 0.5) * -10}deg)`,
            }}
          >
            Добро пожаловать в<br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-shimmer">
              FanatickStudio
            </span>
            <br />
            <span className="text-2xl md:text-4xl lg:text-6xl font-light">GAMES</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Погрузитесь в мир невероятных игровых приключений
          </p>
        </div>
        
        {/* Floating particles that react to cursor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particlesData.map((particle, i) => {
            // Медленное смещение от курсора (эффект параллакса)
            const offsetX = (mousePosition.x - 0.5) * 50 * particle.depth;
            const offsetY = (mousePosition.y - 0.5) * 30 * particle.depth;
            
            // Начальная позиция - центр экрана, конечная - случайная
            const startX = 50;
            const startY = 50;
            const finalX = isLoaded ? particle.x : startX;
            const finalY = isLoaded ? particle.y : startY;
            
            return (
              <div
                key={i}
                className="absolute bg-white rounded-full transition-all duration-[2000ms] ease-out"
                style={{
                  left: `${finalX}%`,
                  top: `${finalY}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  opacity: isLoaded ? 0.1 + particle.depth * 0.25 : 0,
                  transform: `translate(${offsetX}px, ${offsetY}px) scale(${isLoaded ? 1 : 0})`,
                }}
              ></div>
            );
          })}
        </div>
      </section>

      {/* Games Grid Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Наши Игры
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {gameIcons.map((game, index) => (
              <div
                key={index}
                className="group relative aspect-square bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:rotate-1 cursor-pointer overflow-hidden"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 ${game.color} opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
                  <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {game.icon}
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white/90 group-hover:text-white transition-colors duration-300">
                    {game.name}
                  </h3>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/10">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            © 2026 FanatickStudio. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
