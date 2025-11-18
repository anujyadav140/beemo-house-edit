'use client'

import { useState, useEffect, useRef } from 'react'
import IsometricRoom from './components/IsometricRoom'
import ObjectSidebar from './components/ObjectSidebar'
import { FurnitureItem, PlacedItem, PlacementType } from '@/types'

const AVAILABLE_ITEMS: FurnitureItem[] = [
  {
    id: 'couch',
    name: 'Couch',
    category: 'furniture',
    imageUrl: '/images/couch.png',
    width: 1,
    height: 1,
    visualHeight: 2,
    placementType: 'floor',
    color: '#8B7355',
    imageScale: 1.8,
    facing: 'left'
  },
  {
    id: 'desk',
    name: 'Desk',
    category: 'furniture',
    imageUrl: '/images/desk.png',
    width: 1,
    height: 1,
    visualHeight: 2,
    placementType: 'floor',
    color: '#8B6914',
    imageScale: 3,
    facing: 'right'
  },
  {
    id: 'arcade',
    name: 'Arcade',
    category: 'furniture',
    imageUrl: '/new images/arcade.png',
    width: 1.2,
    height: 1.2,
    visualHeight: 2.8,
    placementType: 'floor',
    color: '#FF6B6B',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'bed',
    name: 'Bed',
    category: 'furniture',
    imageUrl: '/new images/bed.png',
    width: 1.5,
    height: 1.5,
    visualHeight: 1.2,
    placementType: 'floor',
    color: '#C8A882',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'beemo_box',
    name: 'Beemo Box',
    category: 'decor',
    imageUrl: '/new images/beemo box.png',
    width: 0.8,
    height: 0.8,
    visualHeight: 1,
    placementType: 'floor',
    color: '#4ECDC4',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'chess_table',
    name: 'Chess Table',
    category: 'furniture',
    imageUrl: '/new images/chess table.png',
    width: 1,
    height: 1,
    visualHeight: 1.2,
    placementType: 'floor',
    color: '#8B4513',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'computer',
    name: 'Computer',
    category: 'furniture',
    imageUrl: '/new images/computer.png',
    width: 1,
    height: 1,
    visualHeight: 1.5,
    placementType: 'floor',
    color: '#708090',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    category: 'furniture',
    imageUrl: '/new images/kitchen.png',
    width: 3.75,
    height: 3.75,
    visualHeight: 6.25,
    placementType: 'floor',
    color: '#F5DEB3',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'music_box',
    name: 'Music Box',
    category: 'decor',
    imageUrl: '/new images/music box.png',
    width: 2.1,
    height: 2.1,
    visualHeight: 2.4,
    placementType: 'floor',
    color: '#DAA520',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'music_system',
    name: 'Music System',
    category: 'furniture',
    imageUrl: '/new images/music system.png',
    width: 3,
    height: 3,
    visualHeight: 5.4,
    placementType: 'floor',
    color: '#2F4F4F',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'music_system_white',
    name: 'Music System White',
    category: 'furniture',
    imageUrl: '/new images/music system - white.png',
    width: 3,
    height: 3,
    visualHeight: 5.4,
    placementType: 'floor',
    color: '#F5F5F5',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'pc_table',
    name: 'PC Table',
    category: 'furniture',
    imageUrl: '/new images/PC table.png',
    width: 1.2,
    height: 1.2,
    visualHeight: 1.5,
    placementType: 'floor',
    color: '#696969',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'piano',
    name: 'Piano',
    category: 'furniture',
    imageUrl: '/new images/piano.png',
    width: 1.5,
    height: 1.5,
    visualHeight: 2.2,
    placementType: 'floor',
    color: '#000000',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'plant',
    name: 'Plant',
    category: 'decor',
    imageUrl: '/new images/plant.png',
    width: 0.8,
    height: 0.8,
    visualHeight: 1.5,
    placementType: 'floor',
    color: '#228B22',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'tv',
    name: 'TV',
    category: 'furniture',
    imageUrl: '/new images/tv.png',
    width: 1.2,
    height: 1.2,
    visualHeight: 1.8,
    placementType: 'floor',
    color: '#000000',
    imageScale: 2,
    facing: 'left'
  },
  {
    id: 'mirror',
    name: 'Mirror',
    category: 'decor',
    imageUrl: '/images/mirror.png',
    width: 1,
    height: 1,
    visualHeight: 1,
    placementType: 'wall',
    defaultWallHeight: 1.5,
    imageScale: 1.5,
    facing: 'left'
  },
  {
    id: 'painting',
    name: 'Painting',
    category: 'decor',
    imageUrl: '/images/painting.png',
    width: 1,
    height: 1,
    visualHeight: 1,
    placementType: 'wall',
    defaultWallHeight: 1.5,
    imageScale: 2.5,
    facing: 'left'
  },
  {
    id: 'painting_bmo',
    name: 'BMO Painting',
    category: 'decor',
    imageUrl: '/images/painting_bmo.png',
    width: 1,
    height: 1,
    visualHeight: 1,
    placementType: 'wall',
    defaultWallHeight: 1.5,
    imageScale: 1.5,
    facing: 'left'
  },
  {
    id: 'painting_david',
    name: 'David Painting',
    category: 'decor',
    imageUrl: '/images/painting_david.png',
    width: 1,
    height: 1,
    visualHeight: 1,
    placementType: 'wall',
    defaultWallHeight: 1.5,
    imageScale: 1.5,
    facing: 'left'
  },
  {
    id: 'painting_creeper',
    name: 'Creeper Painting',
    category: 'decor',
    imageUrl: '/images/painting_creeper.png',
    width: 1,
    height: 1,
    visualHeight: 1,
    placementType: 'wall',
    defaultWallHeight: 1.5,
    imageScale: 1.5,
    facing: 'left'
  }
]

