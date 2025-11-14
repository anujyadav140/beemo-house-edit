'use client'

import { useState, useEffect } from 'react'
import IsometricRoom from './components/IsometricRoom'
import type { FurnitureItem, PlacedItem } from '../types'

// Available furniture and decor items
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
    color: '#8B7355'
  },
  {
    id: 'table',
    name: 'Table',
    category: 'furniture',
    imageUrl: '/images/table.png',
    width: 1,
    height: 1,
    visualHeight: 1,
    placementType: 'floor',
    color: '#A0522D'
  },
  {
    id: 'chair',
    name: 'Chair',
    category: 'furniture',
    imageUrl: '/images/chair.png',
    width: 1,
    height: 1,
    visualHeight: 2,
    placementType: 'floor',
    color: '#D2691E'
  },
  {
    id: 'bed',
    name: 'Bed',
    category: 'furniture',
    imageUrl: '/images/bed.png',
    width: 1,
    height: 1,
    visualHeight: 2,
    placementType: 'floor',
    color: '#6495ED'
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    category: 'furniture',
    imageUrl: '/images/bookshelf.png',
    width: 1,
    height: 1,
    visualHeight: 3,
    placementType: 'floor',
    color: '#8B4513'
  },
  {
    id: 'rug',
    name: 'Rug',
    category: 'decor',
    imageUrl: '/images/rug.png',
    width: 1,
    height: 1,
    visualHeight: 0.5,
    placementType: 'floor',
    color: '#B22222'
  },
  {
    id: 'plant',
    name: 'Plant',
    category: 'decor',
    imageUrl: '/images/plant.png',
    width: 1,
    height: 1,
    visualHeight: 2,
    placementType: 'floor',
    color: '#228B22'
  },
  {
    id: 'lamp',
    name: 'Lamp',
    category: 'decor',
    imageUrl: '/images/lamp.png',
    width: 1,
    height: 1,
    visualHeight: 2,
    placementType: 'floor',
    color: '#FFD700'
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
    color: '#8B6914'
  },
  {
    id: 'sofa',
    name: 'Sofa',
    category: 'furniture',
    imageUrl: '/images/sofa.png',
    width: 1,
    height: 1,
    visualHeight: 2.5,
    placementType: 'floor',
    color: '#8B4513'
  },
]

// Extend Window interface for Flutter WebView communication
declare global {
  interface Window {
    setSelectedItem: (itemId: string) => void
    clearSelection: () => void
    getRoomState: () => PlacedItem[]
    clearRoom: () => void
    getAvailableItems: () => FurnitureItem[]
  }
}

export default function Home() {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null)

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
            window.postMessage(JSON.stringify({
              type: 'ROOM_STATE_RESPONSE',
              items: placedItems
            }), '*')
            break
          case 'GET_AVAILABLE_ITEMS':
            window.postMessage(JSON.stringify({
              type: 'AVAILABLE_ITEMS_RESPONSE',
              items: AVAILABLE_ITEMS
            }), '*')
            break
          case 'LOAD_STATE':
            // Load state sent from Flutter
            if (data.items && Array.isArray(data.items)) {
              setPlacedItems(data.items)
            }
            if (data.currentRoom) {
              // Can be used to sync current room if needed
              console.log('Current room:', data.currentRoom)
            }
            break
        }
      } catch (e) {
        console.error('Error handling message:', e)
      }
    }

    window.addEventListener('message', handleMessage)

    // Notify Flutter that the app is ready
    setTimeout(() => {
      window.postMessage(JSON.stringify({ type: 'READY' }), '*')
    }, 100)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [placedItems])

  const handleAddItem = (itemId: string, x: number, y: number) => {
    const furnitureData = AVAILABLE_ITEMS.find(item => item.id === itemId)
    if (!furnitureData) return

    const newItem: PlacedItem = {
      id: `${itemId}-${Date.now()}`,
      itemId,
      x,
      y,
      rotation: 0,
      placementType: furnitureData.placementType
    }
    setPlacedItems(items => [...items, newItem])
    setSelectedItemType(null)

    // Notify Flutter about item placement
    window.postMessage(JSON.stringify({
      type: 'ITEM_PLACED',
      item: newItem
    }), '*')
  }

  const handleMoveItem = (id: string, x: number, y: number) => {
    setPlacedItems(items => items.map(item =>
      item.id === id ? { ...item, x, y } : item
    ))

    // Notify Flutter about item movement
    window.postMessage(JSON.stringify({
      type: 'ITEM_MOVED',
      id,
      x,
      y
    }), '*')
  }

  const handleRemoveItem = (id: string) => {
    setPlacedItems(items => items.filter(item => item.id !== id))

    // Notify Flutter about item removal
    window.postMessage(JSON.stringify({
      type: 'ITEM_REMOVED',
      id
    }), '*')
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
      />
    </div>
  )
}
