'use client'

import { useEffect, useRef, useState } from 'react'
import type { FurnitureItem, PlacedItem } from '../../types'

interface IsometricRoomProps {
  placedItems: PlacedItem[]
  availableItems: FurnitureItem[]
  selectedItemType: string | null
  onAddItem: (itemId: string, x: number, y: number, z?: number) => void
  onMoveItem: (id: string, x: number, y: number, z?: number) => void
  onRemoveItem: (id: string) => void
  floorColor: { light: string, dark: string }
  wallColor: { base: string, top: string, bottom: string }
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
  onRemoveItem,
  floorColor,
  wallColor
}: IsometricRoomProps) {
  console.log('IsometricRoom rendering', { placedItemsCount: placedItems.length, availableItemsCount: availableItems.length })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoverTile, setHoverTile] = useState<{ x: number, y: number, z?: number } | null>(null)
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [lastTapTime, setLastTapTime] = useState<number>(0)
  const [lastTapPos, setLastTapPos] = useState<{ x: number, y: number } | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Zoom and pan state
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null)
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null)

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

  // Calculate initial zoom to fit room on screen
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Calculate room dimensions in screen space
      const roomWidth = ROOM_SIZE * Math.cos(ISO_ANGLE) * TILE_SIZE * 2
      const roomHeight = WALL_HEIGHT + ROOM_SIZE * Math.sin(ISO_ANGLE) * TILE_SIZE + 200

      // Calculate zoom to fit with some padding
      const zoomX = (canvas.offsetWidth * 0.9) / roomWidth
      const zoomY = (canvas.offsetHeight * 0.9) / roomHeight
      const initialZoom = Math.min(zoomX, zoomY, 1) // Don't zoom in more than 1x initially

      setZoom(initialZoom)
      setPan({ x: 0, y: 0 })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

    // Apply zoom and pan
    return {
      x: (screenX + offsetX) * zoom + pan.x,
      y: (screenY + offsetY) * zoom + pan.y
    }
  }

  // Convert screen coordinates back to world tile coordinates
  const screenToWorld = (screenX: number, screenY: number): { x: number, y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const offsetX = canvas.width / 2
    const offsetY = WALL_HEIGHT + 80

    // Reverse zoom and pan
    const adjustedX = (screenX - pan.x) / zoom
    const adjustedY = (screenY - pan.y) / zoom

    const x = (adjustedX - offsetX) / (Math.cos(ISO_ANGLE) * TILE_SIZE)
    const y = (adjustedY - offsetY) / (Math.sin(ISO_ANGLE) * TILE_SIZE)

    const worldX = (x + y) / 2
    const worldY = (y - x) / 2

    return {
      x: Math.floor(worldX),
      y: Math.floor(worldY)
    }
  }

  // Convert screen coordinates to wall coordinates (Left or Right wall)
  const screenToWall = (screenX: number, screenY: number): { x: number, y: number, z: number, wall: 'left' | 'right' | 'none' } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, z: 0, wall: 'none' }

    const offsetX = canvas.width / 2
    const offsetY = WALL_HEIGHT + 80

    // Reverse zoom and pan
    const adjustedX = (screenX - pan.x) / zoom
    const adjustedY = (screenY - pan.y) / zoom

    // Constants from projection
    const C = Math.cos(ISO_ANGLE) * TILE_SIZE
    const S = Math.sin(ISO_ANGLE) * TILE_SIZE

    // Left Wall (x=0):
    // adjustedX - offsetX = -y * C => y = -(adjustedX - offsetX) / C
    // adjustedY - offsetY = y * S - z => z = y * S - (adjustedY - offsetY)
    const leftY = -(adjustedX - offsetX) / C
    const leftZ = leftY * S - (adjustedY - offsetY)

    // Right Wall (y=0):
    // adjustedX - offsetX = x * C => x = (adjustedX - offsetX) / C
    // adjustedY - offsetY = x * S - z => z = x * S - (adjustedY - offsetY)
    const rightX = (adjustedX - offsetX) / C
    const rightZ = rightX * S - (adjustedY - offsetY)

    // Check bounds (strict clamping)
    const isLeft = leftY >= 0 && leftY <= ROOM_SIZE && leftZ >= 0 && leftZ <= WALL_HEIGHT
    const isRight = rightX >= 0 && rightX <= ROOM_SIZE && rightZ >= 0 && rightZ <= WALL_HEIGHT

    // Determine which wall is closer or valid
    if (isLeft && !isRight) return { x: 0, y: leftY, z: leftZ, wall: 'left' }
    if (isRight && !isLeft) return { x: rightX, y: 0, z: rightZ, wall: 'right' }

    if (isLeft && isRight) {
      // Corner case: prioritize based on mouse position relative to center line
      if (adjustedX < offsetX) return { x: 0, y: leftY, z: leftZ, wall: 'left' }
      return { x: rightX, y: 0, z: rightZ, wall: 'right' }
    }

    // If neither is strictly valid, find the closest valid wall point
    // Calculate distances to valid ranges
    const distLeftY = Math.max(0, -leftY, leftY - ROOM_SIZE)
    const distLeftZ = Math.max(0, -leftZ, leftZ - WALL_HEIGHT)
    const distLeft = distLeftY + distLeftZ

    const distRightX = Math.max(0, -rightX, rightX - ROOM_SIZE)
    const distRightZ = Math.max(0, -rightZ, rightZ - WALL_HEIGHT)
    const distRight = distRightX + distRightZ

    // Always clamp to the closer wall
    if (distLeft < distRight) {
      // Clamp to Left Wall
      const clampedY = Math.max(0, Math.min(ROOM_SIZE, leftY))
      const clampedZ = Math.max(0, Math.min(WALL_HEIGHT, leftZ))
      return { x: 0, y: clampedY, z: clampedZ, wall: 'left' }
    } else {
      // Clamp to Right Wall
      const clampedX = Math.max(0, Math.min(ROOM_SIZE, rightX))
      const clampedZ = Math.max(0, Math.min(WALL_HEIGHT, rightZ))
      return { x: clampedX, y: 0, z: clampedZ, wall: 'right' }
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

      // Calculate wall safety offset (MUST MATCH DRAWING LOGIC)
      let wallOffsetX = 0
      let wallOffsetY = 0

      if (item.x <= 1) wallOffsetX = 0.5
      if (item.y <= 1) wallOffsetY = 0.4
      if (item.y <= 1) wallOffsetX = 0.6
      if (item.x <= 1) wallOffsetY = 0.6

      if (furnitureData.id === 'couch') {
        if (item.x === 0) wallOffsetX = 0.8
        if (item.y === 0) wallOffsetY = 0.8
        if (item.x === 0 && item.y === 0) {
          wallOffsetX = 0.8
          wallOffsetY = 0.8
        }
      }

      const basePos = worldToScreen(
        item.x + furnitureData.width / 2 + wallOffsetX,
        item.y + furnitureData.height / 2 + wallOffsetY,
        item.z || 0
      )

      // Calculate actual render dimensions (matching the draw logic)
      let renderWidth, renderHeight
      const img = loadedImages.get(item.itemId)

      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        // Use same aspect ratio logic as drawing
        const baseWidth = furnitureData.width * TILE_SIZE * 1.5
        const baseHeight = (furnitureData.visualHeight || furnitureData.height) * TILE_SIZE * 2
        const imageAspectRatio = img.naturalWidth / img.naturalHeight

        // Apply scale per furniture type
        const imageScale = furnitureData.imageScale || 2

        if (imageAspectRatio > baseWidth / baseHeight) {
          renderWidth = baseWidth * imageScale * zoom
          renderHeight = (baseWidth / imageAspectRatio) * imageScale * zoom
        } else {
          renderHeight = baseHeight * imageScale * zoom
          renderWidth = (baseHeight * imageAspectRatio) * imageScale * zoom
        }
      } else {
        // Fallback to placeholder dimensions
        renderWidth = furnitureData.width * TILE_SIZE * 1.5 * zoom
        renderHeight = (furnitureData.visualHeight || furnitureData.height) * TILE_SIZE * 2 * zoom
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

  // Check collision for wall items
  const hasWallCollision = (x: number, y: number, z: number, width: number, height: number, excludeId?: string): boolean => {
    const isLeftWall = x === 0
    const isRightWall = y === 0

    return placedItems.some(item => {
      if (item.id === excludeId) return false
      const itemData = availableItems.find(i => i.id === item.itemId)
      if (!itemData || itemData.placementType !== 'wall') return false

      const itemIsLeft = item.x === 0
      const itemIsRight = item.y === 0

      // Dimensions of the existing item
      const itemWidth = itemData.width
      const itemHeight = itemData.visualHeight || itemData.height || 1

      // Check Left Wall Collision (Y-Z plane)
      if (isLeftWall && itemIsLeft) {
        const overlapY = (y < item.y + itemWidth) && (y + width > item.y)
        const overlapZ = (z < (item.z || 0) + itemHeight) && (z + height > (item.z || 0))
        if (overlapY && overlapZ) return true
      }

      // Check Right Wall Collision (X-Z plane)
      if (isRightWall && itemIsRight) {
        const overlapX = (x < item.x + itemWidth) && (x + width > item.x)
        const overlapZ = (z < (item.z || 0) + itemHeight) && (z + height > (item.z || 0))
        if (overlapX && overlapZ) return true
      }

      return false
    })
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
    console.log('Canvas resized', { width: canvas.width, height: canvas.height })

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw back wall
    ctx.save()
    const backWallGradient = ctx.createLinearGradient(0, 0, 0, WALL_HEIGHT)
    backWallGradient.addColorStop(0, wallColor.top)
    backWallGradient.addColorStop(1, wallColor.bottom)

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
    ctx.lineWidth = 2 * zoom
    ctx.stroke()
    ctx.restore()

    // Draw left wall
    ctx.save()
    const leftWallGradient = ctx.createLinearGradient(0, 0, 0, WALL_HEIGHT)
    leftWallGradient.addColorStop(0, wallColor.bottom)
    leftWallGradient.addColorStop(1, wallColor.bottom)

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
    ctx.lineWidth = 2 * zoom
    ctx.stroke()
    ctx.restore()

    // Draw floor as solid surface
    ctx.save()
    const floorP1 = worldToScreen(0, 0, 0)
    const floorP2 = worldToScreen(ROOM_SIZE, 0, 0)
    const floorP3 = worldToScreen(ROOM_SIZE, ROOM_SIZE, 0)
    const floorP4 = worldToScreen(0, ROOM_SIZE, 0)

    ctx.beginPath()
    ctx.moveTo(floorP1.x, floorP1.y)
    ctx.lineTo(floorP2.x, floorP2.y)
    ctx.lineTo(floorP3.x, floorP3.y)
    ctx.lineTo(floorP4.x, floorP4.y)
    ctx.closePath()

    // Solid floor color
    ctx.fillStyle = floorColor.light
    ctx.fill()
    ctx.restore()

    // Draw hover highlight for placement (iterate tiles for hover detection only)
    if (hoverTile && selectedItemType) {
      const item = availableItems.find(i => i.id === selectedItemType)
      if (item) {
        const x = hoverTile.x
        const y = hoverTile.y

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

        const isValid = isValidTile(x, y, item.width, item.height) &&
          !isWallPosition(x, y) &&
          !hasCollision(x, y, item.width, item.height)

        ctx.fillStyle = isValid ? 'rgba(50, 205, 50, 0.3)' : 'rgba(255, 0, 0, 0.3)'
        ctx.fill()
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

      // Calculate wall safety offset
      // If item is close to walls (x=1 or y=1), shift it slightly away
      let wallOffsetX = 0
      let wallOffsetY = 0

      if (item.x <= 1) wallOffsetX = 0.5 // Shift away from Left Wall (increased)
      if (item.y <= 1) wallOffsetY = 0.4 // Shift away from Right Wall

      // Extra safety: When touching Right Wall, ensure we don't clip Left Wall
      if (item.y <= 1) wallOffsetX = 0.6

      // Extra safety: When touching Left Wall, ensure we don't clip Right Wall
      if (item.x <= 1) wallOffsetY = 0.6

      // SPECIFIC FIX FOR COUCH OVERFLOW
      // The couch is large and tends to clip walls in the corner. We apply a stronger offset.
      if (furnitureData.id === 'couch') {
        if (item.x === 0) wallOffsetX = 0.8 // Push further from Left Wall
        if (item.y === 0) wallOffsetY = 0.8 // Push further from Right Wall

        // If in the deep corner (0,0), push it out even more diagonally
        if (item.x === 0 && item.y === 0) {
          wallOffsetX = 0.8
          wallOffsetY = 0.8
        }
      }

      const basePos = worldToScreen(
        item.x + furnitureData.width / 2 + wallOffsetX,
        item.y + furnitureData.height / 2 + wallOffsetY,
        item.z || 0
      )

      ctx.save()

      // Draw selection outline/effect around the item image if selected
      if (item.id === selectedItemId) {
        // Stronger glow effect to make it visible
        ctx.shadowColor = 'rgba(102, 51, 153, 1.0)' // Dark Purple (RebeccaPurple)
        ctx.shadowBlur = 15 * zoom // Increased blur for better visibility
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }

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
        const imageScale = furnitureData.imageScale || 2

        // Apply zoom to image scale so images scale with the room
        const scaledWidth = renderWidth * imageScale * zoom
        const scaledHeight = renderHeight * imageScale * zoom

        // Smart flipping logic
        // We want items to face AWAY from the nearest wall
        // The room has walls at x=0 (Left Wall) and y=0 (Right Wall)

        // Calculate distance to walls
        const distToLeftWall = item.x
        const distToRightWall = item.y

        const nativeFacing = furnitureData.facing || 'right'
        let shouldFlip = false

        // If closer to Left Wall (x < y), we should Face Left (Y-aligned) to run parallel to it
        // If closer to Right Wall (y < x), we should Face Right (X-aligned) to run parallel to it

        if (distToLeftWall < distToRightWall) {
          // Closer to Left Wall -> Face Right (Y-aligned) to run parallel to it
          // If native is Left, we must flip
          if (nativeFacing === 'left') shouldFlip = true
        } else {
          // Closer to Right Wall -> Face Left (X-aligned) to run parallel to it
          // If native is Right, we must flip
          if (nativeFacing === 'right') shouldFlip = true
        }

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
        const itemWidth = furnitureData.width * TILE_SIZE * 1.5 * zoom
        const itemHeight = (furnitureData.visualHeight || furnitureData.height) * TILE_SIZE * 2 * zoom

        ctx.fillStyle = furnitureData.color || '#888'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 10 * zoom
        ctx.shadowOffsetY = 5 * zoom

        ctx.fillRect(
          basePos.x - itemWidth / 2,
          basePos.y - itemHeight,
          itemWidth,
          itemHeight
        )

        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2 * zoom
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
        // For wall items, we don't check collision in the same way or need to check isValidTile for grid
        // But let's keep it simple
        const isWallItem = item.placementType === 'wall'
        let isValid = true

        if (isWallItem) {
          // Wall item validation
          const onWall = hoverTile.x === 0 || hoverTile.y === 0
          const hasCol = hasWallCollision(hoverTile.x, hoverTile.y, hoverTile.z || 0, item.width, item.visualHeight || item.height || 1)
          isValid = onWall && !hasCol
        } else {
          isValid = isValidTile(hoverTile.x, hoverTile.y, item.width, item.height) &&
            !isWallPosition(hoverTile.x, hoverTile.y) &&
            !hasCollision(hoverTile.x, hoverTile.y, item.width, item.height)
        }

        const basePos = worldToScreen(
          hoverTile.x + (isWallItem ? 0 : item.width / 2),
          hoverTile.y + (isWallItem ? 0 : item.height / 2),
          hoverTile.z || 0
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

          // Apply scale per furniture type
          const imageScale = item.imageScale || 2

          if (imageAspectRatio > baseWidth / baseHeight) {
            previewWidth = baseWidth * imageScale * zoom
            previewHeight = (baseWidth / imageAspectRatio) * imageScale * zoom
          } else {
            previewHeight = baseHeight * imageScale * zoom
            previewWidth = (baseHeight * imageAspectRatio) * imageScale * zoom
          }
        } else {
          previewWidth = item.width * TILE_SIZE * 1.5 * zoom
          previewHeight = (item.visualHeight || item.height) * TILE_SIZE * 2 * zoom
        }

        ctx.fillStyle = isValid ? (item.color || '#888') : '#ff0000'
        ctx.fillRect(
          basePos.x - previewWidth / 2,
          basePos.y - previewHeight,
          previewWidth,
          previewHeight
        )

        ctx.strokeStyle = isValid ? '#333' : '#aa0000'
        ctx.lineWidth = 2 * zoom
        ctx.strokeRect(
          basePos.x - previewWidth / 2,
          basePos.y - previewHeight,
          previewWidth,
          previewHeight
        )

        ctx.restore()
      }
    }

  }, [placedItems, availableItems, hoverTile, selectedItemType, loadedImages, zoom, pan, floorColor, wallColor])

  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // Check if we are placing a NEW item (hovering)
    const selectedItem = selectedItemType ? availableItems.find(i => i.id === selectedItemType) : null
    // Force wall item detection for known wall items if placementType check fails
    const isWallItem = selectedItem?.placementType === 'wall' ||
      (selectedItemType && (selectedItemType.includes('painting') || selectedItemType.includes('mirror')))

    if (isWallItem) {
      const wallPos = screenToWall(screenX, screenY)
      if (wallPos.wall !== 'none') {
        setHoverTile({ x: wallPos.x, y: wallPos.y, z: wallPos.z })
      } else {
        setHoverTile(null)
      }
    } else {
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
    }

    // Handle dragging EXISTING items
    if (draggedItem) {
      canvas.style.cursor = 'grabbing'
      const item = placedItems.find(i => i.id === draggedItem)
      const furnitureData = item ? availableItems.find(f => f.id === item.itemId) : null

      if (item && furnitureData) {
        // Determine if the dragged item is a wall item or floor item
        const isDraggedWallItem = furnitureData.placementType === 'wall'

        if (isDraggedWallItem) {
          // Wall Item Dragging Logic
          const wallPos = screenToWall(screenX, screenY)

          // If we are on a valid wall, update position
          if (wallPos.wall !== 'none') {
            onMoveItem(draggedItem, wallPos.x, wallPos.y, wallPos.z)
          }
        } else {
          // Floor Item Dragging Logic
          const world = screenToWorld(screenX, screenY)
          const clampedX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
          const clampedY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))

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
    if (selectedItemType) {
      console.log('🎯 Mouse placement mode active for:', selectedItemType)
      const item = availableItems.find(i => i.id === selectedItemType)
      if (!item) {
        console.error('❌ Item not found:', selectedItemType)
        return
      }

      if (item.placementType === 'wall') {
        // Wall item placement
        const wallPos = screenToWall(screenX, screenY)
        console.log('🖼️ Wall placement attempt:', wallPos)
        if (wallPos.wall !== 'none' && !hasWallCollision(wallPos.x, wallPos.y, wallPos.z || 0, item.width, item.visualHeight || item.height || 1)) {
          console.log('✅ Placing wall item at:', wallPos)
          onAddItem(selectedItemType, wallPos.x, wallPos.y, wallPos.z)
        } else {
          console.warn('⚠️ Wall placement validation failed')
        }
      } else {
        // Floor item placement
        const world = screenToWorld(screenX, screenY)
        const clampedPlaceX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
        const clampedPlaceY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))

        console.log('🏠 Floor placement attempt at:', { x: clampedPlaceX, y: clampedPlaceY })

        const validTile = isValidTile(clampedPlaceX, clampedPlaceY)
        const wallPos = isWallPosition(clampedPlaceX, clampedPlaceY)
        const collision = hasCollision(clampedPlaceX, clampedPlaceY, item.width, item.height)

        console.log('Validation:', { validTile, wallPos, collision })

        if (validTile && !wallPos && !collision) {
          console.log('✅ Placing floor item at:', { x: clampedPlaceX, y: clampedPlaceY })
          onAddItem(selectedItemType, clampedPlaceX, clampedPlaceY)
        } else {
          console.warn('⚠️ Floor placement validation failed:', { validTile, isWallPosition: wallPos, hasCollision: collision })
        }
      }
      return
    }

    // Check if clicking on an item using pixel-perfect detection
    const clickedItem = getItemAtScreenPos(screenX, screenY)

    if (clickedItem) {
      // Select the item
      setSelectedItemId(clickedItem.id)
      setDraggedItem(clickedItem.id)

      const furnitureData = availableItems.find(f => f.id === clickedItem.itemId)

      if (furnitureData?.placementType === 'wall') {
        setDragOffset({ x: 0, y: 0 })
      } else {
        const world = screenToWorld(screenX, screenY)
        const clampedWorldX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
        const clampedWorldY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))

        setDragOffset({ x: clampedWorldX - clickedItem.x, y: clampedWorldY - clickedItem.y })
      }
    } else {
      setSelectedItemId(null)
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

    const clickedItem = getItemAtScreenPos(screenX, screenY)

    if (clickedItem) {
      onRemoveItem(clickedItem.id)
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(3, zoom * zoomDelta))

    const zoomRatio = newZoom / zoom
    const newPanX = mouseX - (mouseX - pan.x) * zoomRatio
    const newPanY = mouseY - (mouseY - pan.y) * zoomRatio

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || e.touches.length === 0) return

    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      setLastPinchDistance(distance)
      setIsPanning(false)
      setDraggedItem(null)
      return
    }

    const touch = e.touches[0]
    const rect = canvas.getBoundingClientRect()
    const screenX = touch.clientX - rect.left
    const screenY = touch.clientY - rect.top

    // Placement Logic - Handle FIRST before double-tap detection
    if (selectedItemType) {
      console.log('🎯 Placement mode active for:', selectedItemType)
      const item = availableItems.find(i => i.id === selectedItemType)
      if (!item) {
        console.error('❌ Item not found:', selectedItemType)
        return
      }

      // Update hover tile to show preview immediately
      const isWallItem = item.placementType === 'wall' ||
        (selectedItemType.includes('painting') || selectedItemType.includes('mirror'))

      if (isWallItem) {
        const wallPos = screenToWall(screenX, screenY)
        console.log('🖼️ Wall placement attempt:', wallPos)
        if (wallPos.wall !== 'none') {
          setHoverTile({ x: wallPos.x, y: wallPos.y, z: wallPos.z })
          if (!hasWallCollision(wallPos.x, wallPos.y, wallPos.z, item.width, item.visualHeight || item.height || 1)) {
            console.log('✅ Placing wall item at:', wallPos)
            onAddItem(selectedItemType, wallPos.x, wallPos.y, wallPos.z)
          } else {
            console.warn('⚠️ Wall collision detected')
          }
        } else {
          console.warn('⚠️ Not on a valid wall')
        }
      } else {
        // Floor item placement
        const world = screenToWorld(screenX, screenY)
        const clampedX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
        const clampedY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))

        console.log('🏠 Floor placement attempt at:', { x: clampedX, y: clampedY })

        // Update hover tile immediately to show preview
        setHoverTile({ x: clampedX, y: clampedY })

        const validTile = isValidTile(clampedX, clampedY)
        const wallPos = isWallPosition(clampedX, clampedY)
        const collision = hasCollision(clampedX, clampedY, item.width, item.height)

        console.log('Validation:', { validTile, wallPos, collision })

        if (validTile && !wallPos && !collision) {
          console.log('✅ Placing floor item at:', { x: clampedX, y: clampedY })
          onAddItem(selectedItemType, clampedX, clampedY)
        } else {
          console.warn('⚠️ Placement validation failed:', { validTile, isWallPosition: wallPos, hasCollision: collision })
        }
      }
      return
    }

    const now = Date.now()
    const TAP_DELAY = 300

    if (lastTapTime && now - lastTapTime < TAP_DELAY && lastTapPos) {
      const dist = Math.sqrt(
        Math.pow(screenX - lastTapPos.x, 2) + Math.pow(screenY - lastTapPos.y, 2)
      )
      if (dist < 30) {
        const clickedItem = getItemAtScreenPos(screenX, screenY)
        if (clickedItem) {
          onRemoveItem(clickedItem.id)
        }
        setLastTapTime(0)
        setLastTapPos(null)
        return
      }
    }

    setLastTapTime(now)
    setLastTapPos({ x: screenX, y: screenY })

    // Selection / Dragging Logic
    const clickedItem = getItemAtScreenPos(screenX, screenY)

    if (clickedItem) {
      setDraggedItem(clickedItem.id)
      const furnitureData = availableItems.find(f => f.id === clickedItem.itemId)

      if (furnitureData?.placementType === 'wall') {
        setDragOffset({ x: 0, y: 0 })
      } else {
        const world = screenToWorld(screenX, screenY)
        const clampedX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
        const clampedY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))
        setDragOffset({ x: clampedX - clickedItem.x, y: clampedY - clickedItem.y })
      }
      setIsPanning(false)
    } else {
      setIsPanning(true)
      setPanStart({ x: screenX - pan.x, y: screenY - pan.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || e.touches.length === 0) return

    if (e.touches.length === 2 && lastPinchDistance) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      const rect = canvas.getBoundingClientRect()
      const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left
      const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top

      const zoomDelta = distance / lastPinchDistance
      const newZoom = Math.max(0.3, Math.min(3, zoom * zoomDelta))

      const zoomRatio = newZoom / zoom
      const newPanX = centerX - (centerX - pan.x) * zoomRatio
      const newPanY = centerY - (centerY - pan.y) * zoomRatio

      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
      setLastPinchDistance(distance)
      return
    }

    const touch = e.touches[0]
    const rect = canvas.getBoundingClientRect()
    const screenX = touch.clientX - rect.left
    const screenY = touch.clientY - rect.top

    if (isPanning && panStart) {
      setPan({
        x: screenX - panStart.x,
        y: screenY - panStart.y
      })
      return
    }

    // Hover Logic
    const selectedItem = selectedItemType ? availableItems.find(i => i.id === selectedItemType) : null
    const isWallItem = selectedItem?.placementType === 'wall' ||
      (selectedItemType && (selectedItemType.includes('painting') || selectedItemType.includes('mirror')))

    if (isWallItem) {
      const wallPos = screenToWall(screenX, screenY)
      if (wallPos.wall !== 'none') {
        setHoverTile({ x: wallPos.x, y: wallPos.y, z: wallPos.z })
      } else {
        setHoverTile(null)
      }
    } else {
      const world = screenToWorld(screenX, screenY)
      const clampedX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
      const clampedY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))

      if (isValidTile(clampedX, clampedY)) {
        setHoverTile({ x: clampedX, y: clampedY })
      } else {
        setHoverTile(null)
      }
    }

    // Dragging Logic
    if (draggedItem) {
      const item = placedItems.find(i => i.id === draggedItem)
      const furnitureData = item ? availableItems.find(f => f.id === item.itemId) : null

      if (item && furnitureData) {
        const isDraggedWallItem = furnitureData.placementType === 'wall'

        if (isDraggedWallItem) {
          // Wall Item Dragging
          const wallPos = screenToWall(screenX, screenY)
          if (wallPos.wall !== 'none') {
            onMoveItem(draggedItem, wallPos.x, wallPos.y, wallPos.z)
          }
        } else {
          // Floor Item Dragging
          const world = screenToWorld(screenX, screenY)
          const clampedX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.x)))
          const clampedY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(world.y)))

          let newX = clampedX - dragOffset.x
          let newY = clampedY - dragOffset.y

          newX = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(newX)))
          newY = Math.max(0, Math.min(ROOM_SIZE - 1, Math.floor(newY)))

          if (!isWallPosition(newX, newY) && !hasCollision(newX, newY, furnitureData.width, furnitureData.height, draggedItem)) {
            onMoveItem(draggedItem, newX, newY)
          }
        }
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setDraggedItem(null)
    setIsPanning(false)
    setPanStart(null)
    setLastPinchDistance(null)
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
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
      <div className="room-instructions">
        {selectedItemType ? 'Tap to place • Pinch to zoom • Drag to pan' : 'Tap to select • Drag to move • Double-tap to remove • Pinch to zoom'}
      </div>
    </div>
  )
}