// Extend Window interface for Flutter WebView communication
declare global {
  interface Window {
    setSelectedItem: (itemId: string) => void
    clearSelection: () => void
    getRoomState: () => PlacedItem[]
    clearRoom: () => void
    getAvailableItems: () => FurnitureItem[]
    FlutterChannel?: {
      postMessage: (message: string) => void
    }
  }
}

// Helper function to send messages to Flutter
const sendToFlutter = (data: any) => {
  const message = JSON.stringify(data)

  // Try Flutter JavaScriptChannel first
  if (window.FlutterChannel && typeof window.FlutterChannel.postMessage === 'function') {
    window.FlutterChannel.postMessage(message)
    console.log('📤 Sent to Flutter via JavaScriptChannel:', data.type)
  } else {
    // Fallback to window.postMessage for local testing
    window.postMessage(message, '*')
    console.log('📤 Sent via window.postMessage:', data.type)
  }
}

// Helper function to adjust color brightness
const adjustColorBrightness = (color: string, percent: number): string => {
  // Convert hex to RGB
  const num = parseInt(color.replace('#', ''), 16)
  const r = (num >> 16) + Math.round(255 * percent)
  const g = ((num >> 8) & 0x00FF) + Math.round(255 * percent)
  const b = (num & 0x0000FF) + Math.round(255 * percent)

  // Clamp values and convert back to hex
  const newR = Math.max(0, Math.min(255, r))
  const newG = Math.max(0, Math.min(255, g))
  const newB = Math.max(0, Math.min(255, b))

  return '#' + ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')
}

