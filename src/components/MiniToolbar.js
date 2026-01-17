'use client'

import { useState } from 'react'

// Mode descriptions for tooltips
const MODE_INFO = {
  wobbly: { emoji: '〰️', name: 'Wobbly', desc: 'Shake your lines for a fun, wiggly effect' },
  rainbow: { emoji: '🌈', name: 'Rainbow', desc: 'Auto-cycle through rainbow colors' },
  mirror: { emoji: '🪞', name: 'Mirror', desc: 'Draw on both sides simultaneously' },
  glow: { emoji: '✨', name: 'Glow', desc: 'Add a soft glowing aura to strokes' },
  scatter: { emoji: '💫', name: 'Scatter', desc: 'Spray particles around your brush' },
  neon: { emoji: '💡', name: 'Neon', desc: 'Bright neon colors with intense glow' },
  disco: { emoji: '🪩', name: 'Disco', desc: 'Flashing colors with pulsing size' },
  gravity: { emoji: '💧', name: 'Drip', desc: 'Paint drips down like watercolor' },
  zigzag: { emoji: '⚡', name: 'Zigzag', desc: 'Create zigzag lightning patterns' },
  pixel: { emoji: '🎮', name: 'Pixel', desc: 'Retro pixel art style drawing' },
}

// SVG Icon components
const Icons = {
  brush: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
    </svg>
  ),
  pencil: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M21.03 2.97a3.578 3.578 0 010 5.06L9.062 20a3.75 3.75 0 01-1.71.994l-4.5 1.125a.75.75 0 01-.91-.91l1.125-4.5a3.75 3.75 0 01.994-1.71L16.97 2.97a3.578 3.578 0 015.06 0z" />
    </svg>
  ),
  spray: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <circle cx="12" cy="12" r="2"/><circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="8" r="1.5"/><circle cx="8" cy="16" r="1.5"/><circle cx="16" cy="16" r="1.5"/><circle cx="12" cy="6" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="12" cy="18" r="1"/>
    </svg>
  ),
  eraser: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M5.433 13.917l-1.262 1.262a1 1 0 000 1.414l3.536 3.536a1 1 0 001.414 0l1.262-1.262-4.95-4.95zm1.414-1.414l4.95 4.95 7.778-7.778-4.95-4.95-7.778 7.778zm11.314-5.657l1.414-1.414a2 2 0 00-2.828-2.828L15.333 4.02l4.828 4.826z" />
    </svg>
  ),
  bucket: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.293 8.293l-5-5a1 1 0 00-1.414 0l-9 9a1 1 0 000 1.414l5 5a1 1 0 001.414 0l9-9a1 1 0 000-1.414zM9 19.586L4.414 15 12 7.414 16.586 12 9 19.586z" />
      <path d="M20 14s-2 2.5-2 4a2 2 0 104 0c0-1.5-2-4-2-4z" />
    </svg>
  ),
  line: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M20.53 3.47a.75.75 0 010 1.06l-17 17a.75.75 0 01-1.06-1.06l17-17a.75.75 0 011.06 0z" clipRule="evenodd" />
    </svg>
  ),
  rectangle: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  ),
  circle: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  triangle: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 3L2 21h20L12 3z" />
    </svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  ),
  eyedropper: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M16.098 2.598a3.75 3.75 0 113.622 6.275l-1.72.46V12a.75.75 0 01-.22.53l-.5.5a.75.75 0 01-1.06 0L13.5 10.31l-6.22 6.22A1.5 1.5 0 016.22 18H3.75a.75.75 0 01-.75-.75v-2.47a1.5 1.5 0 01.44-1.06l6.22-6.22L6.94 4.78a.75.75 0 010-1.06l.5-.5A.75.75 0 018 3h2.666l.46-1.72a3.75 3.75 0 014.972 1.318z" clipRule="evenodd" />
    </svg>
  ),
  undo: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
    </svg>
  ),
  redo: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06l4.146 3.958H6.375a5.375 5.375 0 000 10.75H9.25a.75.75 0 000-1.5H6.375a3.875 3.875 0 010-7.75h10.003l-4.146 3.957a.75.75 0 001.036 1.085l5.5-5.25a.75.75 0 000-1.085l-5.5-5.25a.75.75 0 00-1.06.025z" clipRule="evenodd" />
    </svg>
  ),
  trash: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  ),
  save: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  ),
  heart: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ),
  chevronDown: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  ),
  sparkles: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
    </svg>
  )
}

// Tooltip component
const Tooltip = ({ children, content, side = 'bottom' }) => {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className={`
        absolute z-50 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded-md 
        opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
        whitespace-nowrap pointer-events-none
        ${side === 'bottom' ? 'top-full mt-1 left-1/2 -translate-x-1/2' : ''}
        ${side === 'top' ? 'bottom-full mb-1 left-1/2 -translate-x-1/2' : ''}
        ${side === 'left' ? 'right-full mr-1 top-1/2 -translate-y-1/2' : ''}
        ${side === 'right' ? 'left-full ml-1 top-1/2 -translate-y-1/2' : ''}
      `}>
        {content}
        <div className={`
          absolute w-2 h-2 bg-gray-900 rotate-45
          ${side === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : ''}
          ${side === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''}
          ${side === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : ''}
          ${side === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : ''}
        `} />
      </div>
    </div>
  )
}

