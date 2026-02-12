import { useEffect, useMemo, useRef, useState } from "react";
import { useAwardPoints } from "./_awardPoints";

const PRESET: Array<Array<number | null>> = [
  [5, 3, null, null, 7, null, null, null, null],
  [6, null, null, 1, 9, 5, null, null, null],
  [null, 9, 8, null, null, null, null, 6, null],
  [8, null, null, null, 6, null, null, null, 3],
  [4, null, null, 8, null, 3, null, null, 1],
  [7, null, null, null, 2, null, null, null, 6],
  [null, 6, null, null, null, null, 2, 8, null],
  [null, null, null, 4, 1, 9, null, null, 5],
  [null, null, null, null, 8, null, null, 7, 9],
];

function cloneGrid(grid: Array<Array<number | null>>) {
  return grid.map((row) => [...row]);
}

function isComplete(grid: Array<Array<number | null>>) {
  return grid.every((row) => row.every((c) => typeof c === "number" && c >= 1 && c <= 9));
}

function isValidGroup(nums: Array<number>) {
  if (nums.length !== 9) return false;
  const set = new Set(nums);
  if (set.size !== 9) return false;
  for (const n of set) {
    if (n < 1 || n > 9) return false;
  }
  return true;
}

function isValidSudoku(grid: Array<Array<number | null>>) {
  if (!isComplete(grid)) return false;

  // rows
  for (let r = 0; r < 9; r++) {
    if (!isValidGroup(grid[r] as Array<number>)) return false;
  }
  // cols
  for (let c = 0; c < 9; c++) {
    const col: Array<number> = [];
    for (let r = 0; r < 9; r++) col.push(grid[r][c] as number);
    if (!isValidGroup(col)) return false;
  }
  // 3x3 blocks
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const block: Array<number> = [];
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          block.push(grid[r][c] as number);
        }
      }
      if (!isValidGroup(block)) return false;
    }
  }
  return true;
}