export default function Home() {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [floorColor, setFloorColor] = useState<{ light: string, dark: string }>({
    light: '#f5e6d3',
    dark: '#e8d4b8'
  })
  const [wallColor, setWallColor] = useState<{ base: string, top: string, bottom: string }>({
    base: '#e8dcc8',
    top: '#f0e5d0',
    bottom: '#d4c4a8'
  })

  // Expose functions to Flutter WebView
  useEffect(() => {
    // Function to set selected item from Flutter
    window.setSelectedItem = (itemId: string) => {
      setSelectedItemType(itemId)
    }

    // Function to clear selection
    window.clearSelection = () => {
      setSelectedItemType(null)
    }

    // Function to get current room state
    window.getRoomState = () => {
      return placedItems
    }

    // Function to clear all items
    window.clearRoom = () => {
      setPlacedItems([])
    }

    // Function to get available items list
    window.getAvailableItems = () => {
      return AVAILABLE_ITEMS
    }

    // Listen for messages from Flutter via window.postMessage
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        switch (data.type) {
          case 'SELECT_ITEM':
            if (data.itemId) {
              setSelectedItemType(data.itemId)
            }
            break
          case 'CLEAR_SELECTION':
            setSelectedItemType(null)
            break
          case 'CLEAR_ROOM':
            setPlacedItems([])
            break
          case 'GET_ROOM_STATE':
            // Send back the current state
            sendToFlutter({
              type: 'ROOM_STATE_RESPONSE',
              items: placedItems
            })
            break
          case 'GET_AVAILABLE_ITEMS':
            sendToFlutter({
              type: 'AVAILABLE_ITEMS_RESPONSE',
              items: AVAILABLE_ITEMS
            })
            break
          case 'LOAD_STATE':
            // Load state sent from Flutter
            if (data.items && Array.isArray(data.items)) {
              setPlacedItems(data.items)
              setIsReady(true)
              console.log('✅ Loaded state from Flutter:', data.items.length, 'items')
            }
            if (data.currentRoom) {
              // Can be used to sync current room if needed
              console.log('📍 Current room:', data.currentRoom)
            }
            break
          case 'CHANGE_FLOOR_COLOR':
            // Change floor color sent from Flutter
            if (data.light && data.dark) {
              setFloorColor({ light: data.light, dark: data.dark })
              console.log('🎨 Floor color changed:', data.light, data.dark)
            } else if (data.color) {
              // Single color - create light and dark variants
              const baseColor = data.color
              setFloorColor({
                light: baseColor,
                dark: adjustColorBrightness(baseColor, -0.15)
              })
              console.log('🎨 Floor color changed to:', baseColor)
            }
            break
          case 'CHANGE_WALL_COLOR':
            // Change wall color sent from Flutter
            if (data.base && data.top && data.bottom) {
              setWallColor({
                base: data.base,
                top: data.top,
                bottom: data.bottom
              })
              console.log('🎨 Wall color changed:', data.base, data.top, data.bottom)
            }
            break
        }
      } catch (e) {
        console.error('Error handling message:', e)
      }
    }

    window.addEventListener('message', handleMessage)

    // Notify Flutter that the app is ready (only once on mount)
    if (!isReady) {
      setTimeout(() => {
        sendToFlutter({ type: 'READY' })
      }, 100)
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, []) // Empty dependency array - only run once on mount

  const handleAddItem = (itemId: string, x: number, y: number, z?: number) => {
    const furnitureData = AVAILABLE_ITEMS.find(item => item.id === itemId)
    if (!furnitureData) return

    const newItem: PlacedItem = {
      id: `${itemId}-${Date.now()}`,
      itemId,
      x,
      y,
      z,
      rotation: 0,
      placementType: furnitureData.placementType
    }
    setPlacedItems(items => [...items, newItem])
    setSelectedItemType(null)

    // Notify Flutter about item placement
    sendToFlutter({
      type: 'ITEM_PLACED',
      item: newItem
    })
  }

  const handleMoveItem = (id: string, x: number, y: number, z?: number) => {
    setPlacedItems(items => items.map(item =>
      item.id === id ? { ...item, x, y, z } : item
    ))

    // Notify Flutter about item movement
    sendToFlutter({
      type: 'ITEM_MOVED',
      id,
      x,
      y,
      z
    })
  }

  const handleRemoveItem = (id: string) => {
    setPlacedItems(items => items.filter(item => item.id !== id))

    // Notify Flutter about item removal
    sendToFlutter({
      type: 'ITEM_REMOVED',
      id
    })
  }

  return (
    <div className="app" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <IsometricRoom
        placedItems={placedItems}
        availableItems={AVAILABLE_ITEMS}
        selectedItemType={selectedItemType}
        onAddItem={handleAddItem}
        onMoveItem={handleMoveItem}
        onRemoveItem={handleRemoveItem}
        floorColor={floorColor}
        wallColor={wallColor}
      />
      <ObjectSidebar
        items={AVAILABLE_ITEMS}
        onSelectItem={(id) => setSelectedItemType(id === selectedItemType ? null : id)}
        selectedItemId={selectedItemType}
      />
    </div>
  )
}
