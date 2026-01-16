'use client'

import { useState, useRef } from 'react'

export default function Toolbar({
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
  clearCanvas,
  onUndo,
  onRedo,
  isMusicPlaying,
  setIsMusicPlaying,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const deleteBtnRef = useRef(null)

  const tools = [
    { id: 'brush', label: 'Brush (B)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" /></svg> },
    { id: 'pencil', label: 'Pencil (P)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21.03 2.97a3.578 3.578 0 010 5.06L9.062 20a4.5 4.5 0 01-1.632 1.068l-4.5 1.5a.75.75 0 01-.944-.948l1.5-4.5A4.5 4.5 0 014.5 15.44L16.47 3.47a3.578 3.578 0 015.06-.5z" /></svg> },
    { id: 'eraser', label: 'Eraser (E)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" clipRule="evenodd" /></svg> },
    { id: 'spray', label: 'Spray (S)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><circle cx="12" cy="4" r="1.5"/><circle cx="8" cy="6" r="1"/><circle cx="16" cy="6" r="1"/><circle cx="6" cy="9" r="1.5"/><circle cx="18" cy="9" r="1.5"/><circle cx="10" cy="8" r="1"/><circle cx="14" cy="8" r="1"/><circle cx="12" cy="11" r="1.5"/><path d="M8 14h8v7a2 2 0 01-2 2h-4a2 2 0 01-2-2v-7z"/></svg> },
    { id: 'bucket', label: 'Fill (F)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" /><path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" /><path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25a.75.75 0 00.712 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134 0z" /></svg> },
    { id: 'eyedropper', label: 'Eyedropper (I)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.5 2.5a3.5 3.5 0 00-5 0L11 5l-.5-.5a1 1 0 00-1.4 0l-.6.6a1 1 0 000 1.4l.5.5-6.5 6.5a2 2 0 00-.5.9l-1 4a1 1 0 001.2 1.2l4-1c.3-.1.7-.3.9-.5l6.5-6.5.5.5a1 1 0 001.4 0l.6-.6a1 1 0 000-1.4L16 9.5l2.5-2.5a3.5 3.5 0 000-5z"/></svg> },
    { id: 'line', label: 'Line (L)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M20.53 3.47a.75.75 0 010 1.06l-17 17a.75.75 0 01-1.06-1.06l17-17a.75.75 0 011.06 0z" clipRule="evenodd" /></svg> },
    { id: 'rectangle', label: 'Rectangle', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 5.25a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25zm2.25-.75a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H5.25z" clipRule="evenodd" /></svg> },
    { id: 'circle', label: 'Circle', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-8.25 9.75a8.25 8.25 0 1116.5 0 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" /></svg> },
    { id: 'triangle', label: 'Triangle', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 3L2 21h20L12 3zm0 4l6.5 12h-13L12 7z"/></svg> },
    { id: 'star', label: 'Star', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4L12 17l-6.3 4.4 2.3-7.4-6-4.6h7.6z"/></svg> },
    { id: 'calligraphy', label: 'Calligraphy (C)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/><path d="M5 19c0 .55.45 1 1 1h2l8-8-3-3-8 8v2z" opacity="0.5"/></svg> },
    { id: 'marker', label: 'Marker (M)', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.5 1.5L21 4l-9 9-2.5-2.5 9-9zM3 18l6-6 2.5 2.5L6 20H3v-2z"/><rect x="4" y="18" width="8" height="3" rx="1" opacity="0.6"/></svg> },
  ]

  return (
    <>
    <div 
      className="fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto flex flex-row items-center gap-4 p-3 bg-white/90 backdrop-blur-md shadow-xl rounded-2xl z-20 overflow-x-auto border border-gray-200 max-w-[95vw]"
      role="toolbar"
      aria-label="Drawing tools"
    >
      {/* Brush Color */}
      <div className="flex flex-col items-center min-w-[40px]">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm hover:scale-110 transition-transform">
          <input
            id="brushColor"
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
            aria-label="Brush Color"
          />
        </div>
      </div>

      <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

      {/* Tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setCurrentTool(tool.id)}
            className={`p-2 rounded-xl transition-all ${
              currentTool === tool.id 
                ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500' 
                : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title={tool.label}
            aria-label={tool.label}
            aria-pressed={currentTool === tool.id}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

      {/* Brush Size */}
      <div className="flex flex-col items-center min-w-[80px]">
        <label htmlFor="brushSize" className="text-[10px] text-gray-400 font-medium mb-1">Size</label>
        <input
          id="brushSize"
          type="range"
          min="1"
          max="60"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-20 accent-amber-500 h-1"
          aria-label="Brush Size"
        />
      </div>

      {/* Brush Opacity */}
      <div className="flex flex-col items-center min-w-[80px]">
        <label htmlFor="brushOpacity" className="text-[10px] text-gray-400 font-medium mb-1">Opacity</label>
        <input
          id="brushOpacity"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={brushOpacity}
          onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
          className="w-20 accent-amber-500 h-1"
          aria-label="Brush Opacity"
        />
      </div>

      <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

      {/* Brush Style */}
      <div className="flex flex-col items-center">
        <select
          id="brushStyle"
          value={brushStyle}
          onChange={(e) => setBrushStyle(e.target.value)}
          className="p-1.5 text-xs rounded-lg text-gray-600 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Brush Style"
        >
          <option value="solid">Solid</option>
          <option value="dotted">Dotted</option>
          <option value="dashed">Dashed</option>
          <option value="glow">Neon Glow</option>
          <option value="square">Square</option>
        </select>
      </div>

      <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

      <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          className="p-2 rounded-xl bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
          title="Undo"
          aria-label="Undo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={onRedo}
          className="p-2 rounded-xl bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
          title="Redo"
          aria-label="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M14.47 2.47a.75.75 0 000 1.06l4.72 4.72H9a6.75 6.75 0 000 13.5h3a.75.75 0 000-1.5H9a5.25 5.25 0 110-10.5h10.19l-4.72 4.72a.75.75 0 101.06 1.06l6-6a.75.75 0 000-1.06l-6-6a.75.75 0 00-1.06 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

      <button
        onClick={() => setIsMusicPlaying(!isMusicPlaying)}
        className={`p-2 rounded-xl transition-all ${isMusicPlaying ? 'bg-indigo-100 text-indigo-600' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
        title={isMusicPlaying ? "Pause Music" : "Play Music"}
      >
        {isMusicPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M19.95 2.112a3 3 0 00-3.097-.65L5.157 4.433A3 3 0 003 7.252V16.5a3 3 0 003 3 2.25 2.25 0 104.5 0v-5.53a3 3 0 00-3-3 2.25 2.25 0 10-4.5 0 3 3 0 002.595 2.972V7.252a1.5 1.5 0 011.079-1.41l11.7-2.97a1.5 1.5 0 011.876 1.454v7.557a3 3 0 00-3 3 2.25 2.25 0 104.5 0v-9.77z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

      <button
        ref={deleteBtnRef}
        onClick={() => setShowClearConfirm(!showClearConfirm)}
        className={`p-2 rounded-xl transition-all ${showClearConfirm ? 'bg-red-100 text-red-600' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
        title="Clear Canvas"
        aria-label="Clear Canvas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
        </svg>
      </button>
    </div>

    {showClearConfirm && (
      <div 
        className="fixed z-50 p-2 bg-white rounded-xl shadow-xl border border-gray-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          top: deleteBtnRef.current ? deleteBtnRef.current.getBoundingClientRect().bottom + 12 : 'auto',
          left: deleteBtnRef.current ? deleteBtnRef.current.getBoundingClientRect().right - 120 : 'auto',
        }}
      >
        <span className="text-xs font-medium text-gray-600 whitespace-nowrap pl-1">Clear all?</span>
        <button
          onClick={() => { clearCanvas(); setShowClearConfirm(false) }}
          className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="Confirm Clear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => setShowClearConfirm(false)}
          className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          title="Cancel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    )}
    </>
  )
}
