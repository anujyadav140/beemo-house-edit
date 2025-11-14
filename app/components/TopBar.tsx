interface TopBarProps {
  coins: number
}

export default function TopBar({ coins }: TopBarProps) {
  return (
    <div className="top-bar">
      <div className="top-left">
        <div className="shop-icon">🏪</div>
        <div className="paint-icon">🎨</div>
      </div>
      <div className="top-right">
        <div className="house-icon">🏠</div>
        <div className="coins-display">
          <span className="coins-amount">{coins}</span>
          <span className="coin-icon">🪙</span>
        </div>
      </div>
    </div>
  )
}
