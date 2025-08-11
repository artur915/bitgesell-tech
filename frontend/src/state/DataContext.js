import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        limit: '500', // Get all items for client-side operations
        page: '1',
        ...params
      });
      
      const res = await fetch(`http://localhost:3001/api/items?${searchParams}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Handle both old and new API response formats
      if (data.items && data.pagination) {
        setItems(data.items);
        setPagination(data.pagination);
      } else if (Array.isArray(data)) {
        // Fallback for old format
        setItems(data);
        setPagination(null);
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchItemById = useCallback(async (id) => {
    const res = await fetch(`http://localhost:3001/api/items/${id}`);
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Item not found');
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  }, []);

  const createItem = useCallback(async (itemData) => {
    const res = await fetch('http://localhost:3001/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${res.status}`);
    }

    const newItem = await res.json();
    
    // Add new item to current items list
    setItems(prev => [...prev, newItem]);
    
    return newItem;
  }, []);

  return (
    <DataContext.Provider value={{ 
      items, 
      pagination,
      isLoading,
      fetchItems, 
      fetchItemById,
      createItem
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);