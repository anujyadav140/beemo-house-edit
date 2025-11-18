export type PlacementType = 'floor' | 'wall'

export interface FurnitureItem {
  id: string
  name: string
  category: 'furniture' | 'decor'
  imageUrl: string
  width: number  // Grid units in X direction (floor occupation)
  height: number // Grid units in Y direction (floor occupation)
  visualHeight?: number // Visual height for rendering (if different from floor height)
  placementType: PlacementType
  color?: string // For rendering placeholder shapes
  imageScale?: number // Scale factor for the image rendering
  facing?: 'left' | 'right' // Natural facing direction of the sprite
  defaultWallHeight?: number // Default height from floor for wall items
}

export interface PlacedItem {
  id: string
  itemId: string
  x: number
  y: number
  z?: number // Height from floor (for wall items)
  rotation: number
  placementType: PlacementType
}
