import { useEffect, useMemo, useState } from "react";
import { useAwardPoints } from "./_awardPoints";

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const SYMBOLS = ["🎯", "🎨", "🎪", "🎭", "🎸", "🎲", "🎳", "🎮"];

export function MemoryCardsGame({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const award = useAwardPoints("memory-cards", { level: 1, difficulty: "easy" });

  const initializeGame = () => {
    const cardPairs = [...SYMBOLS, ...SYMBOLS];
    const shuffled = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        value: symbol,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return;
    if (cards[cardId]?.isFlipped || cards[cardId]?.isMatched) return;

    const newCards = [...cards];
    newCards[cardId].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;

      if (newCards[first].value === newCards[second].value) {
        setTimeout(() => {
          const updated = [...newCards];
          updated[first].isMatched = true;
          updated[second].isMatched = true;
          setCards(updated);
          setFlippedCards([]);
        }, 550);
      } else {
        setTimeout(() => {
          const updated = [...newCards];
          updated[first].isFlipped = false;
          updated[second].isFlipped = false;
          setCards(updated);
          setFlippedCards([]);
        }, 650);
      }
    }
  };

  const isComplete = useMemo(() => cards.length > 0 && cards.every((c) => c.isMatched), [cards]);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const won = isComplete;
      // Reward if solved efficiently
      const points = won ? (moves <= 18 ? 45 : moves <= 26 ? 30 : 20) : undefined;
      await award({ won, pointsOverride: points });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/70 hover:text-white transition-colors">
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">
          Ходов: <span className="text-white/90 font-semibold">{moves}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Карточки памяти
          </h2>
          <p className="mt-3 text-white/70">Найдите все пары. Открывайте по две карточки.</p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-grid grid-cols-4 gap-1.5 sm:gap-2.5 place-items-center">
          {cards.map((card) => {
            const open = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                className={[
                  "w-[72px] h-[72px] sm:w-[86px] sm:h-[86px] md:w-[96px] md:h-[96px] rounded-2xl border transition-all duration-200 flex items-center justify-center text-3xl md:text-4xl font-extrabold",
                  open
                    ? "bg-white/10 border-white/15 shadow-inner"
                    : "bg-gradient-to-br from-cyan-500/35 to-purple-500/35 border-white/10 hover:border-white/25 hover:bg-white/10",
                  card.isMatched ? "opacity-60" : "",
                ].join(" ")}
              >
                {open ? card.value : <span className="text-white/60">?</span>}
              </button>
            );
          })}
          </div>
        </div>

        {isComplete && (
          <div className="mt-7 text-center">
            <div className="text-2xl font-bold text-emerald-300">🎉 Готово!</div>
            <div className="mt-1 text-white/70">Вы завершили игру за {moves} ходов.</div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-white/10 border border-white/15 px-6 py-4 font-semibold text-white hover:bg-white/15 transition-colors disabled:opacity-60"
          >
            {submitting ? "Сохраняем..." : "Сохранить результат"}
          </button>
          <button
            onClick={initializeGame}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white/90 hover:bg-white/10 transition-colors"
          >
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
}


