import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BOARD_SIZE = 20;
const SAVE_KEY = 'neonSnakeSaveData';
const LEGACY_HIGH_SCORE_KEY = 'neon-snake-high-score';
const START_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 },
];
const START_DIRECTION = { x: 1, y: 0 };

const LEVELS = [
  { id: 1, name: '霓虹初醒', targetFood: 5, speed: 180, obstacleCount: 0, rewardSkinId: 'electric-blue', difficulty: '简单' },
  { id: 2, name: '紫光巷道', targetFood: 7, speed: 165, obstacleCount: 1, rewardSkinId: 'neon-purple', difficulty: '简单' },
  { id: 3, name: '矩阵边界', targetFood: 10, speed: 150, obstacleCount: 2, rewardSkinId: 'matrix-green', difficulty: '普通' },
  { id: 4, name: '火焰回廊', targetFood: 12, speed: 140, obstacleCount: 3, rewardSkinId: 'flame', difficulty: '普通' },
  { id: 5, name: '冰霜裂隙', targetFood: 15, speed: 130, obstacleCount: 4, rewardSkinId: 'frost', difficulty: '普通' },
  { id: 6, name: '黄金信号', targetFood: 18, speed: 120, obstacleCount: 5, rewardSkinId: 'gold', difficulty: '进阶' },
  { id: 7, name: '赛博迷城', targetFood: 20, speed: 110, obstacleCount: 6, rewardSkinId: 'cyber', difficulty: '进阶' },
  { id: 8, name: '暗影区块', targetFood: 23, speed: 100, obstacleCount: 7, rewardSkinId: 'shadow', difficulty: '困难' },
  { id: 9, name: '彩虹电路', targetFood: 25, speed: 95, obstacleCount: 8, rewardSkinId: 'rainbow', difficulty: '困难' },
  { id: 10, name: '机械核心', targetFood: 28, speed: 90, obstacleCount: 9, rewardSkinId: 'mech', difficulty: '高难' },
  { id: 11, name: '星云漂移', targetFood: 30, speed: 82, obstacleCount: 10, rewardSkinId: 'nebula', difficulty: '高难' },
  { id: 12, name: '终极霓虹', targetFood: 35, speed: 75, obstacleCount: 12, rewardSkinId: 'ultimate-neon', difficulty: '终极' },
];

const SKINS = [
  { id: 'default', name: '默认霓虹蛇', unlockText: '初始获得', colors: { head: '#22d3ee', body: '#06b6d4', glow: '#67e8f9' } },
  { id: 'electric-blue', name: '蓝色电光蛇', unlockText: '通关第 1 关获得', colors: { head: '#60a5fa', body: '#2563eb', glow: '#93c5fd' } },
  { id: 'neon-purple', name: '紫色霓虹蛇', unlockText: '通关第 2 关获得', colors: { head: '#c084fc', body: '#7e22ce', glow: '#e9d5ff' } },
  { id: 'matrix-green', name: '绿色矩阵蛇', unlockText: '通关第 3 关获得', colors: { head: '#86efac', body: '#16a34a', glow: '#bbf7d0' } },
  { id: 'flame', name: '火焰蛇', unlockText: '通关第 4 关获得', colors: { head: '#fed7aa', body: '#f97316', glow: '#fb7185' } },
  { id: 'frost', name: '冰霜蛇', unlockText: '通关第 5 关获得', colors: { head: '#e0f2fe', body: '#38bdf8', glow: '#bae6fd' } },
  { id: 'gold', name: '黄金蛇', unlockText: '通关第 6 关获得', colors: { head: '#fde68a', body: '#d97706', glow: '#fef3c7' } },
  { id: 'cyber', name: '赛博蛇', unlockText: '通关第 7 关获得', colors: { head: '#67e8f9', body: '#a855f7', glow: '#f0abfc' } },
  { id: 'shadow', name: '暗影蛇', unlockText: '通关第 8 关获得', colors: { head: '#cbd5e1', body: '#475569', glow: '#94a3b8' } },
  { id: 'rainbow', name: '彩虹蛇', unlockText: '通关第 9 关获得', colors: { head: '#fef08a', body: '#22c55e', glow: '#f472b6' } },
  { id: 'mech', name: '机械蛇', unlockText: '通关第 10 关获得', colors: { head: '#e2e8f0', body: '#64748b', glow: '#38bdf8' } },
  { id: 'nebula', name: '星云蛇', unlockText: '通关第 11 关获得', colors: { head: '#f5d0fe', body: '#4f46e5', glow: '#c084fc' } },
  { id: 'ultimate-neon', name: '终极霓虹蛇', unlockText: '通关第 12 关获得', colors: { head: '#ffffff', body: '#14b8a6', glow: '#f0abfc' } },
];

