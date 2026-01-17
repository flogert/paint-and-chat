'use client'

import { useState, useEffect, useRef } from 'react'
import sounds from '@/lib/sounds'
import { SHOP_ITEMS } from '@/lib/shopItems'
import GuideOverlay from './GuideOverlay'

const ALL_PROMPTS = [
  "A penguin ordering coffee", "A cat interviewing for a job", "A dog driving a sports car",
  "A bear doing stand-up comedy", "A monkey solving a Rubik's cube", "A giraffe in an elevator",
  "A hippo doing ballet", "A koala working from home", "An elephant at pottery class",
  "A fox hosting a cooking show", "A raccoon as a bank teller", "A flamingo teaching yoga",
  "A brave little muffin exploring", "A sushi roll's bachelor party", "A pizza slice on a diet",
  "A hot dog at vegetarian convention", "A croissant learning martial arts", "A grumpy espresso at 5am",
  "A loading bar at 99% forever", "Wifi signal searching for purpose", "A USB trying to plug in",
  "Browser tabs planning an uprising", "A crashed app's final moments", "A cursor waiting impatiently",
  "A dragon with fear of fire", "A unicorn stuck in traffic", "A mermaid at a water park",
  "A centaur buying pants", "A phoenix having bad feather day", "A kraken playing with rubber ducks",
  "A plumber saving a galaxy", "A librarian fighting zombies", "An accountant with superpowers",
  "A grandma with ninja skills", "A goldfish as a lifeguard", "A rubber duck as detective",
  "What Monday morning looks like", "Procrastination as a creature", "The color of jazz music",
  "How stress feels at 2am", "The taste of nostalgia", "What hope looks like waking up",
  "A shark and goldfish roommates", "A cactus and balloon's friendship", "Fire and ice cream hanging out",
  "A civilization inside a backpack", "A city built on a sleeping dog", "A village inside a refrigerator",
  "A clown at a serious meeting", "A mime as a 911 operator", "A vampire as blood bank worker",
  "A tornado at anger management", "A rainbow being colorblind", "Snow in the desert enjoying it",
]

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const CHALLENGE_MODES = [
  { id: 'wronghand', emoji: '✋', name: 'Wrong Hand', desc: 'Use your non-dominant hand' },
  { id: 'oneline', emoji: '〰️', name: 'One Line', desc: 'One continuous line only' },
  { id: 'straight', emoji: '📐', name: 'Straight Only', desc: 'Use only straight lines' },
  { id: 'curves', emoji: '⭕', name: 'Curves Only', desc: 'Use only circles & curves' },
  { id: 'threecolor', emoji: '🎨', name: '3 Colors', desc: 'Max 3 colors allowed' },
  { id: 'spooky', emoji: '👻', name: 'Spooky', desc: 'Make everything spooky' },
  { id: 'cute', emoji: '🥰', name: 'Cute', desc: 'Make everything adorable' },
  { id: 'tiny', emoji: '🔬', name: 'Tiny', desc: 'Draw it super small' },
  { id: 'huge', emoji: '🦖', name: 'HUGE', desc: 'Fill the whole canvas' },
  { id: 'upsidedown', emoji: '🙃', name: 'Upside Down', desc: 'Draw it flipped' },
  { id: 'kid', emoji: '👶', name: 'Kid Mode', desc: 'Draw like a 5-year-old' },
  { id: 'bw', emoji: '⬛', name: 'B&W', desc: 'Black & white only' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', desc: 'Rainbow colors only' },
  { id: 'silly', emoji: '🤪', name: 'Silly', desc: 'As silly as possible' },
]

export default function GameSidebar({ 
  className, 
  roomInfo, 
  coins,
  unlockedItems,
  onPurchase,
  onLeaveRoom, 
  onCopyCode, 
  onStartPong, 
  onStartTron, 
  onStartGalaga, 
  onStartPacman, 
  pongReady, 
  tronReady, 
  galagaReady, 
  pacmanReady,
  onOpenGuide
}) {
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [activeTab, setActiveTab] = useState('play') // 'play' or 'shop'
  
  // Setup Mode State
  const [setupMode, setSetupMode] = useState(null) // 'pong', 'tron'
  
  const [gameMode, setGameMode] = useState('classic')
  const [challengeMode, setChallengeMode] = useState(null)
  const [challengeDropdownOpen, setChallengeDropdownOpen] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  
  const shuffledPromptsRef = useRef(shuffleArray(ALL_PROMPTS))
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setChallengeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const generatePrompt = () => {
    if (shuffledPromptsRef.current.length === 0) {
      shuffledPromptsRef.current = shuffleArray(ALL_PROMPTS)
    }
    const newPrompt = shuffledPromptsRef.current.pop()
    setCurrentPrompt(newPrompt)
    sounds.newPrompt()
    
    if (gameMode === 'speed') setTimeLeft(30)
    else if (gameMode === 'zen') { setTimeLeft(0); setIsActive(true) }
    else if (gameMode === 'blind') setTimeLeft(45)
    else if (gameMode === 'relay') setTimeLeft(20)
    else if (gameMode === 'battle') setTimeLeft(40)
    else if (gameMode === 'backwards') setTimeLeft(10)
    else setTimeLeft(60)
    
    setIsActive(true)
  }
  
  const toggleChallengeMode = (id) => {
    setChallengeMode(prev => prev === id ? null : id)
    setChallengeDropdownOpen(false)
  }
  
  const getActiveChallenge = () => CHALLENGE_MODES.find(c => c.id === challengeMode)
  
  const completeRound = () => {
    const modeScores = { speed: 20, relay: 15, blind: 25, battle: 30, backwards: 35, classic: 10, zen: 5 }
    const challengeBonus = challengeMode ? 10 : 0
    setScore(prev => prev + (modeScores[gameMode] || 10) + challengeBonus)
    setStreak(prev => prev + 1)
    sounds.success()
    if (streak > 0 && (streak + 1) % 3 === 0) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
    generatePrompt()
  }
  
  const skipRound = () => {
    setStreak(0)
    generatePrompt()
  }

  useEffect(() => {
    let interval = null
    if (isActive && timeLeft > 0 && gameMode !== 'zen') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          if (newTime <= 10 && newTime > 0) sounds.tickWarning()
          else if (newTime > 10 && newTime % 10 === 0) sounds.tick()
          if (newTime <= 0) sounds.timerEnd()
          return newTime
        })
      }, 1000)
    } else if (timeLeft === 0 && gameMode !== 'zen' && isActive) {
      setIsActive(false)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, gameMode])

  const showGameGuide = (gameId) => {
    const guides = {
      pong: {
        title: "🏓 Pong Guide",
        content: (
          <div className="space-y-3">
            <p>Classic paddle battle! Don't let the ball pass you.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Controls:</strong> Up/Down Arrows or W/S keys</li>
              <li>First to 10 points wins!</li>
              <li>Tip: Hit the ball with the edge of your paddle for sharp angles.</li>
            </ul>
          </div>
        )
      },
      tron: {
        title: "🏍️ Neon Racer Guide",
        content: (
          <div className="space-y-3">
            <p>Leave a light trail and trap your opponent!</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Controls:</strong> Arrow keys to turn</li>
              <li>Don't hit walls or any light trails (including your own!)</li>
              <li>Last racer surviving wins the round.</li>
            </ul>
          </div>
        )
      },
      galaga: {
        title: "🚀 Space Defender Guide",
        content: (
          <div className="space-y-3">
            <p>Defend the galaxy from alien invaders!</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Move:</strong> Left/Right Arrows</li>
              <li><strong>Shoot:</strong> Spacebar</li>
              <li>Score points by hitting enemies. Watch out for enemy fire!</li>
            </ul>
          </div>
        )
      },
      pacman: {
        title: "👾 Maze Master Guide",
        content: (
          <div className="space-y-3">
            <p>Eat all the pellets in the maze!</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Move:</strong> Arrow keys</li>
              <li>Collect power pellets to eat ghosts!</li>
              <li>Highest score when time runs out wins.</li>
            </ul>
          </div>
        )
      },
      general: {
        title: "ℹ️ Help & Controls",
        content: (
          <div className="space-y-4 text-sm">
             <div>
               <h4 className="font-bold text-amber-600 mb-2">Keyboard Shortcuts</h4>
               <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="bg-stone-50 p-2 rounded"><strong>B</strong> - Brush</div>
                 <div className="bg-stone-50 p-2 rounded"><strong>E</strong> - Eraser</div>
                 <div className="bg-stone-50 p-2 rounded"><strong>P</strong> - Pencil</div>
                 <div className="bg-stone-50 p-2 rounded"><strong>F</strong> - Fill Bucket</div>
                 <div className="bg-stone-50 p-2 rounded"><strong>L</strong> - Line Tool</div>
                 <div className="bg-stone-50 p-2 rounded"><strong>Ctrl+Z</strong> - Undo</div>
               </div>
             </div>
             
             <div>
               <h4 className="font-bold text-amber-600 mb-2">Game Modes</h4>
               <ul className="list-disc pl-5 space-y-1 text-xs text-stone-600">
                  <li><strong>Classic:</strong> Standard 60 second rounds</li>
                  <li><strong>Speed:</strong> Fast-paced 30 second rounds</li>
                  <li><strong>Zen:</strong> No timer, just relax and draw</li>
                  <li><strong>Blind:</strong> The prompt fades away!</li>
               </ul>
             </div>
          </div>
        )
      }
    }
    
    if (guides[gameId] && onOpenGuide) {
      onOpenGuide(guides[gameId])
    }
  }

  return (
    <div className={`${className} flex flex-col z-30`}>
      {/* Room Info Header - Warm Theme */}
      {roomInfo && (
        <div className="px-3 py-2.5 bg-gradient-to-r from-amber-50/90 to-orange-50/70 border-b border-amber-200/60">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onLeaveRoom}
              className="text-[11px] text-stone-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-all flex items-center gap-1 font-medium"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Leave
            </button>
            <button
              onClick={onCopyCode}
              className="font-mono font-bold text-xs bg-white/90 px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 flex items-center gap-1.5 shadow-sm transition-all"
              title="Click to copy room code"
            >
              <span className="text-sm">🔗</span> {roomInfo.roomCode}
            </button>
          </div>
          
          {/* Players List */}
          <div className="flex items-center justify-between bg-white/70 rounded-lg px-2.5 py-1.5">
            <div className="flex items-center gap-1">
              {roomInfo.players?.map((player) => (
                <div
                  key={player.id}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold shadow-sm ${
                    player.side === 'left' 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-400 text-amber-700' 
                      : 'bg-gradient-to-br from-sky-100 to-indigo-100 border-sky-400 text-sky-700'
                  } ${player.name === roomInfo.playerName ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}
                  title={player.name}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
              ))}
              <span className="ml-1.5 text-[10px] text-stone-500 font-medium">{roomInfo.players?.length}/4</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
              roomInfo.side === 'left' 
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' 
                : 'bg-gradient-to-r from-sky-400 to-indigo-400 text-white'
            }`}>
              {roomInfo.side === 'left' ? '🎨 Left' : '🖌️ Right'}
            </span>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="px-3 py-2 border-b border-amber-100/60 bg-white/40 flex gap-1.5 shrink-0">
         <button onClick={() => setActiveTab('play')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'play' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'bg-transparent text-stone-500 hover:bg-stone-100'}`}>
           <span>🎨</span> Play
         </button>
         <button onClick={() => setActiveTab('shop')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'shop' ? 'bg-indigo-100 text-indigo-800 shadow-sm' : 'bg-transparent text-stone-500 hover:bg-stone-100'}`}>
           <span>🛒</span> Shop
         </button>
      </div>
      
      <div className="flex-1 p-2.5 space-y-3 flex flex-col overflow-hidden overflow-y-auto custom-scrollbar">
          {activeTab === 'shop' ? (
              <div className="space-y-3 pb-8">
                 {/* Coins Balance Card */}
                 <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                    <div className="relative z-10 flex flex-col items-center">
                       <div className="text-xs font-bold uppercase opacity-80 mb-1 tracking-wider">💰 Your Balance</div>
                       <div className="text-5xl font-black tracking-tight mt-1">{coins?.toLocaleString() || 0}</div>
                       <p className="text-xs mt-3 bg-white/20 px-4 py-1.5 rounded-full font-medium">Play games to earn coins!</p>
                    </div>
                 </div>

                 {/* Shop Items */}
                 <div className="space-y-2">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">🎨 Brush Effects</h3>
                    {SHOP_ITEMS.map(item => {
                       const owned = unlockedItems.includes(item.id)
                       const afford = (coins || 0) >= item.price
                       return (
                           <div key={item.id} className={`bg-white p-3 rounded-xl border-2 shadow-sm flex items-center gap-3 transition-all ${owned ? 'border-green-200 bg-green-50/50' : 'border-stone-100 hover:border-violet-200 hover:shadow-md'}`}>
                                <div className="w-12 h-12 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl flex items-center justify-center text-2xl border border-stone-200 shadow-inner">{item.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-stone-800">{item.name}</div>
                                    <div className="text-xs text-stone-500 truncate">{item.desc}</div>
                                </div>
                                <button
                                    onClick={() => onPurchase && onPurchase(item.id, item.price)}
                                    disabled={owned || !afford}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                                        owned 
                                            ? 'bg-green-100 text-green-600 border border-green-200' 
                                            : afford 
                                                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 active:scale-95 shadow-md' 
                                                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                    }`}
                                >
                                    {owned ? '✓ Owned' : `🪙 ${item.price}`}
                                </button>
                           </div>
                       )
                    })}
                 </div>
              </div>
          ) : (
            <>
        
        {/* SECTION: STATS */}
        <details className="group" open>
          <summary className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700/80 uppercase tracking-wider px-1 cursor-pointer list-none select-none hover:text-amber-800">
            <span className="text-xs transition-transform group-open:rotate-90">▶</span>
            📊 Stats
          </summary>
          <div className="mt-1.5 flex justify-center gap-2 py-1.5 px-2 bg-white rounded-lg border border-amber-100">
            <div className="text-center">
              <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{score}</div>
              <div className="text-[8px] uppercase text-stone-400 font-bold">Points</div>
            </div>
            <div className="w-px bg-stone-100"></div>
            <div className="text-center">
              <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 flex items-center gap-0.5">
                🔥 {streak}
              </div>
              <div className="text-[8px] uppercase text-stone-400 font-bold">Streak</div>
            </div>
            {showConfetti && <span className="text-base animate-bounce">🎉</span>}
          </div>
        </details>

        {/* SECTION: DRAWING MODES */}
        <details className="group" open>
          <summary className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700/80 uppercase tracking-wider px-1 cursor-pointer list-none select-none hover:text-amber-800">
            <span className="text-xs transition-transform group-open:rotate-90">▶</span>
            🎯 Game Modes
          </summary>
          <div className="mt-1.5 space-y-1.5">
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'classic', icon: '⏱️', label: 'Classic' }, 
                { id: 'speed', icon: '⚡', label: 'Speed' },
                { id: 'zen', icon: '🧘', label: 'Zen' }, 
                { id: 'blind', icon: '🙈', label: 'Blind' },
                { id: 'relay', icon: '🏃', label: 'Relay' }, 
                { id: 'battle', icon: '⚔️', label: 'Battle' },
                { id: 'backwards', icon: '⏪', label: 'Rewind' },
              ].map(mode => (
                <button 
                  key={mode.id}
                  onClick={() => setGameMode(mode.id)}
                  className={`py-1 text-sm rounded-lg border transition-all ${
                    gameMode === mode.id 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-400 shadow-sm scale-105' 
                      : 'bg-white border-stone-100 hover:border-amber-300'
                  }`}
                  title={mode.label}
                >
                  {mode.icon}
                </button>
              ))}
            </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setChallengeDropdownOpen(!challengeDropdownOpen)}
              className={`w-full py-1.5 px-2 text-[11px] rounded-lg border-2 transition-all flex items-center justify-between ${
                challengeMode 
                  ? 'bg-indigo-100 border-indigo-400 text-indigo-700' 
                  : 'bg-white border-indigo-200 text-indigo-600 hover:border-indigo-300'
              }`}
            >
              <span className="flex items-center gap-1">
                🎯 {challengeMode ? `${getActiveChallenge()?.emoji} ${getActiveChallenge()?.name}` : 'Challenge'}
              </span>
              <span className="text-[9px]">{challengeDropdownOpen ? '▲' : '▼'}</span>
            </button>
            
            {challengeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border-2 border-indigo-200 shadow-xl z-50 max-h-40 overflow-y-auto">
                <button
                  onClick={() => { setChallengeMode(null); setChallengeDropdownOpen(false) }}
                  className="w-full py-1.5 px-2 text-[10px] text-left hover:bg-stone-50 text-stone-500 border-b border-stone-100"
                >
                  ❌ None
                </button>
                {CHALLENGE_MODES.map(challenge => (
                  <button
                    key={challenge.id}
                    onClick={() => toggleChallengeMode(challenge.id)}
                    className={`w-full py-1.5 px-2 text-[10px] text-left hover:bg-indigo-50 flex items-center gap-1 ${
                      challengeMode === challenge.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-stone-700'
                    }`}
                  >
                    <span>{challenge.emoji}</span>
                    <span>{challenge.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </details>

        {/* SECTION: ROUND */}
        <div className="space-y-1.5">
           <h3 className="text-[10px] font-bold text-amber-800/70 uppercase tracking-wider px-1 flex items-center gap-1">
             ✏️ Current Round
           </h3>
           <div className={`p-2 bg-gradient-to-br from-white to-amber-50/50 rounded-lg border border-amber-200/50 shadow-sm ${gameMode === 'blind' && isActive ? 'blur-lg select-none' : ''}`}>
            <p className="text-sm font-bold text-stone-800 text-center leading-tight min-h-[1.75rem] flex items-center justify-center">
              {currentPrompt || "🎨 Press Start!"}
            </p>
            {challengeMode && isActive && (
              <div className="mt-1 pt-1 border-t border-amber-200/50 text-center">
                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                  {getActiveChallenge()?.emoji} {getActiveChallenge()?.desc}
                </span>
              </div>
            )}
          </div>

          {/* Timer */}
          {isActive && gameMode !== 'zen' && (
            <div className={`text-2xl font-black tabular-nums text-center py-1 rounded-lg ${
              timeLeft < 10 ? 'text-red-500 animate-pulse bg-red-50' 
              : timeLeft < 20 ? 'text-orange-500 bg-orange-50' 
              : 'text-amber-500 bg-amber-50/50'
            }`}>
              ⏱️ {timeLeft}s
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1">
            <button 
              onClick={generatePrompt}
              className="flex-1 py-1.5 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold shadow-md text-xs flex items-center justify-center gap-1"
            >
              🎲 {currentPrompt ? "New" : "Start!"}
            </button>
            {isActive && (
              <>
                <button 
                  onClick={completeRound}
                  className="py-1.5 px-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow text-xs"
                  title="Done!"
                >
                  ✓
                </button>
                <button 
                  onClick={skipRound}
                  className="py-1.5 px-2 bg-stone-300 hover:bg-stone-400 text-stone-600 rounded-lg font-bold text-xs"
                  title="Skip"
                >
                  ⏭️
                </button>
              </>
            )}
          </div>
        </div>

        {/* SECTION: MINIGAMES */}
        <details className="group" open>
          <summary className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700/80 uppercase tracking-wider px-1 cursor-pointer list-none select-none hover:text-amber-800">
            <span className="text-xs transition-transform group-open:rotate-90">▶</span>
            🕹️ Minigames
          </summary>
          
          <div className="mt-1.5 p-1.5 bg-stone-50/50 rounded-lg border border-stone-100">
            {setupMode ? (
               <div className="bg-white rounded-lg p-1.5 border border-indigo-100 shadow-sm animate-fade-in relative">
                  <button 
                    onClick={() => setSetupMode(null)} 
                    className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 text-xs"
                  >
                    ×
                  </button>
                  <div className="text-center mb-1.5">
                     <h3 className="font-bold text-indigo-900 text-[10px] flex items-center justify-center gap-1">
                        {setupMode === 'pong' ? '🏓 Pong' : setupMode === 'tron' ? '🏍️ Neon' : setupMode === 'galaga' ? '🚀 Space' : '👾 Maze'}
                     </h3>
                     <p className="text-[8px] text-stone-500 leading-tight">
                        {setupMode === 'pong' ? 'Draw paddle ↑' : 
                         setupMode === 'tron' ? 'Draw racer' : 
                         setupMode === 'galaga' ? 'Draw ship ↑' : 
                         'Draw character'}
                     </p>
                  </div>
                  
                  <button
                    onClick={() => {
                       if (setupMode === 'pong') onStartPong()
                       else if (setupMode === 'tron') onStartTron()
                       else if (setupMode === 'galaga') onStartGalaga()
                       else onStartPacman()
                    }}
                    disabled={setupMode === 'pong' ? pongReady : setupMode === 'tron' ? tronReady : setupMode === 'galaga' ? galagaReady : pacmanReady}
                    className={`w-full py-1.5 rounded font-bold text-[9px] transition-all ${
                        (setupMode === 'pong' ? pongReady : setupMode === 'tron' ? tronReady : setupMode === 'galaga' ? galagaReady : pacmanReady)
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                     {(setupMode === 'pong' ? pongReady : setupMode === 'tron' ? tronReady : setupMode === 'galaga' ? galagaReady : pacmanReady) ? '✓ Waiting...' : 'Ready!'}
                  </button>
               </div>
            ) : (
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'pong', icon: '🏓', label: 'Pong', color: 'text-pink-600', bg: 'bg-pink-50 hover:bg-pink-100', border: 'border-pink-200' },
                  { id: 'tron', icon: '🏍️', label: 'Neon', color: 'text-cyan-600', bg: 'bg-cyan-50 hover:bg-cyan-100', border: 'border-cyan-200' },
                  { id: 'galaga', icon: '🚀', label: 'Space', color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-200' },
                  { id: 'pacman', icon: '👾', label: 'Maze', color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-200' }
                ].map(game => (
                  <div key={game.id} className="relative group">
                    <button
                      disabled={roomInfo?.players?.length < 2}
                      onClick={() => setSetupMode(game.id)}
                      className={`
                        w-full py-1 px-1 rounded-lg border transition-all
                        flex flex-col items-center justify-center
                        ${roomInfo?.players?.length < 2 
                          ? 'bg-stone-50 border-stone-100 opacity-50 cursor-not-allowed grayscale' 
                          : `${game.bg} ${game.border} hover:scale-105`
                        }
                      `}
                    >
                      <span className="text-sm">{game.icon}</span>
                      <span className={`text-[7px] font-bold ${roomInfo?.players?.length < 2 ? 'text-stone-400' : game.color}`}>{game.label}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); showGameGuide(game.id) }}
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-stone-200 text-stone-600 rounded-full text-[7px] flex items-center justify-center hover:bg-stone-300 font-bold shadow-sm z-10"
                      title="How to play"
                    >
                      ?
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>

        {/* Help Button */}
        <button 
           onClick={() => showGameGuide('general')}
           className="mt-auto flex items-center justify-center gap-1.5 text-[11px] font-medium text-stone-400 hover:text-amber-600 hover:bg-amber-50 py-2 rounded-lg transition-all border border-transparent hover:border-amber-200"
        >
           <span>ℹ️</span> Help & Shortcuts
        </button>
        </>
      )}
      </div>
    </div>
  )
}
