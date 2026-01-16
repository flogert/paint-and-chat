'use client'

import { useState } from 'react'

export default function MiniToolbar({
  side, // 'left' | 'right'
  unlockedItems = [], // New prop
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  brushStyle,
  setBrushStyle,
  brushOpacity,
  setBrushOpacity,
  currentTool,
  setCurrentTool,
  onClear,
  onUndo,
  onRedo,
  onSave,
  onSaveAll,
  wobblyMode,
  setWobblyMode,
  randomColorMode,
  setRandomColorMode,
  mirrorMode,
  setMirrorMode,
  glowMode,
  setGlowMode,
  scatterMode,
  setScatterMode,
  neonMode,
  setNeonMode,
  discoMode,
  setDiscoMode,
  gravityMode,
  setGravityMode,
  zigzagMode,
  setZigzagMode,
  pixelMode,
  setPixelMode,
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const playerLabel = side === 'left' ? 'Left' : 'Right'
  const playerEmoji = side === 'left' ? '🎨' : '🖌️'

  // Expanded toolset with shapes, spray, eyedropper, etc.
  const tools = [
    { id: 'brush', label: 'Brush', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
      </svg>
    )},
    { id: 'pencil', label: 'Pencil', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M21.03 2.97a3.578 3.578 0 010 5.06L9.062 20a3.75 3.75 0 01-1.71.994l-4.5 1.125a.75.75 0 01-.91-.91l1.125-4.5a3.75 3.75 0 01.994-1.71L16.97 2.97a3.578 3.578 0 015.06 0z" />
      </svg>
    )},
    { id: 'spray', label: 'Spray', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zM5.636 5.636a1 1 0 011.414 0l1.414 1.414a1 1 0 01-1.414 1.414L5.636 7.05a1 1 0 010-1.414zm12.728 0a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 0zM12 8a4 4 0 100 8 4 4 0 000-8zm-8 4a1 1 0 011-1h2a1 1 0 110 2H5a1 1 0 01-1-1zm14 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm-6.536 5.536a1 1 0 011.414 0l1.414 1.414a1 1 0 01-1.414 1.414l-1.414-1.414a1 1 0 010-1.414zm-4.242 0a1 1 0 010 1.414L5.636 18.364a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 0zM12 17a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" />
      </svg>
    )},
    { id: 'eraser', label: 'Eraser', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M5.433 13.917l-1.262 1.262a1 1 0 000 1.414l3.536 3.536a1 1 0 001.414 0l1.262-1.262-4.95-4.95zm1.414-1.414l4.95 4.95 7.778-7.778-4.95-4.95-7.778 7.778zm11.314-5.657l1.414-1.414a2 2 0 00-2.828-2.828L15.333 4.02l4.828 4.826z" />
      </svg>
    )},
    { id: 'bucket', label: 'Fill Bucket', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.293 8.293l-5-5a1 1 0 00-1.414 0l-9 9a1 1 0 000 1.414l5 5a1 1 0 001.414 0l9-9a1 1 0 000-1.414zM9 19.586L4.414 15 12 7.414 16.586 12 9 19.586z" />
        <path d="M20 14s-2 2.5-2 4a2 2 0 104 0c0-1.5-2-4-2-4z" />
      </svg>
    )},
    { id: 'line', label: 'Line', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M20.53 3.47a.75.75 0 010 1.06l-17 17a.75.75 0 01-1.06-1.06l17-17a.75.75 0 011.06 0z" clipRule="evenodd" />
      </svg>
    )},
    { id: 'rectangle', label: 'Rectangle', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <rect x="3" y="5" width="18" height="14" rx="2" />
      </svg>
    )},
    { id: 'circle', label: 'Circle', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <circle cx="12" cy="12" r="9" />
      </svg>
    )},
    { id: 'triangle', label: 'Triangle', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 3L2 21h20L12 3z" />
      </svg>
    )},
    { id: 'star', label: 'Star', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
      </svg>
    )},
    { id: 'eyedropper', label: 'Eyedropper', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M16.098 2.598a3.75 3.75 0 113.622 6.275l-1.72.46V12a.75.75 0 01-.22.53l-.5.5a.75.75 0 01-1.06 0L13.5 10.31l-6.22 6.22A1.5 1.5 0 016.22 18H3.75a.75.75 0 01-.75-.75v-2.47a1.5 1.5 0 01.44-1.06l6.22-6.22L6.94 4.78a.75.75 0 010-1.06l.5-.5A.75.75 0 018 3h2.666l.46-1.72a3.75 3.75 0 014.972 1.318z" clipRule="evenodd" />
      </svg>
    )},
  ]

  const quickColors = [
    '#000000', '#ffffff', '#ff0000', '#ff6b35', '#ffd700', 
    '#00ff00', '#00bfff', '#0000ff', '#8b00ff', '#ff69b4'
  ]

  // Enhanced player-specific theming
  const bgClasses = side === 'left'
    ? 'bg-gradient-to-r from-amber-50/95 via-orange-50/95 to-amber-50/95' 
    : 'bg-gradient-to-r from-sky-50/95 via-indigo-50/95 to-sky-50/95'

  const accentClasses = side === 'left'
    ? { active: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md', hover: 'hover:bg-amber-100' }
    : { active: 'bg-gradient-to-r from-sky-400 to-indigo-400 text-white shadow-md', hover: 'hover:bg-sky-100' }

  const labelColor = side === 'left' ? 'text-amber-700' : 'text-sky-700'
  const borderAccent = side === 'left' ? 'border-amber-300' : 'border-sky-300'
  const playerGradient = side === 'left' 
    ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
    : 'bg-gradient-to-r from-sky-500 to-indigo-500'

  return (
    <div 
      className={`absolute top-0 ${side === 'left' ? 'left-0 w-1/2 rounded-br-2xl border-r-2' : 'right-0 w-1/2 rounded-bl-2xl border-l-2'} z-20 border-b-2 ${borderAccent} shadow-lg backdrop-blur-md transition-all duration-300 ${bgClasses}`}
      role="toolbar"
      aria-label={`${playerLabel} Toolbar`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        {/* Left section: Player label + collapse */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-sm ${playerGradient} text-white shadow-md hover:shadow-lg transition-all`}
            title={isExpanded ? 'Collapse toolbar' : 'Expand toolbar'}
          >
            <span className="text-base">{playerEmoji}</span>
            <span className="hidden sm:inline">{playerLabel}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : 'rotate-180'}`}>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-1">
          <button onClick={onUndo} className="p-2 rounded-xl text-stone-500 hover:bg-white/80 hover:text-stone-700 hover:shadow-sm transition-all" title="Undo (Ctrl+Z)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
            </svg>
          </button>
          <button onClick={onRedo} className="p-2 rounded-xl text-stone-500 hover:bg-white/80 hover:text-stone-700 hover:shadow-sm transition-all" title="Redo (Ctrl+Y)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06l4.146 3.958H6.375a5.375 5.375 0 000 10.75H9.25a.75.75 0 000-1.5H6.375a3.875 3.875 0 010-7.75h10.003l-4.146 3.957a.75.75 0 001.036 1.085l5.5-5.25a.75.75 0 000-1.085l-5.5-5.25a.75.75 0 00-1.06.025z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="w-px h-5 bg-stone-300/50 mx-1" />
          <button onClick={onClear} className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all" title="Clear Canvas">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="w-px h-5 bg-stone-300/50 mx-1" />
          <button onClick={onSave} className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm transition-all" title="Save My Side">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
          </button>
          <button onClick={onSaveAll} className="p-2 rounded-xl text-violet-500 hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm transition-all" title="Save Full Canvas">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.515a1.75 1.75 0 01-1.75 1.75h-1.5v-1.5h1.5a.25.25 0 00.25-.25V5.75a.25.25 0 00-.25-.25h-14.5a.25.25 0 00-.25.25v3.5h1.5v1.5h-1.5A1.75 1.75 0 011 8.985V4.75z" clipRule="evenodd" />
              <path d="M6.75 10.25a.75.75 0 00-1.5 0v4.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72v-4.69z" />
              <path d="M14.75 10.25a.75.75 0 00-1.5 0v4.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72v-4.69z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded toolbar content */}
      {isExpanded && (
        <div className="px-3 pb-2 flex flex-wrap items-center gap-3">
          {/* Color section */}
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                title="Pick color"
              />
            </div>
            <div className="flex gap-0.5">
              {quickColors.map(color => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-4 h-4 rounded transition-transform hover:scale-125 ${brushColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''} ${color === '#ffffff' ? 'border border-gray-300' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-gray-300/50" />

          {/* Tools section */}
          <div className="flex items-center gap-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id)}
                className={`p-1.5 rounded-lg transition-all ${
                  currentTool === tool.id 
                    ? accentClasses.active
                    : `text-gray-500 ${accentClasses.hover}`
                }`}
                title={tool.label}
              >
                {tool.icon}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-300/50" />

          {/* Size control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Size</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className={`w-16 h-1.5 rounded-full ${side === 'left' ? 'accent-amber-500' : 'accent-sky-500'}`}
            />
            <span className="text-xs font-mono text-gray-500 w-5">{brushSize}</span>
          </div>

          <div className="w-px h-6 bg-gray-300/50" />

          {/* Opacity control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Opacity</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(Number(e.target.value))}
              className={`w-12 h-1.5 rounded-full ${side === 'left' ? 'accent-amber-500' : 'accent-sky-500'}`}
            />
            <span className="text-xs font-mono text-gray-500 w-6">{Math.round(brushOpacity * 100)}%</span>
          </div>

          {/* Brush style selector */}
          <div className="flex items-center gap-1">
            {['solid', 'dashed', 'dotted'].map(style => (
              <button
                key={style}
                onClick={() => setBrushStyle(style)}
                className={`px-2 py-0.5 text-xs rounded transition-all ${
                  brushStyle === style 
                    ? accentClasses.active
                    : `text-gray-400 ${accentClasses.hover}`
                }`}
                title={`${style} stroke`}
              >
                {style === 'solid' ? '━' : style === 'dashed' ? '┅' : '┈'}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-300/50" />

          {/* Silly mode toggles */}
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { id: 'wobbly', label: '〰️ Wobbly', color: 'bg-purple-200 text-purple-700', active: wobblyMode, set: setWobblyMode },
              { id: 'rainbow', label: '🌈 Rainbow', color: 'bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200 text-gray-700', active: randomColorMode, set: setRandomColorMode },
              { id: 'mirror', label: '🪞 Mirror', color: 'bg-cyan-200 text-cyan-700', active: mirrorMode, set: setMirrorMode },
              { id: 'glow', label: '✨ Glow', color: 'bg-yellow-200 text-yellow-700', active: glowMode, set: setGlowMode },
              { id: 'scatter', label: '💫 Scatter', color: 'bg-green-200 text-green-700', active: scatterMode, set: setScatterMode },
              { id: 'neon', label: '💡 Neon', color: 'bg-pink-200 text-pink-700', active: neonMode, set: setNeonMode },
              { id: 'disco', label: '🪩 Disco', color: 'bg-gradient-to-r from-purple-200 via-pink-200 to-yellow-200 text-gray-700', active: discoMode, set: setDiscoMode },
              { id: 'gravity', label: '💧 Gravity', color: 'bg-blue-200 text-blue-700', active: gravityMode, set: setGravityMode },
              { id: 'zigzag', label: '⚡ Zigzag', color: 'bg-orange-200 text-orange-700', active: zigzagMode, set: setZigzagMode },
              { id: 'pixel', label: '🎮 Pixel', color: 'bg-emerald-200 text-emerald-700', active: pixelMode, set: setPixelMode },
            ].map(tool => {
              const isUnlocked = unlockedItems.includes(tool.id)
              return (
                <button
                  key={tool.id}
                  onClick={() => isUnlocked && tool.set && tool.set(!tool.active)}
                  className={`px-1.5 py-0.5 text-[10px] rounded transition-all flex items-center gap-1 ${
                    !isUnlocked 
                      ? 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
                      : tool.active 
                        ? `${tool.color} shadow-sm animate-pulse`
                        : `text-gray-400 hover:bg-gray-50`
                  }`}
                  title={!isUnlocked ? "Locked! Buy in shop." : tool.label}
                >
                  {tool.label}
                  {!isUnlocked && <span className="text-[8px]">🔒</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}