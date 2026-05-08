import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BOARD_SIZE = 20;
const TICK_MS = 115;
const START_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 },
];
const START_DIRECTION = { x: 1, y: 0 };
const HIGH_SCORE_KEY = 'neon-snake-high-score';

const directionByKey = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function randomFood(snake) {
  const occupied = new Set(snake.map((cell) => `${cell.x},${cell.y}`));
  const freeCells = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }

  return freeCells[Math.floor(Math.random() * freeCells.length)] ?? { x: 10, y: 10 };
}

function getInitialHighScore() {
  const saved = Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10);
  return Number.isFinite(saved) ? saved : 0;
}

export default function App() {
  const [snake, setSnake] = useState(START_SNAKE);
  const [food, setFood] = useState(() => randomFood(START_SNAKE));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(getInitialHighScore);
  const [isGameOver, setIsGameOver] = useState(false);
  const directionRef = useRef(START_DIRECTION);
  const nextDirectionRef = useRef(START_DIRECTION);

  const snakeCells = useMemo(() => new Set(snake.map((cell) => `${cell.x},${cell.y}`)), [snake]);

  const restart = useCallback(() => {
    directionRef.current = START_DIRECTION;
    nextDirectionRef.current = START_DIRECTION;
    setSnake(START_SNAKE);
    setFood(randomFood(START_SNAKE));
    setScore(0);
    setIsGameOver(false);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      const next = directionByKey[event.key];

      if (!next) {
        return;
      }

      event.preventDefault();

      if (isGameOver) {
        restart();
        return;
      }

      const current = nextDirectionRef.current;
      const isReverse = current.x + next.x === 0 && current.y + next.y === 0;

      if (!isReverse) {
        nextDirectionRef.current = next;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, restart]);

  useEffect(() => {
    if (isGameOver) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setSnake((currentSnake) => {
        directionRef.current = nextDirectionRef.current;

        const head = currentSnake[0];
        const nextHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };
        const hitWall =
          nextHead.x < 0 ||
          nextHead.x >= BOARD_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= BOARD_SIZE;
        const ateFood = sameCell(nextHead, food);
        const bodyToCheck = ateFood ? currentSnake : currentSnake.slice(0, -1);
        const hitSelf = bodyToCheck.some((cell) => sameCell(cell, nextHead));

        if (hitWall || hitSelf) {
          setIsGameOver(true);
          return currentSnake;
        }

        const nextSnake = [nextHead, ...currentSnake];

        if (ateFood) {
          setScore((currentScore) => {
            const nextScore = currentScore + 10;
            setHighScore((currentHighScore) => {
              const best = Math.max(currentHighScore, nextScore);
              localStorage.setItem(HIGH_SCORE_KEY, String(best));
              return best;
            });
            return nextScore;
          });
          setFood(randomFood(nextSnake));
          return nextSnake;
        }

        nextSnake.pop();
        return nextSnake;
      });
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [food, isGameOver]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6">
      <section className="w-full max-w-4xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
              React + Vite
            </p>
            <h1 className="font-display text-4xl font-black uppercase text-cyan-100 text-glow-cyan sm:text-6xl">
              Neon Snake
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3 text-right">
            <ScoreCard label="当前分数" value={score} tone="cyan" />
            <ScoreCard label="最高分" value={highScore} tone="pink" />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
          <div className="relative rounded-lg border border-cyan-300/30 bg-slate-950/76 p-2 shadow-neon backdrop-blur">
            <div
              className="grid aspect-square w-full rounded-md border border-white/10 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)]"
              style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                backgroundSize: `calc(100% / ${BOARD_SIZE}) calc(100% / ${BOARD_SIZE})`,
              }}
              aria-label="贪吃蛇棋盘"
            >
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
                const x = index % BOARD_SIZE;
                const y = Math.floor(index / BOARD_SIZE);
                const isHead = sameCell(snake[0], { x, y });
                const isSnake = snakeCells.has(`${x},${y}`);
                const isFood = sameCell(food, { x, y });

                return (
                  <div key={`${x}-${y}`} className="relative aspect-square p-[10%]">
                    {isSnake && (
                      <div
                        className={`h-full w-full rounded-[0.18rem] ${
                          isHead
                            ? 'bg-cyan-200 text-cyan-200 shadow-cell'
                            : 'bg-emerald-300 text-emerald-300 shadow-cell'
                        }`}
                      />
                    )}
                    {isFood && (
                      <div className="h-full w-full rounded-full bg-pink-400 text-pink-400 shadow-cell ring-2 ring-pink-100/70" />
                    )}
                  </div>
                );
              })}
            </div>

            {isGameOver && (
              <div className="absolute inset-2 flex items-center justify-center rounded-md bg-slate-950/84 p-5 backdrop-blur-sm">
                <div className="text-center">
                  <p className="font-display text-3xl font-black uppercase text-pink-200 text-glow-pink sm:text-5xl">
                    Game Over
                  </p>
                  <button
                    type="button"
                    onClick={restart}
                    className="mt-6 rounded-md border border-cyan-200/80 bg-cyan-300 px-6 py-3 font-bold uppercase tracking-[0.18em] text-slate-950 shadow-neon transition hover:bg-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-200/40"
                  >
                    重新开始
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-pink-300/20 bg-slate-950/68 p-5 shadow-neon backdrop-blur">
            <h2 className="font-display text-xl font-bold uppercase text-pink-100 text-glow-pink">
              控制台
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <KeyCap className="col-start-2">↑</KeyCap>
              <KeyCap>←</KeyCap>
              <KeyCap>↓</KeyCap>
              <KeyCap>→</KeyCap>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              方向键移动。撞墙或撞到自己后结束，按任意方向键或点击按钮重新开始。
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ScoreCard({ label, value, tone }) {
  const toneClass = tone === 'pink' ? 'text-pink-200 border-pink-300/30' : 'text-cyan-200 border-cyan-300/30';

  return (
    <div className={`min-w-28 rounded-lg border bg-slate-950/70 px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="font-display text-3xl font-black">{value}</p>
    </div>
  );
}

function KeyCap({ children, className = '' }) {
  return (
    <div
      className={`flex aspect-square items-center justify-center rounded-md border border-cyan-200/30 bg-slate-900 text-2xl font-black text-cyan-100 shadow-neon ${className}`}
    >
      {children}
    </div>
  );
}