export function SudokuGame({ onBack }: { onBack: () => void }) {
  const [grid, setGrid] = useState<Array<Array<number | null>>>([]);
  const [initialGrid, setInitialGrid] = useState<Array<Array<number | null>>>([]);
  const [checking, setChecking] = useState(false);
  const [won, setWon] = useState(false);
  const [wrongNotice, setWrongNotice] = useState<"hidden" | "show" | "fade">("hidden");
  const wrongNoticeFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongNoticeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const award = useAwardPoints("sudoku", { level: 1, difficulty: "easy" });

  useEffect(() => {
    const base = cloneGrid(PRESET);
    setGrid(base);
    setInitialGrid(cloneGrid(base));
  }, []);

  const fixedCells = useMemo(() => {
    const fixed = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (initialGrid[r]?.[c] !== null && typeof initialGrid[r]?.[c] === "number") {
          fixed.add(`${r}-${c}`);
        }
      }
    }
    return fixed;
  }, [initialGrid]);

  const newGame = () => {
    const base = cloneGrid(PRESET);
    setGrid(base);
    setInitialGrid(cloneGrid(base));
    setWon(false);
    setWrongNotice("hidden");
    if (wrongNoticeFadeTimerRef.current) {
      clearTimeout(wrongNoticeFadeTimerRef.current);
      wrongNoticeFadeTimerRef.current = null;
    }
    if (wrongNoticeHideTimerRef.current) {
      clearTimeout(wrongNoticeHideTimerRef.current);
      wrongNoticeHideTimerRef.current = null;
    }
  };

  const handleCellChange = (row: number, col: number, raw: string) => {
    if (fixedCells.has(`${row}-${col}`)) return;
    const cleaned = raw.replace(/[^\d]/g, "");
    const next = cleaned === "" ? null : Number(cleaned);
    if (next !== null && (Number.isNaN(next) || next < 1 || next > 9)) return;
    setGrid((prev) => {
      const g = cloneGrid(prev);
      g[row][col] = next;
      return g;
    });
  };

  const checkAndFinish = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const ok = isValidSudoku(grid);
      if (ok) {
        setWon(true);
        setWrongNotice("hidden");
        if (wrongNoticeFadeTimerRef.current) {
          clearTimeout(wrongNoticeFadeTimerRef.current);
          wrongNoticeFadeTimerRef.current = null;
        }
        if (wrongNoticeHideTimerRef.current) {
          clearTimeout(wrongNoticeHideTimerRef.current);
          wrongNoticeHideTimerRef.current = null;
        }
        await award({ won: true, pointsOverride: 50 });
      } else {
        // Show "не верно" for 1.3s with fade-out
        if (wrongNoticeFadeTimerRef.current) {
          clearTimeout(wrongNoticeFadeTimerRef.current);
          wrongNoticeFadeTimerRef.current = null;
        }
        if (wrongNoticeHideTimerRef.current) {
          clearTimeout(wrongNoticeHideTimerRef.current);
          wrongNoticeHideTimerRef.current = null;
        }
        setWrongNotice("show");
        // Hold, then fade smoothly. Clearing timers above prevents fast disappearing on rapid clicks.
        const HOLD_MS = 1600;
        const FADE_MS = 800;
        wrongNoticeFadeTimerRef.current = setTimeout(() => setWrongNotice("fade"), HOLD_MS);
        wrongNoticeHideTimerRef.current = setTimeout(() => setWrongNotice("hidden"), HOLD_MS + FADE_MS);
        await award({ won: false });
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/70 hover:text-white transition-colors">
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">Судоку · без таймера</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Судоку
          </h2>
          <p className="mt-3 text-white/70">
            Заполните сетку цифрами 1–9 так, чтобы в каждой строке, столбце и квадрате 3×3 все цифры
            встречались по одному разу.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="relative">
            {wrongNotice !== "hidden" && !won && (
              <div
                className={[
                  "absolute inset-0 z-10 flex items-center justify-center pointer-events-none",
                  "transition-opacity duration-[800ms] ease-out",
                  wrongNotice === "fade" ? "opacity-0" : "opacity-100",
                ].join(" ")}
                role="status"
                aria-live="polite"
              >
                <div className="rounded-full border-2 border-fuchsia-200/60 bg-fuchsia-600/75 px-10 py-4 text-xl md:text-2xl font-black tracking-wide text-white shadow-xl backdrop-blur-sm">
                  не верно
                </div>
              </div>
            )}

            <div className="grid grid-cols-9 gap-1 bg-black/35 p-2 rounded-xl border border-white/10">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isFixed = fixedCells.has(`${rowIndex}-${colIndex}`);
                const thickBottom = (rowIndex + 1) % 3 === 0 && rowIndex !== 8;
                const thickRight = (colIndex + 1) % 3 === 0 && colIndex !== 8;
                return (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={cell ?? ""}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    disabled={isFixed || won}
                    className={[
                      "w-9 h-9 md:w-10 md:h-10 text-center rounded-md border text-base md:text-lg font-semibold outline-none transition-colors",
                      isFixed
                        ? "bg-white/10 text-white/90 border-white/10 cursor-not-allowed"
                        : "bg-slate-950/60 text-cyan-200 border-white/10 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15",
                      won ? "opacity-80" : "",
                      thickBottom ? "border-b-2 border-b-white/35" : "border-b-white/10",
                      thickRight ? "border-r-2 border-r-white/35" : "border-r-white/10",
                    ].join(" ")}
                  />
                );
              }),
            )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={checkAndFinish}
            disabled={checking || won}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-4 font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-60"
          >
            {won ? "Решено" : checking ? "Проверяем..." : "Проверить решение (+150)"}
          </button>
          <button
            onClick={newGame}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white/90 hover:bg-white/10 transition-colors"
          >
            Удалить все
          </button>
        </div>
      </div>
    </div>
  );
}