const directionByKey = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function uniqueNumbers(values) {
  return Array.from(new Set(values)).filter((value) => Number.isInteger(value));
}

function uniqueStrings(values) {
  return Array.from(new Set(values)).filter(Boolean);
}

function buildInitialSave() {
  const legacyScore = Number.parseInt(localStorage.getItem(LEGACY_HIGH_SCORE_KEY) ?? '0', 10);
  return {
    unlockedLevels: [1],
    completedLevels: [],
    unlockedSkins: ['default'],
    selectedSkin: 'default',
    highestScore: Number.isFinite(legacyScore) ? legacyScore : 0,
  };
}

function normalizeSave(rawSave) {
  const base = buildInitialSave();
  if (!rawSave || typeof rawSave !== 'object') {
    return base;
  }

  const unlockedSkins = uniqueStrings(['default', ...(rawSave.unlockedSkins ?? [])]).filter((skinId) =>
    SKINS.some((skin) => skin.id === skinId),
  );
  const selectedSkin = unlockedSkins.includes(rawSave.selectedSkin) ? rawSave.selectedSkin : 'default';

  return {
    unlockedLevels: uniqueNumbers([1, ...(rawSave.unlockedLevels ?? [])]).filter((levelId) =>
      LEVELS.some((level) => level.id === levelId),
    ),
    completedLevels: uniqueNumbers(rawSave.completedLevels ?? []).filter((levelId) =>
      LEVELS.some((level) => level.id === levelId),
    ),
    unlockedSkins,
    selectedSkin,
    highestScore: Math.max(base.highestScore, Number(rawSave.highestScore) || 0),
  };
}

function loadSave() {
  try {
    return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
  } catch {
    return buildInitialSave();
  }
}

