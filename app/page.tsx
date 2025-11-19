'use client'

import { useState, useEffect, useRef } from 'react'
import IsometricRoom from './components/IsometricRoom'
import ObjectSidebar from './components/ObjectSidebar'
import { FurnitureItem, PlacedItem, PlacementType } from '@/types'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

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
  const [isWebView, setIsWebView] = useState(false)
  const [houseId, setHouseId] = useState<string | null>(null)
  const [roomName, setRoomName] = useState<string>('living_room')
  const [firebaseInitialized, setFirebaseInitialized] = useState(false)
  const isLoadingFromFirebase = useRef(false)

  // Detect if running in a WebView
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    // Check for common WebView indicators or Flutter specific injection
    const isFlutter = (window as any).flutter_inappwebview || userAgent.includes('wv') || userAgent.includes('flutter')
    setIsWebView(!!isFlutter)
  }, [])

  // Load objects from Firebase when houseId and roomName are available
  useEffect(() => {
    if (!houseId || !roomName) return

    console.log(`🔥 Loading room state from Firebase: ${houseId}/${roomName}`)

    const roomDocRef = doc(db, 'houses', houseId, 'rooms', roomName)

    // Set up real-time listener
    const unsubscribe = onSnapshot(roomDocRef, (docSnapshot) => {
      isLoadingFromFirebase.current = true

      if (docSnapshot.exists()) {
        const data = docSnapshot.data()
        const furnitureItems = data.furniture_items || []
        const floorColorData = data.floor_color || '#f5e6d3'
        const wallColorData = data.wall_color || '#e8dcc8'

        console.log(`✅ Loaded ${furnitureItems.length} items from Firebase`)
        setPlacedItems(furnitureItems)

        // Set floor color
        setFloorColor({
          light: floorColorData,
          dark: adjustColorBrightness(floorColorData, -0.15)
        })

        // Set wall color
        const topColor = adjustColorBrightness(wallColorData, 0.1)
        const bottomColor = adjustColorBrightness(wallColorData, -0.1)
        setWallColor({
          base: wallColorData,
          top: topColor,
          bottom: bottomColor
        })

        setFirebaseInitialized(true)
      } else {
        console.log('📭 No room data found in Firebase, starting fresh')
        setFirebaseInitialized(true)
      }

      // Reset the loading flag after a short delay to allow React to update
      setTimeout(() => {
        isLoadingFromFirebase.current = false
      }, 100)
    }, (error) => {
      console.error('❌ Error loading from Firebase:', error)
      setFirebaseInitialized(true)
      isLoadingFromFirebase.current = false
    })

    return () => unsubscribe()
  }, [houseId, roomName])

  // Save objects to Firebase when they change (debounced)
  useEffect(() => {
    if (!houseId || !roomName || !firebaseInitialized) return

    // Don't save if currently loading from Firebase (prevents circular updates)
    if (isLoadingFromFirebase.current) {
      console.log('⏸️  Skipping save - currently loading from Firebase')
      return
    }

    const saveTimeout = setTimeout(async () => {
      try {
        const roomDocRef = doc(db, 'houses', houseId, 'rooms', roomName)
        await setDoc(roomDocRef, {
          furniture_items: placedItems,
          floor_color: floorColor.light,
          wall_color: wallColor.base,
          last_modified: new Date().toISOString()
        }, { merge: true })

        console.log(`💾 Saved ${placedItems.length} items to Firebase`)
      } catch (error) {
        console.error('❌ Error saving to Firebase:', error)
      }
    }, 500) // Debounce saves by 500ms

    return () => clearTimeout(saveTimeout)
  }, [placedItems, houseId, roomName, floorColor, wallColor, firebaseInitialized])
  // Expose functions to Flutter WebView
  useEffect(() => {
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
          case 'INIT':
            // Initialize with houseId and roomName from Flutter
            if (data.houseId) {
              console.log('🏠 Received INIT from Flutter:', data.houseId, data.roomName || 'living_room')
              setHouseId(data.houseId)
              setRoomName(data.roomName || 'living_room')
              setIsReady(true)
            }
            break
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
            // Accept houseId and roomName from LOAD_STATE message (legacy support)
            if (data.houseId) {
              console.log('🏠 Received houseId from LOAD_STATE:', data.houseId)
              setHouseId(data.houseId)
              setRoomName(data.currentRoom || 'living_room')
            }
            // Note: We no longer directly set placedItems here since Firebase will handle it
            // But keep backward compatibility if Firebase data doesn't exist
            if (data.items && Array.isArray(data.items) && !houseId) {
              setPlacedItems(data.items)
              console.log('✅ Loaded state from Flutter (fallback):', data.items.length, 'items')
            }
            setIsReady(true)
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
  }, [placedItems, isReady])

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
      {!isWebView && (
        <ObjectSidebar
          items={AVAILABLE_ITEMS}
          onSelectItem={(id) => setSelectedItemType(id === selectedItemType ? null : id)}
          selectedItemId={selectedItemType}
        />
      )}
    </div>
  )
}
