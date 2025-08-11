import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import VirtualizedItems from '../components/VirtualizedItems';

function Items() {
  const { items, fetchItems, isLoading: contextLoading } = useData();
  const [localLoading, setLocalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [useVirtualization, setUseVirtualization] = useState(false);

  const isLoading = contextLoading || localLoading;

  const pageSize = 10;

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const search = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search)
    );
  }, [items, searchTerm]);

  // Paginate filtered items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      // Always try to fetch items, let the context handle caching
      setError(null);
      
      try {
        await fetchItems();
      } catch (err) {
        if (isMounted) {
          setError('Failed to load items. Please try again.');
          console.error('Error fetching items:', err);
        }
      }
    };

    loadItems();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [fetchItems]);

  // Reset page when search results change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading items...</div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search items by name or category..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />
      </div>

      {/* Results Summary */}
      <div style={{ marginBottom: '20px', color: '#666' }}>
        {searchTerm ? (
          <p>Found {filteredItems.length} item(s) matching "{searchTerm}"</p>
        ) : (
          <p>Showing {filteredItems.length} item(s)</p>
        )}
      </div>

      {/* View Toggle */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span>View:</span>
        <button
          onClick={() => setUseVirtualization(false)}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: !useVirtualization ? '#3498db' : '#fff',
            color: !useVirtualization ? '#fff' : '#333',
            cursor: 'pointer'
          }}
        >
          Grid
        </button>
        <button
          onClick={() => setUseVirtualization(true)}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: useVirtualization ? '#3498db' : '#fff',
            color: useVirtualization ? '#fff' : '#333',
            cursor: 'pointer'
          }}
        >
          List (Virtualized)
        </button>
        {filteredItems.length > 50 && (
          <span style={{ fontSize: '12px', color: '#e74c3c', marginLeft: '10px' }}>
            ⚡ Large list detected - virtualization recommended
          </span>
        )}
      </div>

      {/* Items List */}
      {paginatedItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>No items found.</p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}>
              Clear search
            </button>
          )}
        </div>
      ) : useVirtualization ? (
        // Virtualized view for performance with large lists
        <VirtualizedItems items={filteredItems} height={600} />
      ) : (
        <>
          {/* Grid view with pagination */}
          <div style={{ 
            display: 'grid', 
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
          }}>
            {paginatedItems.map(item => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f9f9f9',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Link 
                  to={`/items/${item.id}`}
                  style={{ 
                    textDecoration: 'none', 
                    color: '#333',
                    display: 'block'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                    {item.name}
                  </h3>
                  <p style={{ margin: '4px 0', color: '#7f8c8d' }}>
                    Category: {item.category}
                  </p>
                  <p style={{ margin: '4px 0', fontWeight: 'bold', color: '#27ae60' }}>
                    ${item.price}
                  </p>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              marginTop: '30px', 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              
              <span style={{ margin: '0 10px' }}>
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* CSS for loading spinner */}
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

export default Items;