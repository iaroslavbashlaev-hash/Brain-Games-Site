import { useEffect, useState, useMemo, useRef } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unlockAnimation, setUnlockAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiFading, setConfettiFading] = useState(false);
  const [wasLoggedOut, setWasLoggedOut] = useState(true);
  const [isInGamesSection, setIsInGamesSection] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Авторизация
  const { signOut, signIn } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);
  
  // Отслеживаем момент входа в аккаунт
  useEffect(() => {
    if (user && wasLoggedOut) {
      // Пользователь только что вошёл
      setWasLoggedOut(false);
      
      // Проверяем, видел ли пользователь уже анимацию (вход в существующий аккаунт)
      const welcomedUsers = JSON.parse(localStorage.getItem('welcomed_users') || '[]');
      const isReturningUser = welcomedUsers.includes(user._id);
      
      // Прокручиваем к играм плавно (всегда)
      setTimeout(() => {
        document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      
      // Анимация только для новых пользователей (регистрация или гостевой вход)
      if (!isReturningUser) {
        // Сохраняем ID пользователя как "приветствованного"
        localStorage.setItem('welcomed_users', JSON.stringify([...welcomedUsers, user._id]));
        
        setUnlockAnimation(true);
        
        // Показываем конфетти через 1.5 секунды (после анимации тряски замка)
        setTimeout(() => {
          setShowConfetti(true);
          setConfettiFading(false);
        }, 1500);
        
        // Начинаем плавное затухание через 4 секунды
        setTimeout(() => {
          setConfettiFading(true);
        }, 4000);
        
        // Полностью убираем через 6 секунд (после плавного затухания)
        setTimeout(() => {
          setShowConfetti(false);
          setUnlockAnimation(false);
          setConfettiFading(false);
        }, 6000);
      }
    } else if (!user) {
      setWasLoggedOut(true);
    }
  }, [user, wasLoggedOut]);
  
  // Получаем очки пользователя из базы данных
  const userScore = useQuery(api.scores.getUserScore);
  
  // Определяем значок по очкам
  const getBadge = (points: number) => {
    if (points >= 1000) return { icon: "👑", name: "Легенда", color: "text-yellow-400" };
    if (points >= 500) return { icon: "💎", name: "Мастер", color: "text-cyan-400" };
    if (points >= 200) return { icon: "🥇", name: "Эксперт", color: "text-amber-400" };
    if (points >= 100) return { icon: "🥈", name: "Опытный", color: "text-gray-300" };
    if (points >= 50) return { icon: "🥉", name: "Ученик", color: "text-amber-600" };
    return { icon: "🌱", name: "Новичок", color: "text-green-400" };
  };
  
  const badge = getBadge(userScore?.totalPoints ?? 0);
  
  // Используем статичные частицы чтобы они не менялись при ре-рендере
  const particlesData = useMemo(() => staticParticles, []);
  
  // Анимация разлёта при загрузке
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Горячие клавиши: Ctrl+1 - выход, Ctrl+2 - гостевой режим
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        if (user) {
          void signOut();
        }
      }
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        if (!user) {
          void signIn("anonymous");
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, signOut, signIn]);

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

  // Определяем находится ли пользователь в секции игр
  useEffect(() => {
    const mainContainer = document.querySelector('.snap-y');
    if (!mainContainer) return;

    const handleScroll = () => {
      const scrollTop = mainContainer.scrollTop;
      const windowHeight = window.innerHeight;
      // Если прокрутили больше чем на 50% экрана - значит в секции игр
      setIsInGamesSection(scrollTop > windowHeight * 0.5);
    };

    mainContainer.addEventListener('scroll', handleScroll);
    return () => mainContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Скрываем шапку когда в секции игр, показываем в разделе приветствия
  useEffect(() => {
    if (isInGamesSection) {
      setHeaderVisible(false);
    } else {
      // Возвращаемся в раздел приветствия - сразу показываем шапку
      // и очищаем любой таймаут скрытия
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
        headerTimeoutRef.current = null;
      }
      setHeaderVisible(true);
    }
  }, [isInGamesSection]);

  // Обработчики для шапки
  const handleHeaderMouseEnter = () => {
    if (headerTimeoutRef.current) {
      clearTimeout(headerTimeoutRef.current);
      headerTimeoutRef.current = null;
    }
    setHeaderVisible(true);
  };

  const handleHeaderMouseLeave = () => {
    if (isInGamesSection) {
      headerTimeoutRef.current = setTimeout(() => {
        setHeaderVisible(false);
      }, 1300);
    }
  };

  const gameIcons = [
    { name: "Нумизмат", icon: "🪙", color: "bg-amber-500" },
    { name: "Лягушка", icon: "🐸", color: "bg-green-500" },
    { name: "Пазл", icon: "🧩", color: "bg-green-500" },
    { name: "Светлячки", icon: "🌙", color: "bg-yellow-400" },
    { name: "", icon: "", color: "bg-yellow-500" },
    { name: "", icon: "", color: "bg-orange-500" },
    { name: "", icon: "", color: "bg-teal-500" },
    { name: "", icon: "", color: "bg-indigo-500" },
    { name: "", icon: "", color: "bg-gray-800" },
    { name: "", icon: "", color: "bg-pink-500" },
    { name: "", icon: "", color: "bg-red-600" },
    { name: "", icon: "", color: "bg-cyan-500" },
    { name: "", icon: "", color: "bg-amber-500" },
    { name: "", icon: "", color: "bg-lime-500" },
    { name: "", icon: "", color: "bg-violet-500" },
    { name: "", icon: "", color: "bg-emerald-500" },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-x-hidden overflow-y-auto snap-y snap-mandatory">
      {/* Зона активации шапки (всегда видна) */}
      <div 
        className="fixed top-0 left-0 right-0 h-3 z-50 bg-gradient-to-b from-cyan-500/30 to-transparent"
        onMouseEnter={handleHeaderMouseEnter}
        style={{
          opacity: isInGamesSection && !headerVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      />
      
      {/* Minimalist Header */}
      <header 
        className="fixed left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10 transition-all duration-500 ease-out"
        style={{
          top: headerVisible ? '0' : '-60px',
        }}
        onMouseEnter={handleHeaderMouseEnter}
        onMouseLeave={handleHeaderMouseLeave}
      >
        <div className="w-full px-10 py-4 flex justify-between items-center">
          <button 
            onClick={() => window.location.reload()}
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-sm font-bold tracking-wide hover:border-white/40 hover:bg-white/10 transition-all duration-300 cursor-pointer"
          >
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">FS</span>
          </button>
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="hover:text-cyan-400 transition-colors duration-300"
            >
              Games
            </button>
            <button className="hover:text-cyan-400 transition-colors duration-300">About</button>
            <button className="hover:text-cyan-400 transition-colors duration-300">Contact</button>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                {/* Кнопка профиля */}
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center hover:border-white/40 hover:bg-white/10 transition-all duration-300 cursor-pointer"
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
                </button>
                
                {/* Выпадающее меню профиля */}
                {showProfileMenu && (
                  <>
                    {/* Overlay для закрытия при клике вне меню */}
                    <div 
                      className="fixed inset-0 z-[60]"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    {/* Меню */}
                    <div className="absolute right-0 top-12 z-[70] w-64 bg-slate-900/95 border border-white/20 rounded-xl backdrop-blur-md shadow-xl overflow-hidden">
                      {/* Шапка с именем */}
                      <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 relative">
                        {/* Крестик закрытия */}
                        <button
                          onClick={() => setShowProfileMenu(false)}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="text-sm font-medium text-white truncate pr-6">
                          {user.email?.split('@')[0] ?? 'Гость'}
                        </p>
                        <p className="text-xs text-gray-400 truncate pr-6">{user.email ?? 'Анонимный пользователь'}</p>
                      </div>
                      
                      {/* Статистика */}
                      <div className="p-4 space-y-3">
                        {/* Очки */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Очки</span>
                          <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            🏆 {userScore?.totalPoints ?? 0}
                          </span>
                        </div>
                        
                        {/* Монеты */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Монеты</span>
                          <span className="text-sm font-bold text-yellow-400">
                            🪙 {userScore?.coins ?? 0}
                          </span>
                        </div>
                        
                        {/* Значок */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Статус</span>
                          <span className={`text-sm font-medium ${badge.color}`}>
                            {badge.icon} {badge.name}
                          </span>
                        </div>
                        
                        {/* ID пользователя */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">ID</span>
                          <span className="text-xs text-gray-500 font-mono">
                            {user._id.slice(-12)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Реферальная ссылка */}
                      <div className="px-4 pb-4">
                        <p className="text-xs text-gray-400 mb-2">Пригласи друга:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`https://fs-games.app/ref/${userScore?.referralCode ?? user._id.slice(-12).toUpperCase()}`}
                            className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`https://fs-games.app/ref/${userScore?.referralCode ?? user._id.slice(-12).toUpperCase()}`);
                            }}
                            className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs hover:bg-cyan-500/30 transition-colors"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      
                      {/* Кнопка выхода */}
                      <div className="p-3 border-t border-white/10">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            void signOut();
                          }}
                          className="w-full py-2 px-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                        >
                          Выйти из аккаунта
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="h-10 px-4 rounded-full border border-white/20 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm flex items-center gap-2 hover:border-white/40 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all duration-300 cursor-pointer"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="text-sm font-medium">Войти</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Interactive Title Section */}
      <section className="relative h-screen min-h-screen flex items-center justify-center px-6 py-20 snap-start snap-always">
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
      <section id="games-section" className="relative min-h-screen py-20 px-6 snap-start snap-always flex flex-col justify-center">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Наши Игры
          </h2>
          
          <div>
            {/* Игры */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 blur-transition ${!user && !unlockAnimation ? 'blur-md pointer-events-none select-none' : ''}`}>
              {gameIcons.map((game, index) => {
                const isInDev = !game.icon || game.icon.trim() === "";
                const title = isInDev ? "В разработке" : game.name;
                const icon = isInDev ? "🛠️" : game.icon;

                return (
                  <div
                    key={index}
                    aria-disabled={isInDev}
                    className={[
                      "group relative aspect-square bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden transition-all duration-500",
                      isInDev
                        ? "cursor-not-allowed opacity-80 hover:opacity-90"
                        : "hover:border-white/30 hover:scale-105 hover:rotate-1 cursor-pointer",
                    ].join(" ")}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {/* Background gradient */}
                    <div
                      className={[
                        "absolute inset-0 opacity-20 transition-opacity duration-300",
                        game.color,
                        isInDev ? "" : "group-hover:opacity-40",
                      ].join(" ")}
                    />

                    {/* In-dev stripes overlay */}
                    {isInDev && (
                      <div className="absolute inset-0 opacity-60 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_10px,transparent_10px,transparent_20px)]" />
                    )}

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
                      <div
                        className={[
                          "text-4xl md:text-5xl mb-3 transition-transform duration-300",
                          isInDev ? "scale-100" : "group-hover:scale-110",
                        ].join(" ")}
                      >
                        {icon}
                      </div>
                      <h3
                        className={[
                          "text-sm md:text-base font-semibold transition-colors duration-300",
                          isInDev ? "text-white/80" : "text-white/90 group-hover:text-white",
                        ].join(" ")}
                      >
                        {title}
                      </h3>

                      {isInDev && (
                        <p className="mt-2 text-xs text-white/60">
                          Скоро появится
                        </p>
                      )}
                    </div>

                    {/* Badge */}
                    {isInDev && (
                      <div className="absolute top-3 right-3 z-20 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
                        В разработке
                      </div>
                    )}

                    {/* Hover effect overlay */}
                    <div
                      className={[
                        "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300",
                        isInDev ? "opacity-70" : "opacity-0 group-hover:opacity-100",
                      ].join(" ")}
                    />

                    {/* Shine effect */}
                    {!isInDev && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Оверлей с замком для неавторизованных */}
        {!user && !unlockAnimation && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            {/* Замок */}
            <div className="w-20 h-20 rounded-full bg-slate-800/80 border-2 border-white/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            {/* Кнопка входа */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all shadow-lg hover:shadow-cyan-500/25"
            >
              Регистрация или Вход
            </button>
            <p className="mt-3 text-gray-400 text-sm">
              Войдите, чтобы играть и зарабатывать очки
            </p>
          </div>
        )}
        
        {/* Анимация открытия замка */}
        {unlockAnimation && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 transition-opacity duration-[2000ms] ease-out ${confettiFading ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 border-4 border-white/50 flex items-center justify-center shadow-2xl transition-all duration-500 ${!showConfetti ? 'animate-unlock-shake' : ''}`}>
              <svg className={`w-14 h-14 text-white drop-shadow-lg transition-all duration-300 ${showConfetti ? 'animate-unlock-open' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            {showConfetti && (
              <p className="mt-8 text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent animate-pulse">
                Добро пожаловать! 🎉
              </p>
            )}
          </div>
        )}
        
        {/* Конфетти */}
        {showConfetti && (
          <div 
            className={`fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-[2000ms] ease-out ${confettiFading ? 'opacity-0' : 'opacity-100'}`}
          >
            {[...Array(60)].map((_, i) => {
              const colors = ['#22d3ee', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#fbbf24', '#f472b6'];
              const color = colors[i % colors.length];
              const left = 10 + (i * 1.5) % 80; // Более равномерное распределение
              const delay = (i * 0.05); // Каскадный эффект
              const duration = 3 + (i % 3); // 3-5 секунд
              const size = 6 + (i % 4) * 3; // 6-15px
              const shapes = ['50%', '3px', '0']; // Круг, квадрат, ромб
              
              return (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    borderRadius: shapes[i % 3],
                    transform: i % 3 === 2 ? 'rotate(45deg)' : 'none',
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/10">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            © 2026 FanatickStudio. Все права защищены.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="bg-slate-900 border border-white/20 rounded-2xl p-8 w-full max-w-md mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SignInForm onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </div>
  );
}
