import { useEffect, useState } from "react";

export default function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate dynamic styles based on mouse position and scroll
  const titleStyle = {
    color: `hsl(${(mousePosition.x / window.innerWidth) * 360}, 70%, 50%)`,
    transform: `
      scale(${1 + (mousePosition.y / window.innerHeight) * 0.3})
      rotate(${(mousePosition.x / window.innerWidth - 0.5) * 10}deg)
      translateY(${scrollY * 0.5}px)
    `,
    textShadow: `${mousePosition.x / 100}px ${mousePosition.y / 100}px 20px rgba(0,0,0,0.3)`,
  };

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
          <div className="text-xl font-bold tracking-wide">FS</div>
          <nav className="hidden md:flex space-x-8">
            <button className="hover:text-cyan-400 transition-colors duration-300">Games</button>
            <button className="hover:text-cyan-400 transition-colors duration-300">About</button>
            <button className="hover:text-cyan-400 transition-colors duration-300">Contact</button>
          </nav>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"></div>
        </div>
      </header>

      {/* Interactive Title Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/20"></div>
        <div className="relative z-10 text-center">
          <h1 
            className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tight leading-tight transition-all duration-300 ease-out cursor-default select-none"
            style={titleStyle}
          >
            Добро пожаловать в<br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              FanatickStudio
            </span>
            <br />
            <span className="text-2xl md:text-4xl lg:text-6xl font-light">GAMES</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Погрузитесь в мир невероятных игровых приключений
          </p>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            ></div>
          ))}
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
            © 2024 FanatickStudio. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