function randomFreeCell(snake, obstacles) {
  const occupied = new Set([...snake, ...obstacles].map((cell) => `${cell.x},${cell.y}`));
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

function generateObstacles(level) {
  const blocked = new Set(START_SNAKE.map((cell) => `${cell.x},${cell.y}`));
  blocked.add('9,10');
  blocked.add('10,10');
  blocked.add('11,10');

  const obstacles = [];
  let cursor = level.id * 17;

  while (obstacles.length < level.obstacleCount) {
    const x = (cursor * 7 + level.id * 3) % BOARD_SIZE;
    const y = (cursor * 11 + level.id * 5) % BOARD_SIZE;
    const key = `${x},${y}`;
    const nearStart = y >= 8 && y <= 12 && x >= 5 && x <= 12;

    if (!blocked.has(key) && !nearStart) {
      obstacles.push({ x, y });
      blocked.add(key);
    }

    cursor += 1;
  }

  return obstacles;
}

function getLevelStatus(level, save) {
  if (save.completedLevels.includes(level.id)) {
    return '已通关';
  }
  if (save.unlockedLevels.includes(level.id)) {
    return '可挑战';
  }
  return '未解锁';
}

function getHighestUnlockedLevel(save) {
  return Math.max(...save.unlockedLevels);
}

export default function App() {
  const [saveData, setSaveData] = useState(loadSave);
  const [view, setView] = useState('menu');
  const [activeLevelId, setActiveLevelId] = useState(getHighestUnlockedLevel(saveData));
  const [snake, setSnake] = useState(START_SNAKE);
  const [obstacles, setObstacles] = useState([]);
  const [food, setFood] = useState(() => randomFreeCell(START_SNAKE, []));
  const [score, setScore] = useState(0);
  const [foodProgress, setFoodProgress] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const [rewardStatus, setRewardStatus] = useState(null);
  const directionRef = useRef(START_DIRECTION);
  const nextDirectionRef = useRef(START_DIRECTION);
  const gameStateRef = useRef(gameState);

  const activeLevel = LEVELS.find((level) => level.id === activeLevelId) ?? LEVELS[0];
  const selectedSkin = SKINS.find((skin) => skin.id === saveData.selectedSkin) ?? SKINS[0];
  const rewardSkin = SKINS.find((skin) => skin.id === activeLevel.rewardSkinId) ?? SKINS[0];
  const unlockedSkinCount = saveData.unlockedSkins.length;
  const highestUnlockedLevel = getHighestUnlockedLevel(saveData);

  const snakeCells = useMemo(() => new Set(snake.map((cell) => `${cell.x},${cell.y}`)), [snake]);
  const obstacleCells = useMemo(() => new Set(obstacles.map((cell) => `${cell.x},${cell.y}`)), [obstacles]);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }, [saveData]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const resetLevel = useCallback((level) => {
    const nextObstacles = generateObstacles(level);
    directionRef.current = START_DIRECTION;
    nextDirectionRef.current = START_DIRECTION;
    setSnake(START_SNAKE);
    setObstacles(nextObstacles);
    setFood(randomFreeCell(START_SNAKE, nextObstacles));
    setScore(0);
    setFoodProgress(0);
    setRewardStatus(null);
    setGameState('running');
    setView('game');
  }, []);

  const startLevel = useCallback(
    (levelId) => {
      const level = LEVELS.find((item) => item.id === levelId);
      if (!level || !saveData.unlockedLevels.includes(levelId)) {
        return;
      }

      setActiveLevelId(levelId);
      resetLevel(level);
    },
    [resetLevel, saveData.unlockedLevels],
  );

  const openLatestLevel = useCallback(() => {
    startLevel(highestUnlockedLevel);
  }, [highestUnlockedLevel, startLevel]);

  const togglePause = useCallback(() => {
    setGameState((current) => {
      if (current === 'running') {
        return 'paused';
      }
      if (current === 'paused') {
        return 'running';
      }
      return current;
    });
  }, []);

  const completeLevel = useCallback(
    (level, finalScore) => {
      if (gameStateRef.current !== 'running') {
        return;
      }

      gameStateRef.current = 'won';
      setGameState('won');

      setSaveData((currentSave) => {
        const alreadyCompleted = currentSave.completedLevels.includes(level.id);
        const alreadyOwned = currentSave.unlockedSkins.includes(level.rewardSkinId);
        const nextLevel = LEVELS.find((item) => item.id === level.id + 1);
        const nextSave = {
          ...currentSave,
          completedLevels: alreadyCompleted
            ? currentSave.completedLevels
            : [...currentSave.completedLevels, level.id],
          unlockedLevels:
            nextLevel && !currentSave.unlockedLevels.includes(nextLevel.id)
              ? [...currentSave.unlockedLevels, nextLevel.id]
              : currentSave.unlockedLevels,
          unlockedSkins: alreadyOwned
            ? currentSave.unlockedSkins
            : [...currentSave.unlockedSkins, level.rewardSkinId],
          highestScore: Math.max(currentSave.highestScore, finalScore),
        };

        setRewardStatus(alreadyOwned ? 'owned' : 'new');
        return normalizeSave(nextSave);
      });
    },
    [],
  );

  const failLevel = useCallback(() => {
    gameStateRef.current = 'lost';
    setGameState('lost');
    setSaveData((currentSave) => normalizeSave({ ...currentSave, highestScore: Math.max(currentSave.highestScore, score) }));
  }, [score]);

  const useSkin = useCallback((skinId) => {
    setSaveData((currentSave) => {
      if (!currentSave.unlockedSkins.includes(skinId)) {
        return currentSave;
      }
      return normalizeSave({ ...currentSave, selectedSkin: skinId });
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      const next = directionByKey[event.key];

      if (event.key === ' ' && view === 'game' && (gameState === 'running' || gameState === 'paused')) {
        event.preventDefault();
        setGameState((current) => (current === 'running' ? 'paused' : 'running'));
        return;
      }

      if (!next || view !== 'game' || gameState !== 'running') {
        return;
      }

      event.preventDefault();
      const current = nextDirectionRef.current;
      const isReverse = current.x + next.x === 0 && current.y + next.y === 0;

      if (!isReverse) {
        nextDirectionRef.current = next;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, view]);

  useEffect(() => {
    if (view !== 'game' || gameState !== 'running') {
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
        const hitObstacle = obstacleCells.has(`${nextHead.x},${nextHead.y}`);

        if (hitWall || hitSelf || hitObstacle) {
          failLevel();
          return currentSnake;
        }

        const nextSnake = [nextHead, ...currentSnake];

        if (ateFood) {
          const nextScore = score + 10;
          const nextProgress = foodProgress + 1;
          setScore(nextScore);
          setFoodProgress(nextProgress);
          setSaveData((currentSave) =>
            normalizeSave({ ...currentSave, highestScore: Math.max(currentSave.highestScore, nextScore) }),
          );

          if (nextProgress >= activeLevel.targetFood) {
            completeLevel(activeLevel, nextScore);
            return nextSnake;
          }

          setFood(randomFreeCell(nextSnake, obstacles));
          return nextSnake;
        }

        nextSnake.pop();
        return nextSnake;
      });
    }, activeLevel.speed);

    return () => window.clearInterval(interval);
  }, [
    activeLevel,
    completeLevel,
    failLevel,
    food,
    foodProgress,
    gameState,
    obstacleCells,
    obstacles,
    score,
    view,
  ]);

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <Header
          saveData={saveData}
          unlockedSkinCount={unlockedSkinCount}
          onMenu={() => setView('menu')}
          onLevels={() => setView('levels')}
          onSkins={() => setView('skins')}
        />

        {view === 'menu' && (
          <MainMenu
            saveData={saveData}
            highestUnlockedLevel={highestUnlockedLevel}
            unlockedSkinCount={unlockedSkinCount}
            onStart={openLatestLevel}
            onLevels={() => setView('levels')}
            onSkins={() => setView('skins')}
          />
        )}

        {view === 'levels' && <LevelSelect saveData={saveData} onStart={startLevel} />}

        {view === 'skins' && <SkinBackpack saveData={saveData} selectedSkin={selectedSkin} onUseSkin={useSkin} />}

        {view === 'game' && (
          <GameView
            activeLevel={activeLevel}
            snake={snake}
            food={food}
            obstacles={obstacles}
            snakeCells={snakeCells}
            obstacleCells={obstacleCells}
            selectedSkin={selectedSkin}
            score={score}
            highestScore={saveData.highestScore}
            foodProgress={foodProgress}
            gameState={gameState}
            rewardSkin={rewardSkin}
            rewardStatus={rewardStatus}
            unlockedSkinCount={unlockedSkinCount}
            onPause={togglePause}
            onRetry={() => resetLevel(activeLevel)}
            onLevels={() => setView('levels')}
            onSkins={() => setView('skins')}
            onMenu={() => setView('menu')}
            onNext={() => {
              const nextLevel = LEVELS.find((level) => level.id === activeLevel.id + 1);
              if (nextLevel && saveData.unlockedLevels.includes(nextLevel.id)) {
                startLevel(nextLevel.id);
              } else {
                setView('levels');
              }
            }}
          />
        )}
      </section>
    </main>
  );
}