export default function MiniToolbar({
  side, // 'left' | 'right'
  unlockedItems = [],
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
  onSendLove,
}) {
  const [showEffects, setShowEffects] = useState(false)
  const [showShapes, setShowShapes] = useState(false)
  
  const playerLabel = side === 'left' ? 'P1' : 'P2'
  const isLeft = side === 'left'

  const basicTools = [
    { id: 'brush', label: 'Brush', icon: Icons.brush, shortcut: 'B' },
    { id: 'pencil', label: 'Pencil', icon: Icons.pencil, shortcut: 'P' },
    { id: 'spray', label: 'Spray', icon: Icons.spray, shortcut: 'S' },
    { id: 'eraser', label: 'Eraser', icon: Icons.eraser, shortcut: 'E' },
    { id: 'bucket', label: 'Fill', icon: Icons.bucket, shortcut: 'F' },
    { id: 'eyedropper', label: 'Color Picker', icon: Icons.eyedropper, shortcut: 'I' },
  ]

  const shapeTools = [
    { id: 'line', label: 'Line', icon: Icons.line, shortcut: 'L' },
    { id: 'rectangle', label: 'Rectangle', icon: Icons.rectangle, shortcut: 'R' },
    { id: 'circle', label: 'Circle', icon: Icons.circle, shortcut: 'O' },
    { id: 'triangle', label: 'Triangle', icon: Icons.triangle, shortcut: 'T' },
    { id: 'star', label: 'Star', icon: Icons.star, shortcut: 'A' },
  ]

  const quickColors = [
    { color: '#000000', name: 'Black' },
    { color: '#ffffff', name: 'White' },
    { color: '#ef4444', name: 'Red' },
    { color: '#f97316', name: 'Orange' },
    { color: '#eab308', name: 'Yellow' },
    { color: '#22c55e', name: 'Green' },
    { color: '#3b82f6', name: 'Blue' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#78716c', name: 'Gray' },
  ]

  // Theme based on side
  const theme = isLeft 
    ? { 
        bg: 'bg-gradient-to-r from-amber-100/95 to-orange-200/95',
        border: 'border-amber-300/60',
        accent: 'bg-gradient-to-r from-amber-500 to-orange-500',
        accentText: 'text-amber-700',
        activeBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md',
        hoverBtn: 'hover:bg-white/60',
        badge: 'bg-gradient-to-r from-amber-500 to-orange-600',
        slider: 'accent-amber-600',
        section: 'bg-black/5',
        sectionBorder: 'border-amber-300/30'
      }
    : { 
        bg: 'bg-gradient-to-r from-sky-100/95 to-indigo-200/95',
        border: 'border-sky-300/60',
        accent: 'bg-gradient-to-r from-sky-500 to-indigo-500',
        accentText: 'text-sky-700',
        activeBtn: 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md',
        hoverBtn: 'hover:bg-white/60',
        badge: 'bg-gradient-to-r from-sky-500 to-indigo-600',
        slider: 'accent-sky-600',
        section: 'bg-black/5',
        sectionBorder: 'border-sky-300/30'
      }

  const activeEffects = [wobblyMode, randomColorMode, mirrorMode, glowMode, scatterMode, neonMode, discoMode, gravityMode, zigzagMode, pixelMode].filter(Boolean).length
  const currentShapeTool = shapeTools.find(t => t.id === currentTool)

  return (
    <div 
      className={`absolute top-2 h-12 z-50 ${theme.bg} backdrop-blur-md rounded-xl shadow-lg border ${theme.border} select-none flex items-center px-2 gap-2`}
      style={{
        left: isLeft ? '0.5rem' : 'calc(50% + 0.5rem)',
        right: isLeft ? 'calc(50% + 0.5rem)' : '0.5rem',
        minWidth: '500px' // Ensure it doesn't get too squished
      }}
      role="toolbar"
      aria-label={`${playerLabel} Drawing Tools`}
    >
      {/* Player Badge */}
      <div className={`${theme.badge} text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm shrink-0`}>
        {playerLabel}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-stone-300/50 shrink-0" />

      {/* Basic Tools */}
      <div className="flex items-center gap-0.5 shrink-0">
        {basicTools.map((tool) => (
          <Tooltip key={tool.id} content={`${tool.label} (${tool.shortcut})`}>
            <button
              onClick={() => setCurrentTool(tool.id)}
              className={`p-1.5 rounded-md transition-all ${
                currentTool === tool.id 
                  ? theme.activeBtn
                  : `text-gray-600 ${theme.hoverBtn}`
              }`}
            >
              {tool.icon}
            </button>
          </Tooltip>
        ))}
        
        {/* Shapes Dropdown relative */}
        <div className="relative">
          <Tooltip content="Shapes">
            <button
              onClick={() => setShowShapes(!showShapes)}
              className={`p-1.5 rounded-md transition-all flex items-center gap-0.5 ${
                currentShapeTool 
                  ? theme.activeBtn
                  : `text-gray-600 ${theme.hoverBtn}`
              }`}
            >
              {currentShapeTool ? currentShapeTool.icon : Icons.rectangle}
              <span className="text-[10px]">▼</span>
            </button>
          </Tooltip>
          
          {showShapes && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 z-50 animate-fade-in flex gap-1">
                {shapeTools.map((tool) => (
                  <Tooltip key={tool.id} content={`${tool.label} (${tool.shortcut})`} side="bottom">
                    <button
                      onClick={() => {
                        setCurrentTool(tool.id)
                        setShowShapes(false)
                      }}
                      className={`p-1.5 rounded-md transition-all ${
                        currentTool === tool.id 
                          ? theme.activeBtn
                          : `text-gray-600 ${theme.hoverBtn}`
                      }`}
                    >
                      {tool.icon}
                    </button>
                  </Tooltip>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-stone-300/50 shrink-0" />

      {/* Properties Group */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Color Picker */}
        <Tooltip content="Color">
          <div className="relative w-7 h-7 rounded-sm border-2 border-white shadow-sm cursor-pointer ring-1 ring-black/10 hover:ring-black/20 overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundColor: brushColor }} />
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
            />
          </div>
        </Tooltip>

        {/* Size Slider */}
        <div className="flex flex-col w-24 gap-0.5">
           <div className="flex justify-between items-center text-[8px] text-gray-500 font-bold uppercase tracking-wider">
             <span>Size</span>
             <span>{brushSize}</span>
           </div>
           <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className={`w-full h-1.5 ${theme.slider} rounded-full cursor-pointer bg-white/50`}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-stone-300/50 shrink-0" />
      
      {/* Effects Dropdown */}
      <div className="relative shrink-0">
        <Tooltip content="Special Effects">
          <button
            onClick={() => setShowEffects(!showEffects)}
            className={`p-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
              showEffects || activeEffects > 0
                ? `${theme.activeBtn} border-transparent`
                : `bg-white/50 border-gray-200 text-gray-600 hover:bg-white`
            }`}
          >
            {Icons.sparkles}
            {activeEffects > 0 && (
              <span className="text-[10px] font-bold bg-white text-stone-800 px-1 rounded-sm shadow-sm">
                {activeEffects}
              </span>
            )}
          </button>
        </Tooltip>

        {showEffects && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 animate-fade-in">
             <div className="grid grid-cols-5 gap-1">
              {[
                { id: 'wobbly', active: wobblyMode, set: setWobblyMode },
                { id: 'rainbow', active: randomColorMode, set: setRandomColorMode },
                { id: 'mirror', active: mirrorMode, set: setMirrorMode },
                { id: 'glow', active: glowMode, set: setGlowMode },
                { id: 'scatter', active: scatterMode, set: setScatterMode },
                { id: 'neon', active: neonMode, set: setNeonMode },
                { id: 'disco', active: discoMode, set: setDiscoMode },
                { id: 'gravity', active: gravityMode, set: setGravityMode },
                { id: 'zigzag', active: zigzagMode, set: setZigzagMode },
                { id: 'pixel', active: pixelMode, set: setPixelMode },
              ].map(mode => {
                const info = MODE_INFO[mode.id]
                return (
                  <Tooltip key={mode.id} content={`${info.name}`} side="top">
                    <button
                      onClick={() => mode.set && mode.set(!mode.active)}
                      className={`p-1.5 rounded-md text-sm transition-all flex items-center justify-center aspect-square ${
                        mode.active 
                          ? theme.activeBtn
                          : `bg-stone-50 border border-stone-200 hover:border-amber-300 hover:bg-stone-100`
                      }`}
                    >
                      {info.emoji}
                    </button>
                  </Tooltip>
                )
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
               <div className="flex flex-col gap-1">
                 <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase">
                   <span>Opacity</span>
                   <span>{Math.round(brushOpacity * 100)}%</span>
                 </div>
                 <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(Number(e.target.value))}
                  className={`w-full h-1.5 ${theme.slider} rounded-full bg-stone-100`}
                />
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip content="Undo">
            <button onClick={onUndo} className={`p-1.5 rounded-md text-stone-600 ${theme.hoverBtn} opacity-70 hover:opacity-100`}>
              {Icons.undo}
            </button>
          </Tooltip>
          <Tooltip content="Redo">
            <button onClick={onRedo} className={`p-1.5 rounded-md text-stone-600 ${theme.hoverBtn} opacity-70 hover:opacity-100`}>
              {Icons.redo}
            </button>
          </Tooltip>
          <div className="w-px h-4 bg-stone-300/50 mx-1" />
          <Tooltip content="Clear">
            <button onClick={onClear} className="p-1.5 rounded-md text-red-500 hover:bg-red-50">
              {Icons.trash}
            </button>
          </Tooltip>
          <Tooltip content="Save">
            <button onClick={onSave} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50">
              {Icons.save}
            </button>
          </Tooltip>
      </div>
    </div>
  )
}
