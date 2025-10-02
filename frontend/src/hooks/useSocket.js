import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const useSocket = (options = {}) => {
  const {
    autoConnect = true,
    namespace = '/',
    enableAuth = false
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);
  const socketRef = useRef(null);
  const eventListenersRef = useRef(new Map());

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting to WebSocket server...', SOCKET_URL);

    const socketOptions = {
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000
    };

    // Add auth token if required
    if (enableAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        socketOptions.auth = { token };
      }
    }

    socketRef.current = io(SOCKET_URL + namespace, socketOptions);

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('WebSocket connected:', socketRef.current.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        console.log('Manual disconnect, not auto-reconnecting');
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });

    socketRef.current.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection failed:', error);
      setConnectionError(error.message);
    });

    // Re-register any existing event listeners
    eventListenersRef.current.forEach((listener, event) => {
      if (socketRef.current) {
        socketRef.current.on(event, listener);
      }
    });

  }, [namespace, enableAuth]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionError(null);
    }
  }, []);

  // Generic event listener
  const on = useCallback((event, listener) => {
    if (socketRef.current) {
      socketRef.current.on(event, listener);
      eventListenersRef.current.set(event, listener);
    }
    return () => off(event, listener);
  }, []);

  // Remove event listener
  const off = useCallback((event, listener) => {
    if (socketRef.current) {
      if (listener) {
        socketRef.current.off(event, listener);
      } else {
        socketRef.current.off(event);
      }
      eventListenersRef.current.delete(event);
    }
  }, []);

  // Emit event
  const emit = useCallback((event, data, callback) => {
    if (socketRef.current && socketRef.current.connected) {
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
      return true;
    }
    console.warn('Cannot emit - socket not connected');
    return false;
  }, []);

  // Join room
  const joinRoom = useCallback((roomId) => {
    return emit('join_room', { roomId });
  }, [emit]);

  // Leave room
  const leaveRoom = useCallback((roomId) => {
    return emit('leave_room', { roomId });
  }, [emit]);

  // Initialize connection
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        eventListenersRef.current.clear();
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect, connect]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    lastActivity,
    connect,
    disconnect,
    on,
    off,
    emit,
    joinRoom,
    leaveRoom
  };
};

// Hook specifically for product updates
export const useProductSocket = () => {
  const socket = useSocket({ autoConnect: true });
  const [productUpdates, setProductUpdates] = useState([]);
  const [stockUpdates, setStockUpdates] = useState(new Map());
  const [priceUpdates, setPriceUpdates] = useState(new Map());
  const [userActivity, setUserActivity] = useState([]);

  // Product-specific event handlers
  useEffect(() => {
    if (!socket.isConnected) return;

    // Listen for stock updates
    const handleStockUpdate = (data) => {
      console.log('Stock update received:', data);
      setStockUpdates(prev => new Map(prev.set(data.productId, {
        newStock: data.newStock,
        previousStock: data.previousStock,
        timestamp: Date.now()
      })));
    };

    // Listen for price updates
    const handlePriceUpdate = (data) => {
      console.log('Price update received:', data);
      setPriceUpdates(prev => new Map(prev.set(data.productId, {
        newPrice: data.newPrice,
        previousPrice: data.previousPrice,
        timestamp: Date.now()
      })));
    };

    // Listen for new products
    const handleNewProduct = (data) => {
      console.log('New product added:', data);
      setProductUpdates(prev => [...prev.slice(-9), {
        type: 'new_product',
        product: data.product,
        timestamp: Date.now()
      }]);
    };

    // Listen for general product updates
    const handleProductUpdate = (data) => {
      console.log('Product update received:', data);
      setProductUpdates(prev => [...prev.slice(-9), {
        type: 'product_update',
        productId: data.productId,
        changes: data.changes,
        timestamp: Date.now()
      }]);
    };

    // Listen for user activity
    const handleUserActivity = (data) => {
      console.log('User activity:', data);
      setUserActivity(prev => [...prev.slice(-19), {
        ...data,
        timestamp: Date.now()
      }]);
    };

    // Register event listeners
    const cleanupFunctions = [
      socket.on('stock_update', handleStockUpdate),
      socket.on('price_update', handlePriceUpdate),
      socket.on('new_product', handleNewProduct),
      socket.on('product_update', handleProductUpdate),
      socket.on('user_activity', handleUserActivity)
    ];

    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };

  }, [socket.isConnected, socket.on]);

  // Join product room
  const joinProductRoom = useCallback((productId) => {
    return socket.joinRoom(`product_${productId}`);
  }, [socket.joinRoom]);

  // Leave product room
  const leaveProductRoom = useCallback((productId) => {
    return socket.leaveRoom(`product_${productId}`);
  }, [socket.leaveRoom]);

  // Clear old updates
  const clearUpdates = useCallback(() => {
    setProductUpdates([]);
    setStockUpdates(new Map());
    setPriceUpdates(new Map());
    setUserActivity([]);
  }, []);

  return {
    ...socket,
    productUpdates,
    stockUpdates,
    priceUpdates,
    userActivity,
    joinProductRoom,
    leaveProductRoom,
    clearUpdates
  };
};

export default useSocket;
