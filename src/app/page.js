'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Canvas from '@/components/Canvas'
import MiniToolbar from '@/components/MiniToolbar'
import ChatSidebar from '@/components/ChatSidebar'
import GameSidebar from '@/components/GameSidebar'
import RoomLobby from '@/components/RoomLobby'
import PongGame from '@/components/PongGame'
import GalagaGame from '@/components/GalagaGame'
import TronGame from '@/components/TronGame'
import PacmanGame from '@/components/PacmanGame'
import sounds from '@/lib/sounds'
import gifRecorder from '@/lib/gifRecorder'
import socket from '@/lib/socket'
import CursorOverlay from '@/components/CursorOverlay'
import { SHOP_ITEMS } from '@/lib/shopItems'

export default function Home() {
  // Room state
  const [inRoom, setInRoom] = useState(false)
  const [roomInfo, setRoomInfo] = useState(null) // { roomCode, playerNumber, playerName, players, side }
  const [coins, setCoins] = useState(50) // Start with 50 coins
  const [unlockedItems, setUnlockedItems] = useState(['wobbly']) // First one free

  const handlePurchase = (itemId, price) => {
    if (coins >= price && !unlockedItems.includes(itemId)) {
      setCoins(prev => prev - price)
      setUnlockedItems(prev => [...prev, itemId])
      sounds.success()
    } else {
      sounds.error()
    }
  }

  const handleGameWin = (amount) => {
      setCoins(prev => prev + amount)
      // Visual feedback could be added here
      sounds.success()
  }
  
  // Left player (Player 1) brush settings
  const [leftBrushColor, setLeftBrushColor] = useState('#ff6b35')
  const [leftBrushSize, setLeftBrushSize] = useState(5)
  const [leftBrushStyle, setLeftBrushStyle] = useState('solid')
  const [leftBrushOpacity, setLeftBrushOpacity] = useState(1)
  const [leftCurrentTool, setLeftCurrentTool] = useState('brush')
  const [leftWobblyMode, setLeftWobblyMode] = useState(false)
  const [leftRandomColorMode, setLeftRandomColorMode] = useState(false)
  const [leftMirrorMode, setLeftMirrorMode] = useState(false)
  const [leftGlowMode, setLeftGlowMode] = useState(false)
  const [leftScatterMode, setLeftScatterMode] = useState(false)
  const [leftNeonMode, setLeftNeonMode] = useState(false)
  const [leftDiscoMode, setLeftDiscoMode] = useState(false)
  const [leftGravityMode, setLeftGravityMode] = useState(false)
  const [leftZigzagMode, setLeftZigzagMode] = useState(false)
  const [leftPixelMode, setLeftPixelMode] = useState(false)

  // Right player (Player 2) brush settings
  const [rightBrushColor, setRightBrushColor] = useState('#3b82f6')
  const [rightBrushSize, setRightBrushSize] = useState(5)
  const [rightBrushStyle, setRightBrushStyle] = useState('solid')
  const [rightBrushOpacity, setRightBrushOpacity] = useState(1)
  const [rightCurrentTool, setRightCurrentTool] = useState('brush')
  const [rightWobblyMode, setRightWobblyMode] = useState(false)
  const [rightRandomColorMode, setRightRandomColorMode] = useState(false)
  const [rightMirrorMode, setRightMirrorMode] = useState(false)
  const [rightGlowMode, setRightGlowMode] = useState(false)
  const [rightScatterMode, setRightScatterMode] = useState(false)
  const [rightNeonMode, setRightNeonMode] = useState(false)
  const [rightDiscoMode, setRightDiscoMode] = useState(false)
  const [rightGravityMode, setRightGravityMode] = useState(false)
  const [rightZigzagMode, setRightZigzagMode] = useState(false)
  const [rightPixelMode, setRightPixelMode] = useState(false)

  const [messages, setMessages] = useState([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isGameOpen, setIsGameOpen] = useState(false)
  const [bossMode, setBossMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activePlayer, setActivePlayer] = useState('left') // For keyboard shortcuts
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showRoomCode, setShowRoomCode] = useState(false)
  const [pongActive, setPongActive] = useState(false)
  const [galagaActive, setGalagaActive] = useState(false)
  const [galagaShips, setGalagaShips] = useState({ left: null, right: null })
  const [galagaReady, setGalagaReady] = useState(false)
  
  const [tronActive, setTronActive] = useState(false)
  const [tronReady, setTronReady] = useState(false)
  const [tronImages, setTronImages] = useState({ left: null, right: null })

  const [pacmanActive, setPacmanActive] = useState(false)
  const [pacmanReady, setPacmanReady] = useState(false)
  const [pacmanImages, setPacmanImages] = useState({ left: null, right: null })
  
  const [pongReady, setPongReady] = useState(false)
  const [pongPaddles, setPongPaddles] = useState({ left: null, right: null })

  // Reference to the canvas element for clearing
  const canvasRef = useRef(null)
  const canvasLogicRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const mainContainerRef = useRef(null) // For cursors

  // Handle room events
  useEffect(() => {
    const handlePlayerJoined = (data) => {
      setRoomInfo(prev => prev ? { ...prev, players: data.players } : prev)
      sounds.success()
      // Add system message
      setMessages(prev => [...prev, { sender: '🎮 System', text: `${data.name} joined the room!` }])
    }

    const handlePlayerLeft = (data) => {
      setRoomInfo(prev => prev ? { ...prev, players: data.players } : prev)
      sounds.pop()
      // Add system message
      setMessages(prev => [...prev, { sender: '🎮 System', text: `${data.name} left the room` }])
    }

    // Pong updated events
    const onPongPlayerReady = ({ side }) => {
      setMessages(prev => [...prev, { sender: '🎮 System', text: `${side === 'left' ? 'Left' : 'Right'} player is ready for Pong!` }])
    }

    const onPongStart = ({ leftPaddle, rightPaddle }) => {
      setPongPaddles({ left: leftPaddle, right: rightPaddle })
      setPongActive(true)
      setPongReady(false)
      sounds.success()
    }

    const handlePongEnd = () => {
      setPongActive(false)
    }

    // Tron events
    const onTronPlayerReady = ({ side }) => {
      setMessages(prev => [...prev, { sender: '🎮 System', text: `${side === 'left' ? 'Left' : 'Right'} player is ready for Neon Racers!` }])
    }

    const onTronStart = ({ leftBoat, rightBoat }) => {
      setTronImages({ left: leftBoat, right: rightBoat })
      setTronActive(true)
      setTronReady(false)
      sounds.success()
    }
    
    const onTronDied = ({ side }) => {
       setMessages(prev => [...prev, { sender: '🎮 System', text: `${side === 'left' ? 'Left' : 'Right'} crashed!` }])
       sounds.pop()
    }

    socket.on('playerJoined', handlePlayerJoined)
    socket.on('playerLeft', handlePlayerLeft)
    
    socket.on('pong-player-ready', onPongPlayerReady)
    socket.on('pong-start', onPongStart)
    socket.on('pongEnd', handlePongEnd)

    socket.on('tron-player-ready', onTronPlayerReady)
    socket.on('tron-start', onTronStart)
    socket.on('tron-died', onTronDied)

    // Galaga events
    const onGalagaPlayerReady = ({ side }) => {
      setMessages(prev => [...prev, { sender: '🎮 System', text: `${side === 'left' ? 'Left' : 'Right'} player is ready for Space Painters!` }])
   }
   
   const onGalagaStart = ({ leftShip, rightShip }) => {
       setGalagaShips({ left: leftShip, right: rightShip })
       setGalagaActive(true)
       setGalagaReady(false)
   }
// Pacman events
    const onPacmanPlayerReady = ({ side }) => {
       setMessages(prev => [...prev, { sender: '🎮 System', text: `${side === 'left' ? 'Left' : 'Right'} player is ready for Maze Master!` }])
    }
    
    const onPacmanStart = ({ leftPacman, rightPacman }) => {
        setPacmanImages({ left: leftPacman, right: rightPacman })
        setPacmanActive(true)
        setPacmanReady(false)
        sounds.success()
    }

    socket.on('pacman-player-ready', onPacmanPlayerReady)
    socket.on('pacman-start', onPacmanStart)

    return () => {
      socket.off('playerJoined', handlePlayerJoined)
      socket.off('playerLeft', handlePlayerLeft)
      socket.off('pong-player-ready', onPongPlayerReady)
      socket.off('pong-start', onPongStart)
      socket.off('pongEnd', handlePongEnd)
      socket.off('tron-player-ready', onTronPlayerReady)
      socket.off('tron-start', onTronStart)
      socket.off('tron-died', onTronDied)
      socket.off('galaga-player-ready', onGalagaPlayerReady)
      socket.off('galaga-start', onGalagaStart)
      socket.off('pacman-player-ready', onPacmanPlayerReady)
      socket.off('pacman-start', onPacmanStart)
    }
  }, [])

  const handleJoinRoom = (info) => {
    setRoomInfo(info)
    setInRoom(true)
    setActivePlayer(info.side)
    // Show room code briefly when creating
    if (info.playerNumber === 1) {
      setShowRoomCode(true)
      setTimeout(() => setShowRoomCode(false), 10000) // Hide after 10s
    }
  }

  const handleLeaveRoom = () => {
    socket.emit('leaveRoom')
    setInRoom(false)
    setRoomInfo(null)
    setMessages([])
    sounds.pop()
  }

  const copyRoomCode = () => {
    if (roomInfo?.roomCode) {
      navigator.clipboard.writeText(roomInfo.roomCode)
      sounds.pop()
      setShowRoomCode(false) // Hide immediately after copying
    }
  }

  const preparePong = () => {
    if (!roomInfo || !canvasLogicRef.current) return
    const paddleImage = canvasLogicRef.current.getShipImage(roomInfo.side)
    if (!paddleImage) {
        alert("Draw something first to be your paddle!")
        return
    }
    setPongReady(true)
    socket.emit('pong-ready', { side: roomInfo.side, paddleImage })
    setMessages(prev => [...prev, { sender: '🎮 System', text: "Ready for Pong! Waiting for partner..." }])
  }

  const handleClosePong = () => {
    setPongActive(false)
    socket.emit('pongEnd')
  }
  
  const prepareTron = () => {
    if (!roomInfo || !canvasLogicRef.current) return
    const boatImage = canvasLogicRef.current.getShipImage(roomInfo.side)
    if (!boatImage) {
        alert("Draw something first to be your racer!")
        return
    }
    setTronReady(true)
    socket.emit('tron-ready', { side: roomInfo.side, boatImage })
    setMessages(prev => [...prev, { sender: '🎮 System', text: "Ready for Neon Racers! Waiting for partner..." }])
  }

  const preparePacman = () => {
    if (!roomInfo || !canvasLogicRef.current) return
    
    const pacmanImage = canvasLogicRef.current.getShipImage(roomInfo.side)
    if (!pacmanImage) {
        alert("Draw something first to be your character!")
        return
    }
    
    setPacmanReady(true)
    socket.emit('pacman-ready', { side: roomInfo.side, pacmanImage })
    setMessages(prev => [...prev, { sender: '🎮 System', text: "You are ready for Maze Master! Waiting for partner..." }])
  }

  const prepareGalaga = () => {
    if (!roomInfo || !canvasLogicRef.current) return
    
    // Check if user has drawn something
    const shipImage = canvasLogicRef.current.getShipImage(roomInfo.side)
    if (!shipImage) {
        alert("Draw something first to be your ship! (Just draw on your side of the canvas)")
        return
    }
    
    setGalagaReady(true)
    socket.emit('galaga-ready', { side: roomInfo.side, shipImage })
    // Add local feedback
    setMessages(prev => [...prev, { sender: '🎮 System', text: "You are ready for space battle! Waiting for partner..." }])
  }

  // Recording functions
  const startRecording = useCallback(() => {
    if (canvasRef.current && !isRecording) {
      gifRecorder.startRecording(canvasRef.current, 5) // 5 FPS for smaller files
      setIsRecording(true)
      setRecordingTime(0)
      sounds.pop()
      
      // Update recording time display
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }, [isRecording])

  const stopRecording = useCallback(async () => {
    if (isRecording) {
      gifRecorder.stopRecording()
      setIsRecording(false)
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      
      sounds.save()
      
      // Export as video
      await gifRecorder.exportAsWebM()
      gifRecorder.clear()
      setRecordingTime(0)
    }
  }, [isRecording])

  const handleSendMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message])
  }

  const clearLeftCanvas = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.clearSide('left')
      sounds.clear()
    }
  }

  const clearRightCanvas = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.clearSide('right')
      sounds.clear()
    }
  }

  const handleLeftUndo = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.undo('left')
      sounds.undo()
    }
  }

  const handleLeftRedo = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.redo('left')
      sounds.redo()
    }
  }

  const handleRightUndo = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.undo('right')
      sounds.undo()
    }
  }

  const handleRightRedo = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.redo('right')
      sounds.redo()
    }
  }

  const handleLeftSave = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.saveImage('left')
      sounds.save()
    }
  }

  const handleRightSave = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.saveImage('right')
      sounds.save()
    }
  }

  const handleSaveAll = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.saveFullImage()
      sounds.save()
    }
  }

  // Eyedropper color pick callback
  const handleColorPick = useCallback((color, side) => {
    sounds.colorPick()
    if (side === 'left') {
      setLeftBrushColor(color)
      setLeftCurrentTool('brush') // Switch back to brush after picking
    } else {
      setRightBrushColor(color)
      setRightCurrentTool('brush')
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const toolShortcuts = {
      'b': 'brush',
      'p': 'pencil',
      'e': 'eraser',
      's': 'spray',
      'f': 'bucket',
      'l': 'line',
      'r': 'rectangle',
      'o': 'circle',
      't': 'triangle',
      'a': 'star',
      'i': 'eyedropper',
      'c': 'calligraphy',
      'm': 'marker',
    }

    const handleKeyDown = (e) => {
      // Ignore if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      const key = e.key.toLowerCase()

      // Ctrl+Z for undo
      if (e.ctrlKey && key === 'z') {
        e.preventDefault()
        if (activePlayer === 'left') handleLeftUndo()
        else handleRightUndo()
        return
      }

      // Ctrl+Y for redo
      if (e.ctrlKey && key === 'y') {
        e.preventDefault()
        if (activePlayer === 'left') handleLeftRedo()
        else handleRightRedo()
        return
      }

      // Ctrl+S for save
      if (e.ctrlKey && key === 's') {
        e.preventDefault()
        if (activePlayer === 'left') handleLeftSave()
        else handleRightSave()
        return
      }

      // Escape to toggle boss mode
      if (key === 'escape') {
        setBossMode(prev => !prev)
        sounds.bossMode()
        return
      }

      // Tab to switch active player
      if (key === 'tab') {
        e.preventDefault()
        setActivePlayer(prev => prev === 'left' ? 'right' : 'left')
        sounds.pop()
        return
      }

      // Tool shortcuts
      if (toolShortcuts[key]) {
        sounds.toolSwitch()
        if (activePlayer === 'left') {
          setLeftCurrentTool(toolShortcuts[key])
        } else {
          setRightCurrentTool(toolShortcuts[key])
        }
        return
      }

      // Number keys for quick brush size
      if (key >= '1' && key <= '9') {
        const size = parseInt(key) * 5
        if (activePlayer === 'left') {
          setLeftBrushSize(size)
        } else {
          setRightBrushSize(size)
        }
        sounds.pop()
        return
      }

      // W for wobbly mode toggle
      if (key === 'w' && !e.ctrlKey) {
        sounds.wobblyToggle()
        if (activePlayer === 'left') {
          setLeftWobblyMode(prev => !prev)
        } else {
          setRightWobblyMode(prev => !prev)
        }
        return
      }

      // Q for random color mode toggle
      if (key === 'q') {
        sounds.randomColorToggle()
        if (activePlayer === 'left') {
          setLeftRandomColorMode(prev => !prev)
        } else {
          setRightRandomColorMode(prev => !prev)
        }
        return
      }

      // M to toggle sound
      if (key === 'm') {
        setSoundEnabled(prev => {
          sounds.setEnabled(!prev)
          return !prev
        })
        return
      }

      // R to toggle recording
      if (key === 'r' && !e.ctrlKey) {
        if (isRecording) {
          stopRecording()
        } else {
          startRecording()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePlayer, isRecording, startRecording, stopRecording])

  // Show room lobby if not in a room
  if (!inRoom) {
    return <RoomLobby onJoinRoom={handleJoinRoom} />
  }

  return (
    <main ref={mainContainerRef} className="w-screen h-screen flex flex-col bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 overflow-hidden relative touch-none">
      <CursorOverlay socket={socket} roomInfo={roomInfo} containerRef={mainContainerRef} />

      {/* Room Code Popup for host */}
      {showRoomCode && roomInfo?.playerNumber === 1 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200 p-8 z-50 animate-fade-in">
          <div className="text-center">
            <div className="text-4xl mb-3">🔗</div>
            <p className="text-sm text-stone-500 mb-3 font-medium">Share this code with friends!</p>
            <button 
              onClick={copyRoomCode}
              className="font-mono font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-4 rounded-2xl hover:from-amber-100 hover:to-orange-100 transition-all border-2 border-amber-200 shadow-inner"
            >
              {roomInfo.roomCode}
            </button>
            <p className="text-xs text-stone-400 mt-3 flex items-center justify-center gap-2">
              <span>📋</span> Click to copy
            </p>
          </div>
          <button
            onClick={() => setShowRoomCode(false)}
            className="absolute -top-2 -right-2 w-8 h-8 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 flex items-center justify-center text-lg shadow-md transition-all"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Top Bar REMOVED - Moved to Sidebar */}
    
      {/* Main Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Game Sidebar - Left Player Theme (Warm) */}
        <GameSidebar
          className={`
            fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-amber-50 via-orange-50/80 to-amber-50 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 sidebar-glass
            ${isGameOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 md:w-72 md:shadow-xl md:border-r-2 md:border-amber-200/50
          `}
          roomInfo={roomInfo}
          coins={coins}
          unlockedItems={unlockedItems}
          onPurchase={handlePurchase}
          onLeaveRoom={handleLeaveRoom}
          onCopyCode={copyRoomCode}
          onStartPong={preparePong}
          onStartTron={prepareTron}
          onStartGalaga={prepareGalaga}
          onStartPacman={preparePacman}
          pongReady={pongReady}
          tronReady={tronReady}
          galagaReady={galagaReady}
          pacmanReady={pacmanReady}
        />

        {/* Pong Game Overlay */}
        <PongGame
          isActive={pongActive}
          playerSide={roomInfo?.side}
          onClose={handleClosePong}
          leftPaddleImage={pongPaddles.left}
          rightPaddleImage={pongPaddles.right}
        />

        {/* Tron Game Overlay */}
        {tronActive && (
          <TronGame
            playerSide={roomInfo.side}
            onClose={() => setTronActive(false)}
            leftImage={tronImages?.left}
            rightImage={tronImages?.right}
          />
        )}

        {/* Pacman Game Overlay */}
        {pacmanActive && (
          <PacmanGame
             side={roomInfo.side}
             onClose={() => setPacmanActive(false)}
             leftPacmanImage={pacmanImages?.left}
             rightPacmanImage={pacmanImages?.right}
          />
        )}

        {/* Canvas - The Main Focus */}
        <div className="flex-1 relative bg-stone-50 m-2 rounded-2xl shadow-lg border border-stone-200/50 overflow-hidden">
          {/* Left Player Mini Toolbar */}
          <MiniToolbar
            side="left"
            brushColor={leftBrushColor}
            setBrushColor={setLeftBrushColor}
            brushSize={leftBrushSize}
            setBrushSize={setLeftBrushSize}
            brushStyle={leftBrushStyle}
            setBrushStyle={setLeftBrushStyle}
            brushOpacity={leftBrushOpacity}
            setBrushOpacity={setLeftBrushOpacity}
            currentTool={leftCurrentTool}
            setCurrentTool={setLeftCurrentTool}
            onClear={clearLeftCanvas}
            onUndo={handleLeftUndo}
            onRedo={handleLeftRedo}
            onSave={handleLeftSave}
            onSaveAll={handleSaveAll}
            wobblyMode={leftWobblyMode}
            setWobblyMode={setLeftWobblyMode}
            randomColorMode={leftRandomColorMode}
            setRandomColorMode={setLeftRandomColorMode}
            mirrorMode={leftMirrorMode}
            setMirrorMode={setLeftMirrorMode}
            glowMode={leftGlowMode}
            setGlowMode={setLeftGlowMode}
            scatterMode={leftScatterMode}
            setScatterMode={setLeftScatterMode}
            neonMode={leftNeonMode}
            setNeonMode={setLeftNeonMode}
            discoMode={leftDiscoMode}
            setDiscoMode={setLeftDiscoMode}
            gravityMode={leftGravityMode}
            setGravityMode={setLeftGravityMode}
            zigzagMode={leftZigzagMode}
            setZigzagMode={setLeftZigzagMode}
            pixelMode={leftPixelMode}
            setPixelMode={setLeftPixelMode}
          />

          {/* Right Player Mini Toolbar */}
          <MiniToolbar
            side="right"
            brushColor={rightBrushColor}
            setBrushColor={setRightBrushColor}
            brushSize={rightBrushSize}
            setBrushSize={setRightBrushSize}
            brushStyle={rightBrushStyle}
            setBrushStyle={setRightBrushStyle}
            brushOpacity={rightBrushOpacity}
            setBrushOpacity={setRightBrushOpacity}
            currentTool={rightCurrentTool}
            setCurrentTool={setRightCurrentTool}
            onClear={clearRightCanvas}
            onUndo={handleRightUndo}
            onRedo={handleRightRedo}
            onSave={handleRightSave}
            onSaveAll={handleSaveAll}
            wobblyMode={rightWobblyMode}
            setWobblyMode={setRightWobblyMode}
            randomColorMode={rightRandomColorMode}
            setRandomColorMode={setRightRandomColorMode}
            mirrorMode={rightMirrorMode}
            setMirrorMode={setRightMirrorMode}
            glowMode={rightGlowMode}
            setGlowMode={setRightGlowMode}
            scatterMode={rightScatterMode}
            setScatterMode={setRightScatterMode}
            neonMode={rightNeonMode}
            setNeonMode={setRightNeonMode}
            discoMode={rightDiscoMode}
            setDiscoMode={setRightDiscoMode}
            gravityMode={rightGravityMode}
            setGravityMode={setRightGravityMode}
            zigzagMode={rightZigzagMode}
            setZigzagMode={setRightZigzagMode}
            pixelMode={rightPixelMode}
            setPixelMode={setRightPixelMode}
          />

          <Canvas
            ref={canvasLogicRef}
            canvasRef={canvasRef}
            leftBrushColor={leftBrushColor}
            leftBrushSize={leftBrushSize}
            leftBrushStyle={leftBrushStyle}
            leftBrushOpacity={leftBrushOpacity}
            leftCurrentTool={leftCurrentTool}
            leftWobblyMode={leftWobblyMode}
            leftRandomColorMode={leftRandomColorMode}
            leftMirrorMode={leftMirrorMode}
            leftGlowMode={leftGlowMode}
            leftScatterMode={leftScatterMode}
            leftNeonMode={leftNeonMode}
            leftDiscoMode={leftDiscoMode}
            leftGravityMode={leftGravityMode}
            leftZigzagMode={leftZigzagMode}
            leftPixelMode={leftPixelMode}
            rightBrushColor={rightBrushColor}
            rightBrushSize={rightBrushSize}
            rightBrushStyle={rightBrushStyle}
            rightBrushOpacity={rightBrushOpacity}
            rightCurrentTool={rightCurrentTool}
            rightWobblyMode={rightWobblyMode}
            rightRandomColorMode={rightRandomColorMode}
            rightMirrorMode={rightMirrorMode}
            rightGlowMode={rightGlowMode}
            rightScatterMode={rightScatterMode}
            rightNeonMode={rightNeonMode}
            rightDiscoMode={rightDiscoMode}
            rightGravityMode={rightGravityMode}
            rightZigzagMode={rightZigzagMode}
            rightPixelMode={rightPixelMode}
            onColorPick={handleColorPick}
            setLeftBrushColor={setLeftBrushColor}
            setRightBrushColor={setRightBrushColor}
          />
          
          {/* Game Overlays */}
          {pongActive && <PongGame onClose={handleClosePong} />}
          
          {galagaActive && (
              <GalagaGame 
                onClose={() => setGalagaActive(false)} 
                side={roomInfo.side}
                leftShipImage={galagaShips.left}
                rightShipImage={galagaShips.right}
              />
          )}

          {/* Game Toggle Button (Mobile) - Warm Theme */}
          <button
            onClick={() => setIsGameOpen(!isGameOpen)}
            className="fixed bottom-4 left-4 z-40 p-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl shadow-xl hover:from-amber-500 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all transform hover:scale-105 md:hidden border-2 border-white/20"
            aria-label={isGameOpen ? "Close Game" : "Open Game"}
          >
            <span className="text-xl">🎮</span>
          </button>
          
          {/* Chat Toggle Button (Mobile) - Cool Theme */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-4 right-4 z-40 p-4 bg-gradient-to-br from-sky-400 to-indigo-500 text-white rounded-2xl shadow-xl hover:from-sky-500 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all transform hover:scale-105 md:hidden border-2 border-white/20"
            aria-label={isChatOpen ? "Close Chat" : "Open Chat"}
          >
            <span className="text-xl">💬</span>
          </button>
        </div>

        {/* Chat Sidebar - Right Player Theme (Cool) */}
        <ChatSidebar
          className={`
            fixed inset-y-0 right-0 w-80 bg-gradient-to-b from-sky-50 via-indigo-50/80 to-sky-50 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 sidebar-glass
            ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
            md:relative md:translate-x-0 md:w-80 md:shadow-xl md:border-l-2 md:border-sky-200/50
          `}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
        
        {/* Overlay for mobile when chat is open */}
        {(isChatOpen || isGameOpen) && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
            onClick={() => { setIsChatOpen(false); setIsGameOpen(false) }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Boss Mode Overlay - fake spreadsheet */}
      {bossMode && (
        <div className="fixed inset-0 z-[100] bg-white font-mono text-xs overflow-auto">
          <div className="bg-green-700 text-white px-4 py-2 flex items-center gap-4">
            <span className="font-bold">Microsoft Excel - Q4_Budget_Report_FINAL_v3.xlsx</span>
            <span className="ml-auto text-[10px] opacity-70">Press ESC to return to work</span>
          </div>
          <div className="p-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 w-8"></th>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(col => (
                    <th key={col} className="border border-gray-300 px-4 py-1 font-normal text-center min-w-[100px]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Q4 Budget Analysis', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', ''],
                  ['Department', 'Oct', 'Nov', 'Dec', 'Total', 'YoY %', 'Status', 'Notes'],
                  ['Marketing', '$45,230', '$52,100', '$48,900', '$146,230', '+12%', 'On Track', ''],
                  ['Engineering', '$128,500', '$132,400', '$145,200', '$406,100', '+8%', 'Review', 'Headcount +2'],
                  ['Operations', '$23,100', '$24,500', '$28,900', '$76,500', '+5%', 'On Track', ''],
                  ['Sales', '$67,800', '$89,200', '$112,400', '$269,400', '+22%', 'Exceeds', 'Q4 Push'],
                  ['HR', '$12,400', '$11,800', '$14,200', '$38,400', '+3%', 'On Track', ''],
                  ['', '', '', '', '', '', '', ''],
                  ['TOTAL', '$277,030', '$310,000', '$349,600', '$936,630', '+11%', '', ''],
                ].map((row, i) => (
                  <tr key={i} className={i === 2 ? 'bg-blue-50 font-bold' : i === 9 ? 'bg-yellow-50 font-bold' : ''}>
                    <td className="border border-gray-300 px-2 py-1 bg-gray-100 text-center">{i + 1}</td>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-gray-300 px-2 py-1">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl shadow-xl z-[60] flex items-center gap-3 border-2 border-white/20">
          <div className="w-4 h-4 bg-white rounded-full animate-ping" />
          <span className="font-bold text-sm">Recording</span>
          <span className="font-mono text-sm bg-white/20 px-2 py-0.5 rounded-lg">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
          <button 
            onClick={stopRecording}
            className="ml-2 px-3 py-1 bg-white text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            Stop & Save
          </button>
        </div>
      )}


    </main>
  )
}
