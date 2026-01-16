export const getBrushSettings = (side, props) => {
    if (side === 'left') {
      return {
        brushColor: props.leftBrushColor,
        brushSize: props.leftBrushSize,
        brushStyle: props.leftBrushStyle,
        brushOpacity: props.leftBrushOpacity,
        currentTool: props.leftCurrentTool,
        wobblyMode: props.leftWobblyMode,
        randomColorMode: props.leftRandomColorMode,
        mirrorMode: props.leftMirrorMode,
        glowMode: props.leftGlowMode,
        scatterMode: props.leftScatterMode,
        neonMode: props.leftNeonMode,
        discoMode: props.leftDiscoMode,
        gravityMode: props.leftGravityMode,
        zigzagMode: props.leftZigzagMode,
        pixelMode: props.leftPixelMode,
      }
    } else {
      return {
        brushColor: props.rightBrushColor,
        brushSize: props.rightBrushSize,
        brushStyle: props.rightBrushStyle,
        brushOpacity: props.rightBrushOpacity,
        currentTool: props.rightCurrentTool,
        wobblyMode: props.rightWobblyMode,
        randomColorMode: props.rightRandomColorMode,
        mirrorMode: props.rightMirrorMode,
        glowMode: props.rightGlowMode,
        scatterMode: props.rightScatterMode,
        neonMode: props.rightNeonMode,
        discoMode: props.rightDiscoMode,
        gravityMode: props.rightGravityMode,
        zigzagMode: props.rightZigzagMode,
        pixelMode: props.rightPixelMode,
      }
    }
  }

  export const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue}, 80%, 50%)`
  }

  export const applyWobble = (x, y, wobbleAmount = 3) => {
    return {
      x: x + (Math.random() - 0.5) * wobbleAmount * 2,
      y: y + (Math.random() - 0.5) * wobbleAmount * 2
    }
  }

  export const hexToRgb = (hex) => {
    let r = 0, g = 0, b = 0
    if (hex.length === 4) { // #RGB
      r = parseInt(hex[1] + hex[1], 16)
      g = parseInt(hex[2] + hex[2], 16)
      b = parseInt(hex[3] + hex[3], 16)
    } else if (hex.length === 7) { // #RRGGBB
      r = parseInt(hex[1] + hex[2], 16)
      g = parseInt(hex[3] + hex[4], 16)
      b = parseInt(hex[5] + hex[6], 16)
    }
    return { r, g, b }
  }
