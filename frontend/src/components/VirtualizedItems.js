import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Link } from 'react-router-dom';

const ITEM_HEIGHT = 100; // Height of each item in pixels

const ItemRenderer = ({ index, style, data }) => {
  const item = data[index];
  
  return (
    <div style={style}>
      <div style={{
        margin: '4px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#f9f9f9',
        height: ITEM_HEIGHT - 8, // Account for margin
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link 
          to={`/items/${item.id}`}
          style={{ 
            textDecoration: 'none', 
            color: '#333',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '16px' }}>
              {item.name}
            </h3>
            <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px' }}>
              {item.category}
            </p>
          </div>
          <div style={{ 
            fontWeight: 'bold', 
            color: '#27ae60',
            fontSize: '18px',
            marginLeft: '16px'
          }}>
            ${item.price}
          </div>
        </Link>
      </div>
    </div>
  );
};

const VirtualizedItems = ({ items, height = 400 }) => {
  const itemData = useMemo(() => items, [items]);

  if (!items || items.length === 0) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <p>No items to display</p>
      </div>
    );
  }

  return (
    <div style={{ 
      height, 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={ITEM_HEIGHT}
        itemData={itemData}
        overscanCount={5} // Render a few extra items for smoother scrolling
      >
        {ItemRenderer}
      </List>
    </div>
  );
};

export default VirtualizedItems;
