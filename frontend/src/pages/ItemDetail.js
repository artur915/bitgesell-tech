import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../state/DataContext';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchItemById } = useData();

  useEffect(() => {
    let isMounted = true;

    const loadItem = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const itemData = await fetchItemById(id);
        
        if (isMounted) {
          setItem(itemData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          console.error('Error fetching item:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [id, fetchItemById]);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <div style={{ marginTop: '20px' }}>
          <Link to="/" style={{ 
            textDecoration: 'none', 
            color: '#3498db',
            marginRight: '15px'
          }}>
            ← Back to Items
          </Link>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              border: '1px solid #3498db',
              borderRadius: '4px',
              backgroundColor: '#3498db',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading item details...</div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Item Not Found</h2>
        <p>The requested item could not be found.</p>
        <Link to="/" style={{ 
          textDecoration: 'none', 
          color: '#3498db'
        }}>
          ← Back to Items
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ 
          textDecoration: 'none', 
          color: '#3498db',
          fontSize: '14px'
        }}>
          ← Back to Items
        </Link>
      </div>

      {/* Item Details Card */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '30px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 20px 0', 
          color: '#2c3e50',
          fontSize: '2em'
        }}>
          {item.name}
        </h1>
        
        <div style={{ marginBottom: '15px' }}>
          <span style={{ 
            fontWeight: 'bold', 
            color: '#34495e',
            display: 'inline-block',
            minWidth: '80px'
          }}>
            Category:
          </span>
          <span style={{ 
            color: '#7f8c8d',
            backgroundColor: '#ecf0f1',
            padding: '4px 8px',
            borderRadius: '4px',
            marginLeft: '10px'
          }}>
            {item.category}
          </span>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <span style={{ 
            fontWeight: 'bold', 
            color: '#34495e',
            display: 'inline-block',
            minWidth: '80px'
          }}>
            Price:
          </span>
          <span style={{ 
            color: '#27ae60',
            fontSize: '1.5em',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}>
            ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
          </span>
        </div>

        {item.id && (
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#95a5a6' }}>
            Item ID: {item.id}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;