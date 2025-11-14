interface RoomSelectorProps {
  currentRoom: string
  onRoomChange: (direction: 'prev' | 'next') => void
}

export default function RoomSelector({ currentRoom, onRoomChange }: RoomSelectorProps) {
  return (
    <div className="room-selector">
      <button className="room-nav-btn" onClick={() => onRoomChange('prev')}>
        ‹
      </button>
      <div className="room-name">{currentRoom}</div>
      <button className="room-nav-btn" onClick={() => onRoomChange('next')}>
        ›
      </button>
    </div>
  )
}