function Header({ saveData, unlockedSkinCount, onMenu, onLevels, onSkins }) {
  return (
    <header className="flex flex-col gap-4 rounded-lg border border-cyan-300/25 bg-slate-950/70 p-4 shadow-neon backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">Level Mode</p>
        <h1 className="font-display text-4xl font-black uppercase text-cyan-100 text-glow-cyan sm:text-6xl">
          Neon Snake
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label="最高关卡" value={`第 ${getHighestUnlockedLevel(saveData)} 关`} />
        <StatusPill label="皮肤收集" value={`${unlockedSkinCount} / ${SKINS.length}`} />
        <NavButton onClick={onMenu}>主页</NavButton>
        <NavButton onClick={onLevels}>关卡选择</NavButton>
        <NavButton onClick={onSkins}>皮肤背包</NavButton>
      </div>
    </header>
  );
}

function MainMenu({ saveData, highestUnlockedLevel, unlockedSkinCount, onStart, onLevels, onSkins }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="rounded-lg border border-cyan-300/25 bg-slate-950/76 p-6 shadow-neon backdrop-blur">
        <p className="text-sm font-semibold text-pink-200">当前进度：第 {highestUnlockedLevel} 关</p>
        <h2 className="mt-2 font-display text-3xl font-black text-cyan-100 sm:text-5xl">霓虹关卡挑战</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          通过每一关的食物目标，解锁下一段赛道和新的蛇皮肤。当前皮肤收集：
          {unlockedSkinCount} / {SKINS.length}。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton onClick={onStart}>开始游戏</PrimaryButton>
          <SecondaryButton onClick={onLevels}>关卡选择</SecondaryButton>
          <SecondaryButton onClick={onSkins}>皮肤背包</SecondaryButton>
        </div>
      </div>

      <div className="rounded-lg border border-pink-300/20 bg-slate-950/70 p-5 shadow-neon backdrop-blur">
        <h3 className="font-display text-xl font-bold text-pink-100 text-glow-pink">存档概览</h3>
        <div className="mt-5 grid gap-3">
          <ScoreCard label="已通关" value={`${saveData.completedLevels.length} / ${LEVELS.length}`} tone="cyan" />
          <ScoreCard label="最高分" value={saveData.highestScore} tone="pink" />
          <ScoreCard label="已解锁皮肤" value={`${unlockedSkinCount} / ${SKINS.length}`} tone="cyan" />
        </div>
      </div>
    </section>
  );
}

