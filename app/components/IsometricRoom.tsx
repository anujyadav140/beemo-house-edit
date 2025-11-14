'use client'

import { useEffect, useRef, useState } from 'react'
import type { FurnitureItem, PlacedItem } from '../../types'

interface IsometricRoomProps {
  placedItems: PlacedItem[]
  availableItems: FurnitureItem[]
  selectedItemType: string | null
  onAddItem: (itemId: string, x: number, y: number) => void
  onMoveItem: (id: string, x: number, y: number) => void
  onRemoveItem: (id: string) => void
}

// Isometric projection constants
const ISO_ANGLE = Math.PI / 6 // 30 degrees
const TILE_SIZE = 40
const WALL_HEIGHT = 180
const ROOM_SIZE = 11

export default function IsometricRoom({
  placedItems,
  availableItems,
  selectedItemType,
  onAddItem,
  onMoveItem,
  onRemoveItem
}: IsometricRoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoverTile, setHoverTile] = useState<{ x: number, y: number } | null>(null)
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())

  // Load all furniture images
  useEffect(() => {
    const imageMap = new Map<string, HTMLImageElement>()
    let loadedCount = 0

    availableItems.forEach(item => {
      const img = new Image()
      img.src = item.imageUrl
      img.onload = () => {
        imageMap.set(item.id, img)
        loadedCount++
        if (loadedCount === availableItems.length) {
          setLoadedImages(new Map(imageMap))
        }
      }
      img.onerror = () => {
        loadedCount++
        if (loadedCount === availableItems.length) {
          setLoadedImages(new Map(imageMap))
        }
      }
    })
  }, [availableItems])

  // Convert 3D world coordinates to 2D isometric screen coordinates
  const worldToScreen = (x: number, y: number, z: number = 0): { x: number, y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    // Isometric projection matrix
    const screenX = (x - y) * Math.cos(ISO_ANGLE) * TILE_SIZE
    const screenY = (x + y) * Math.sin(ISO_ANGLE) * TILE_SIZE - z

    // Center the room in the canvas with better positioning
    const offsetX = canvas.width / 2
    const offsetY = WALL_HEIGHT + 80 // Fixed offset from top to show walls

    return {
      x: screenX + offsetX,
      y: screenY + offsetY
    }
  }

  // Convert screen coordinates back to world tile coordinates
  const screenToWorld = (screenX: number, screenY: number): { x: number, y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const offsetX = canvas.width / 2
    const offsetY = WALL_HEIGHT + 80

    const x = (screenX - offsetX) / (Math.cos(ISO_ANGLE) * TILE_SIZE)
    const y = (screenY - offsetY) / (Math.sin(ISO_ANGLE) * TILE_SIZE)

    const worldX = (x + y) / 2
    const worldY = (y - x) / 2

    return {
      x: Math.floor(worldX),
      y: Math.floor(worldY)
    }
  }

  // Check if a tile position is valid
  const isValidTile = (x: number, y: number, width: number = 1, height: number = 1): boolean => {
    return x >= 0 && y >= 0 && x + width <= ROOM_SIZE && y + height <= ROOM_SIZE
  }

  // Check if position is on a wall edge (where objects cannot be placed)
  const isWallPosition = (x: number, y: number): boolean => {
    // Left wall (x=0), Right wall (x=10), Back wall (y=0)
    return x === 0 || x === ROOM_SIZE - 1 || y === 0
  }

  // Check collision with other items (simplified for 1x1 grid occupation)
  const hasCollision = (x: number, y: number, width: number, height: number, excludeId?: string): boolean => {
    // Since all items now occupy only 1x1, just check if any item is at the exact same position
    return placedItems.some(item => {
      if (item.id === excludeId) return false
      return item.x === x && item.y === y
    })
  }

  // Check if screen coordinates are inside a rendered item's bounds
  const getItemAtScreenPos = (screenX: number, screenY: number): PlacedItem | null => {
    // Sort by depth (furthest first) and reverse to check closest items first
    const sortedItems = [...placedItems].sort((a, b) => (b.x + b.y) - (a.x + a.y))

    for (const item of sortedItems) {
      const furnitureData = availableItems.find(f => f.id === item.itemId)
      if (!furnitureData) continue

      const basePos = worldToScreen(item.x + furnitureData.width / 2, item.y + furnitureData.height / 2, 0)

      // Calculate actual render dimensions (matching the draw logic)
      let renderWidth, renderHeight
      const img = loadedImages.get(item.itemId)

      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        // Use same aspect ratio logic as drawing
        const baseWidth = furnitureData.width * TILE_SIZE * 1.5
        const baseHeight = (furnitureData.visualHeight || furnitureData.height) * TILE_SIZE * 2
        const imageAspectRatio = img.naturalWidth / img.naturalHeight

        // Apply scale per furniture type (reduced to prevent wall overlap)
        let imageScale = 2
        if (furnitureData.id === 'lamp') imageScale = 3
        if (furnitureData.id === 'bookshelf') imageScale = 3
        if (furnitureData.id === 'rug') imageScale = 3
        if (furnitureData.id === 'table') imageScale = 3
        if (furnitureData.id === 'desk') imageScale = 3
        if (furnitureData.id === 'sofa') imageScale = 3

        if (imageAspectRatio > baseWidth / baseHeight) {
          renderWidth = baseWidth * imageScale
          renderHeight = (baseWidth / imageAspectRatio) * imageScale
        } else {
          renderHeight = baseHeight * imageScale
          renderWidth = (baseHeight * imageAspectRatio) * imageScale
        }
      } else {
        // Fallback to placeholder dimensions
        renderWidth = furnitureData.width * TILE_SIZE * 1.5
        renderHeight = (furnitureData.visualHeight || furnitureData.height) * TILE_SIZE * 2
      }

      const left = basePos.x - renderWidth / 2
      const right = basePos.x + renderWidth / 2
      const top = basePos.y - renderHeight
      const bottom = basePos.y

      if (screenX >= left && screenX <= right && screenY >= top && screenY <= bottom) {
        return item
      }
    }

    return null
  }

  // Draw the isometric room
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw back wall
    ctx.save()
    const backWallGradient = ctx.createLinearGradient(0, 0, 0, WALL_HEIGHT)
    backWallGradient.addColorStop(0, '#e8dcc8')
    backWallGradient.addColorStop(1, '#d4c4a8')

    const topLeft = worldToScreen(0, 0, WALL_HEIGHT)
    const topRight = worldToScreen(ROOM_SIZE, 0, WALL_HEIGHT)
    const bottomRight = worldToScreen(ROOM_SIZE, 0, 0)
    const bottomLeft = worldToScreen(0, 0, 0)

    ctx.beginPath()
    ctx.moveTo(topLeft.x, topLeft.y)
    ctx.lineTo(topRight.x, topRight.y)
    ctx.lineTo(bottomRight.x, bottomRight.y)
    ctx.lineTo(bottomLeft.x, bottomLeft.y)
    ctx.closePath()
    ctx.fillStyle = backWallGradient
    ctx.fill()
    ctx.strokeStyle = '#a89878'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()

    // Draw left wall
    ctx.save()
    const leftWallGradient = ctx.createLinearGradient(0, 0, 0, WALL_HEIGHT)
    leftWallGradient.addColorStop(0, '#d4c4a8')
    leftWallGradient.addColorStop(1, '#c0b090')

    const leftTopLeft = worldToScreen(0, 0, WALL_HEIGHT)
    const leftTopRight = worldToScreen(0, ROOM_SIZE, WALL_HEIGHT)
    const leftBottomRight = worldToScreen(0, ROOM_SIZE, 0)
    const leftBottomLeft = worldToScreen(0, 0, 0)

    ctx.beginPath()
    ctx.moveTo(leftTopLeft.x, leftTopLeft.y)
    ctx.lineTo(leftTopRight.x, leftTopRight.y)
    ctx.lineTo(leftBottomRight.x, leftBottomRight.y)
    ctx.lineTo(leftBottomLeft.x, leftBottomLeft.y)
    ctx.closePath()
    ctx.fillStyle = leftWallGradient
    ctx.fill()
    ctx.strokeStyle = '#a89878'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()

    // Draw floor tiles
    for (let y = 0; y < ROOM_SIZE; y++) {
      for (let x = 0; x < ROOM_SIZE; x++) {
        const p1 = worldToScreen(x, y, 0)
        const p2 = worldToScreen(x + 1, y, 0)
        const p3 = worldToScreen(x + 1, y + 1, 0)
        const p4 = worldToScreen(x, y + 1, 0)

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.lineTo(p3.x, p3.y)
        ctx.lineTo(p4.x, p4.y)
        ctx.closePath()

        // Checkerboard pattern
        const isLight = (x + y) % 2 === 0
        ctx.fillStyle = isLight ? '#f5e6d3' : '#e8d4b8'
        ctx.fill()

        // Tile borders
        ctx.strokeStyle = '#d0c0a0'
        ctx.lineWidth = 1
        ctx.stroke()

        // Hover highlight
        if (hoverTile && hoverTile.x === x && hoverTile.y === y && selectedItemType) {
          const item = availableItems.find(i => i.id === selectedItemType)
          if (item) {
            const isValid = isValidTile(x, y, item.width, item.height) &&
                           !isWallPosition(x, y) &&
                           !hasCollision(x, y, item.width, item.height)

            ctx.fillStyle = isValid ? 'rgba(50, 205, 50, 0.3)' : 'rgba(255, 0, 0, 0.3)'
            ctx.fill()
          }
        }
      }
    }

    // Sort items by depth (for proper rendering order)
    // Rugs are always drawn first so other objects appear above them
    const sortedItems = [...placedItems].sort((a, b) => {
      const aData = availableItems.find(f => f.id === a.itemId)
      const bData = availableItems.find(f => f.id === b.itemId)
      const aIsRug = aData?.id === 'rug'
      const bIsRug = bData?.id === 'rug'

      // Rugs always come first
      if (aIsRug && !bIsRug) return -1
      if (!aIsRug && bIsRug) return 1

      // Otherwise sort by depth (smaller x+y = further back = drawn first)
      return (a.x + a.y) - (b.x + b.y)
    })

    // Draw placed furniture
    sortedItems.forEach(item => {
      const furnitureData = availableItems.find(f => f.id === item.itemId)
      if (!furnitureData) return

      const basePos = worldToScreen(item.x + furnitureData.width / 2, item.y + furnitureData.height / 2, 0)

      ctx.save()

      const img = loadedImages.get(item.itemId)

      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        // Calculate size based on furniture dimensions but preserve image aspect ratio
        const baseWidth = furnitureData.width * TILE_SIZE * 1.5
        const baseHeight = (furnitureData.visualHeight || furnitureData.height) * TILE_SIZE * 2

        // Get original image aspect ratio
        const imageAspectRatio = img.naturalWidth / img.naturalHeight

        // Calculate dimensions that fit within the base size while maintaining aspect ratio
        let renderWidth, renderHeight

        // Fit to width or height depending on aspect ratio
        if (imageAspectRatio > baseWidth / baseHeight) {
          // Image is wider - fit to width
          renderWidth = baseWidth
          renderHeight = baseWidth / imageAspectRatio
        } else {
          // Image is taller - fit to height
          renderHeight = baseHeight
          renderWidth = baseHeight * imageAspectRatio
        }

        // Draw furniture image with preserved aspect ratio
        // Apply scale per furniture type
        let imageScale = 2
        if (furnitureData.id === 'lamp') imageScale = 3
        if (furnitureData.id === 'bookshelf') imageScale = 3
        if (furnitureData.id === 'rug') imageScale = 3
        if (furnitureData.id === 'table') imageScale = 3
        if (furnitureData.id === 'desk') imageScale = 3
        if (furnitureData.id === 'sofa') imageScale = 3

        const scaledWidth = renderWidth * imageScale
        const scaledHeight = renderHeight * imageScale

        // Flip when NOT at the left edge of the floor grid (x=1)
        // x=0 is the wall (blocked), so x=1 is the leftmost valid floor position
        // Images are flipped by default, and shown normally only at x=1
        const shouldFlip = item.x !== 1

        if (shouldFlip) {
          // Flip horizontally
          ctx.translate(basePos.x, basePos.y)
          ctx.scale(-1, 1)
          ctx.drawImage(
            img,
            -scaledWidth / 2,
            -scaledHeight,
            scaledWidth,
            scaledHeight
          )
        } else {
          ctx.drawImage(
            img,
            basePos.x - scaledWidth / 2,
            basePos.y - scaledHeight,
            scaledWidth,
            scaledHeight
          )
        }
      } else {
        // Draw placeholder when image not loaded
        const itemWidth = furnitureData.width * TILE_SIZE * 1.5
        const itemHeight = (furnitureData.visualHeight || furnitureData.height) * TILE_SIZE * 2

        ctx.fillStyle = furnitureData.color || '#888'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 5

        ctx.fillRect(
          basePos.x - itemWidth / 2,
          basePos.y - itemHeight,
          itemWidth,
          itemHeight
        )

        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.strokeRect(
          basePos.x - itemWidth / 2,
          basePos.y - itemHeight,
          itemWidth,
          itemHeight
        )
      }

      ctx.restore()
    })

    // Draw hover preview
    if (hoverTile && selectedItemType) {
      const item = availableItems.find(i => i.id === selectedItemType)
      if (item) {
        const isValid = isValidTile(hoverTile.x, hoverTile.y, item.width, item.height) &&
                       !isWallPosition(hoverTile.x, hoverTile.y) &&
                       !hasCollision(hoverTile.x, hoverTile.y, item.width, item.height)

        const basePos = worldToScreen(
          hoverTile.x + item.width / 2,
          hoverTile.y + item.height / 2,
          0
        )

        ctx.save()
        ctx.globalAlpha = 0.5

        // Calculate preview dimensions with aspect ratio preserved
        let previewWidth, previewHeight
        const img = loadedImages.get(item.id)

        if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
          const baseWidth = item.width * TILE_SIZE * 1.5
          const baseHeight = (item.visualHeight || item.height) * TILE_SIZE * 2
          const imageAspectRatio = img.naturalWidth / img.naturalHeight

          // Apply scale per furniture type (reduced to prevent wall overlap)
          let imageScale = 2
          if (item.id === 'lamp') imageScale = 3
          if (item.id === 'bookshelf') imageScale = 3
          if (item.id === 'rug') imageScale = 3
          if (item.id === 'table') imageScale = 3
          if (item.id === 'desk') imageScale = 3
          if (item.id === 'sofa') imageScale = 4

          if (imageAspectRatio > baseWidth / baseHeight) {
            previewWidth = baseWidth * imageScale
            previewHeight = (baseWidth / imageAspectRatio) * imageScale
          } else {
            previewHeight = baseHeight * imageScale
            previewWidth = (baseHeight * imageAspectRatio) * imageScale
          }
        } else {
          previewWidth = item.width * TILE_SIZE * 1.5
          previewHeight = (item.visualHeight || item.height) * TILE_SIZE * 2
        }

        ctx.fillStyle = isValid ? (item.color || '#888') : '#ff0000'
        ctx.fillRect(
          basePos.x - previewWidth / 2,
          basePos.y - previewHeight,
          previewWidth,
          previewHeight
        )

        ctx.strokeStyle = isValid ? '#333' : '#aa0000'
        ctx.lineWidth = 2
        ctx.strokeRect(
          basePos.x - previewWidth / 2,
          basePos.y - previewHeight,
          previewWidth,
          previewHeight
        )

        ctx.restore()
      }
    }

  }, [placedItems, availableItems, hoverTile, selectedItemType, loadedImages])

  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const world = screenToWorld(screenX, screenY)

    // Clamp world coordinates to grid boundaries
    const clampedX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
    const clampedY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))

    // Update hover tile with clamped coordinates
    if (isValidTile(clampedX, clampedY)) {
      setHoverTile({ x: clampedX, y: clampedY })
    } else {
      setHoverTile(null)
    }

    // Handle dragging
    if (draggedItem) {
      canvas.style.cursor = 'grabbing'
      const item = placedItems.find(i => i.id === draggedItem)
      const furnitureData = item ? availableItems.find(f => f.id === item.itemId) : null

      if (item && furnitureData) {
        let newX = clampedX - dragOffset.x
        let newY = clampedY - dragOffset.y

        // Clamp position to stay within grid boundaries (invisible border)
        newX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(newX)))
        newY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(newY)))

        // Check if position is valid (not on wall and no collision)
        if (!isWallPosition(newX, newY) && !hasCollision(newX, newY, furnitureData.width, furnitureData.height, draggedItem)) {
          onMoveItem(draggedItem, newX, newY)
        }
      }
    } else {
      // Update cursor based on what's under the mouse
      const itemUnderMouse = getItemAtScreenPos(screenX, screenY)
      if (selectedItemType) {
        canvas.style.cursor = 'crosshair'
      } else if (itemUnderMouse) {
        canvas.style.cursor = 'grab'
      } else {
        canvas.style.cursor = 'default'
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // If in placement mode, place the item
    if (selectedItemType && hoverTile) {
      const item = availableItems.find(i => i.id === selectedItemType)

      // Clamp placement coordinates to grid boundaries
      const clampedPlaceX = Math.max(0, Math.min(ROOM_SIZE - 1, hoverTile.x))
      const clampedPlaceY = Math.max(0, Math.min(ROOM_SIZE - 1, hoverTile.y))

      // Check if position is valid (not on wall and no collision)
      if (item && !isWallPosition(clampedPlaceX, clampedPlaceY) && !hasCollision(clampedPlaceX, clampedPlaceY, item.width, item.height)) {
        onAddItem(selectedItemType, clampedPlaceX, clampedPlaceY)
      }
      return
    }

    // Check if clicking on an item using pixel-perfect detection
    const clickedItem = getItemAtScreenPos(screenX, screenY)

    if (clickedItem) {
      const world = screenToWorld(screenX, screenY)
      // Clamp world coordinates for drag offset calculation
      const clampedWorldX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
      const clampedWorldY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))
      setDraggedItem(clickedItem.id)
      setDragOffset({ x: clampedWorldX - clickedItem.x, y: clampedWorldY - clickedItem.y })
    }
  }

  const handleMouseUp = () => {
    setDraggedItem(null)
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // Use pixel-perfect detection to find clicked item
    const clickedItem = getItemAtScreenPos(screenX, screenY)

    if (clickedItem) {
      onRemoveItem(clickedItem.id)
    }
  }

  return (
    <div className="isometric-room-container">
      <canvas
        ref={canvasRef}
        className="isometric-canvas"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      <div className="room-instructions">
        {selectedItemType ? 'Click to place • ESC to cancel' : 'Click to select • Drag to move • Double-click to remove'}
      </div>
    </div>
  )
}
