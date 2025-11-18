import { FurnitureItem } from '../../types'

interface ObjectSidebarProps {
    items: FurnitureItem[]
    onSelectItem: (itemId: string) => void
    selectedItemId: string | null
}

export default function ObjectSidebar({ items, onSelectItem, selectedItemId }: ObjectSidebarProps) {
    return (
        <div className="object-sidebar">
            <div className="sidebar-header">
                <h3>Furniture</h3>
            </div>
            <div className="items-container">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`sidebar-item ${selectedItemId === item.id ? 'selected' : ''}`}
                        onClick={() => onSelectItem(item.id)}
                    >
                        <div className="item-preview">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} />
                            ) : (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: item.color || '#ccc',
                                        borderRadius: '4px'
                                    }}
                                />
                            )}
                        </div>
                        <span className="item-name">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