function LevelSelect({ saveData, onStart }) {
  return (
    <section className="rounded-lg border border-cyan-300/25 bg-slate-950/70 p-5 shadow-neon backdrop-blur">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">12 Levels</p>
          <h2 className="font-display text-3xl font-black text-cyan-100">关卡选择</h2>
        </div>
        <p className="text-sm text-slate-300">线性解锁，通关后开放下一关。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LEVELS.map((level) => {
          const status = getLevelStatus(level, saveData);
          const isLocked = status === '未解锁';
          const rewardSkin = SKINS.find((skin) => skin.id === level.rewardSkinId);

          return (
            <article
              key={level.id}
              className={`rounded-lg border bg-slate-950/74 p-4 ${
                isLocked ? 'border-slate-700/80 opacity-60' : 'border-cyan-300/30 shadow-neon'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-pink-200">第 {level.id} 关</p>
                  <h3 className="font-display text-xl font-bold text-cyan-100">{level.name}</h3>
                </div>
                <span className="rounded border border-white/15 px-2 py-1 text-xs text-slate-200">{status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                <InfoLine label="目标" value={`${level.targetFood} 个食物`} />
                <InfoLine label="速度" value={`${level.speed}ms`} />
                <InfoLine label="障碍" value={`${level.obstacleCount} 个`} />
                <InfoLine label="难度" value={level.difficulty} />
              </div>
              <p className="mt-4 text-sm text-slate-300">奖励皮肤：{rewardSkin?.name}</p>
              <button
                type="button"
                onClick={() => onStart(level.id)}
                disabled={isLocked}
                className="mt-4 w-full rounded-md border border-cyan-200/70 bg-cyan-300 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isLocked ? '未解锁' : '挑战'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SkinBackpack({ saveData, selectedSkin, onUseSkin }) {
  return (
    <section className="rounded-lg border border-pink-300/25 bg-slate-950/70 p-5 shadow-neon backdrop-blur">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-200/80">Inventory</p>
          <h2 className="font-display text-3xl font-black text-pink-100 text-glow-pink">皮肤背包</h2>
        </div>
        <p className="text-lg font-bold text-cyan-100">皮肤收集：{saveData.unlockedSkins.length} / {SKINS.length}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SKINS.map((skin) => {
          const isOwned = saveData.unlockedSkins.includes(skin.id);
          const isSelected = selectedSkin.id === skin.id;

          return (
            <article
              key={skin.id}
              className={`rounded-lg border bg-slate-950/76 p-4 ${
                isSelected
                  ? 'border-cyan-200 shadow-neon'
                  : isOwned
                    ? 'border-cyan-300/35'
                    : 'border-slate-700/80 opacity-75'
              }`}
            >
              <SkinPreview skin={skin} locked={!isOwned} />
              <h3 className="mt-4 font-display text-lg font-bold text-slate-100">{skin.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-slate-400">{skin.unlockText}</p>
              <p className={`mt-3 text-sm font-bold ${isOwned ? 'text-cyan-200' : 'text-slate-500'}`}>
                {isSelected ? '当前使用' : isOwned ? '已拥有' : '未解锁'}
              </p>
              <button
                type="button"
                onClick={() => onUseSkin(skin.id)}
                disabled={!isOwned || isSelected}
                className="mt-3 w-full rounded-md border border-pink-200/70 bg-pink-300 px-4 py-2 font-bold text-slate-950 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isSelected ? '使用中' : isOwned ? '使用' : '未获得'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function GameView({
  activeLevel,
  snake,
  food,
  obstacles,
  snakeCells,
  obstacleCells,
  selectedSkin,
  score,
  highestScore,
  foodProgress,
  gameState,
  rewardSkin,
  rewardStatus,
  unlockedSkinCount,
  onPause,
  onRetry,
  onLevels,
  onSkins,
  onMenu,
  onNext,
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
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
            const isObstacle = obstacleCells.has(`${x},${y}`);
            const rainbowHue = (x * 18 + y * 9) % 360;
            const bodyColor = selectedSkin.id === 'rainbow' ? `hsl(${rainbowHue} 90% 58%)` : selectedSkin.colors.body;

            return (
              <div key={`${x}-${y}`} className="relative aspect-square p-[10%]">
                {isObstacle && <div className="h-full w-full rounded-[0.12rem] bg-slate-700 shadow-[0_0_12px_rgba(148,163,184,0.55)] ring-1 ring-slate-400/50" />}
                {isSnake && (
                  <div
                    className="h-full w-full rounded-[0.18rem]"
                    style={{
                      background: isHead ? selectedSkin.colors.head : bodyColor,
                      boxShadow: `0 0 10px ${selectedSkin.colors.glow}, 0 0 22px ${selectedSkin.colors.glow}`,
                    }}
                  />
                )}
                {isFood && (
                  <div className="h-full w-full rounded-full bg-pink-400 text-pink-400 shadow-cell ring-2 ring-pink-100/70" />
                )}
              </div>
            );
          })}
        </div>

        {gameState === 'paused' && (
          <Overlay>
            <h2 className="font-display text-4xl font-black text-cyan-100 text-glow-cyan">已暂停</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <PrimaryButton onClick={onPause}>继续</PrimaryButton>
              <SecondaryButton onClick={onSkins}>打开皮肤背包</SecondaryButton>
            </div>
          </Overlay>
        )}

        {gameState === 'won' && (
          <Overlay>
            <h2 className="font-display text-4xl font-black text-cyan-100 text-glow-cyan">恭喜通关！</h2>
            <p className="mt-3 text-slate-200">你完成了：第 {activeLevel.id} 关 {activeLevel.name}</p>
            <p className="mt-1 text-slate-200">目标进度：{activeLevel.targetFood} / {activeLevel.targetFood}</p>
            <div className="mx-auto mt-5 max-w-56">
              <SkinPreview skin={rewardSkin} locked={false} />
            </div>
            <p className="mt-4 text-lg font-bold text-pink-100">
              {rewardStatus === 'owned' ? '该皮肤已获得' : `获得新皮肤：${rewardSkin.name}`}
            </p>
            <p className="mt-1 text-sm text-slate-300">当前皮肤收集：{unlockedSkinCount} / {SKINS.length}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <PrimaryButton onClick={onNext}>下一关</PrimaryButton>
              <SecondaryButton onClick={onSkins}>打开皮肤背包</SecondaryButton>
              <SecondaryButton onClick={onMenu}>回到主页</SecondaryButton>
            </div>
          </Overlay>
        )}

        {gameState === 'lost' && (
          <Overlay>
            <h2 className="font-display text-4xl font-black text-pink-100 text-glow-pink">挑战失败</h2>
            <p className="mt-3 text-slate-200">当前关卡：第 {activeLevel.id} 关</p>
            <p className="mt-1 text-slate-200">进度：{foodProgress} / {activeLevel.targetFood}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <PrimaryButton onClick={onRetry}>重新挑战</PrimaryButton>
              <SecondaryButton onClick={onLevels}>返回关卡选择</SecondaryButton>
              <SecondaryButton onClick={onSkins}>打开皮肤背包</SecondaryButton>
            </div>
          </Overlay>
        )}
      </div>

      <aside className="rounded-lg border border-pink-300/20 bg-slate-950/68 p-5 shadow-neon backdrop-blur">
        <h2 className="font-display text-xl font-bold text-pink-100 text-glow-pink">
          第 {activeLevel.id} 关｜{activeLevel.name}
        </h2>
        <div className="mt-5 grid gap-3">
          <ScoreCard label="目标进度" value={`${foodProgress} / ${activeLevel.targetFood}`} tone="cyan" />
          <ScoreCard label="当前分数" value={score} tone="pink" />
          <ScoreCard label="最高分" value={highestScore} tone="cyan" />
        </div>
        <div className="mt-5 rounded-md border border-cyan-300/20 bg-slate-900/70 p-3">
          <p className="text-xs text-slate-400">当前皮肤</p>
          <p className="font-bold text-cyan-100">{selectedSkin.name}</p>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <SecondaryButton onClick={onPause}>{gameState === 'paused' ? '继续' : '暂停'}</SecondaryButton>
          <SecondaryButton onClick={onSkins}>打开皮肤背包</SecondaryButton>
          <SecondaryButton onClick={onLevels}>关卡选择</SecondaryButton>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-300">
          方向键移动，空格暂停。撞墙、撞到自己或障碍物会失败；吃满目标食物后通关。
        </p>
      </aside>
    </section>
  );
}

function SkinPreview({ skin, locked }) {
  const segments = [0, 1, 2, 3, 4];
  return (
    <div className={`relative h-24 rounded-md border bg-slate-900/80 p-4 ${locked ? 'border-slate-700' : 'border-cyan-300/35'}`}>
      <div className="flex h-full items-center justify-center gap-1">
        {segments.map((segment) => (
          <span
            key={segment}
            className="block h-8 w-8 rounded-[0.3rem]"
            style={{
              background: locked ? '#050816' : segment === 0 ? skin.colors.head : skin.colors.body,
              opacity: locked ? 0.72 : 1,
              boxShadow: locked ? 'none' : `0 0 14px ${skin.colors.glow}`,
            }}
          />
        ))}
      </div>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-slate-950/40 text-2xl font-black text-slate-500">
          锁定
        </div>
      )}
    </div>
  );
}

function Overlay({ children }) {
  return (
    <div className="absolute inset-2 flex items-center justify-center rounded-md bg-slate-950/88 p-5 text-center backdrop-blur-sm">
      <div className="max-w-xl">{children}</div>
    </div>
  );
}

function ScoreCard({ label, value, tone }) {
  const toneClass = tone === 'pink' ? 'border-pink-300/30 text-pink-200' : 'border-cyan-300/30 text-cyan-200';

  return (
    <div className={`rounded-lg border bg-slate-950/70 px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="font-display text-2xl font-black">{value}</p>
    </div>
  );
}

function StatusPill({ label, value }) {
  return (
    <div className="rounded-md border border-cyan-300/25 bg-slate-900/70 px-3 py-2">
      <p className="text-[0.7rem] text-slate-400">{label}</p>
      <p className="text-sm font-bold text-cyan-100">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-900/60 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-100">{value}</p>
    </div>
  );
}

function NavButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-cyan-200/40 bg-slate-900 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-100 hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-cyan-200/80 bg-cyan-300 px-5 py-3 font-bold text-slate-950 shadow-neon transition hover:bg-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-200/40"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-pink-200/45 bg-slate-900 px-5 py-3 font-bold text-pink-100 transition hover:border-pink-100 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-pink-200/20"
    >
      {children}
    </button>
  );
}
