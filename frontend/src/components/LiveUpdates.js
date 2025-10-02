import React, { useState, useEffect } from 'react';
import { useProductSocket } from '../hooks/useSocket';

const LiveUpdates = ({ className = '' }) => {
  const {
    isConnected,
    connectionError,
    productUpdates,
    stockUpdates,
    priceUpdates,
    userActivity,
    clearUpdates
  } = useProductSocket();

  const [showUpdates, setShowUpdates] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Count unread updates
  useEffect(() => {
    const total = productUpdates.length + stockUpdates.size + priceUpdates.size + userActivity.length;
    if (total > 0 && !showUpdates) {
      setUnreadCount(total);
    } else if (showUpdates) {
      setUnreadCount(0);
    }
  }, [productUpdates, stockUpdates, priceUpdates, userActivity, showUpdates]);

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get all updates sorted by timestamp
  const getAllUpdates = () => {
    const updates = [];

    // Add stock updates
    stockUpdates.forEach((update, productId) => {
      updates.push({
        id: `stock-${productId}-${update.timestamp}`,
        type: 'stock_update',
        productId,
        ...update,
        message: `Stock updated for product ${productId.slice(-8)}: ${update.previousStock} → ${update.newStock}`
      });
    });

    // Add price updates
    priceUpdates.forEach((update, productId) => {
      updates.push({
        id: `price-${productId}-${update.timestamp}`,
        type: 'price_update',
        productId,
        ...update,
        message: `Price updated for product ${productId.slice(-8)}: $${update.previousPrice} → $${update.newPrice}`
      });
    });

    // Add product updates
    productUpdates.forEach(update => {
      updates.push({
        ...update,
        id: `product-${update.timestamp}`,
        message: update.type === 'new_product' 
          ? `New product added: ${update.product?.name || 'Unknown'}`
          : `Product updated: ${update.changes?.join(', ') || 'Multiple fields'}`
      });
    });

    // Add user activity
    userActivity.forEach(activity => {
      updates.push({
        ...activity,
        id: `activity-${activity.timestamp}`,
        type: 'user_activity',
        message: activity.type === 'purchase'
          ? `${activity.quantity} ${activity.productName} purchased`
          : `User activity: ${activity.type}`
      });
    });

    return updates.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  };

  const allUpdates = getAllUpdates();

  if (!isConnected && !connectionError) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
          <span className="text-yellow-700 text-sm">Connecting to live updates...</span>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-red-700 text-sm">Connection error: {connectionError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={() => setShowUpdates(!showUpdates)}
      >
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="font-medium text-gray-900">Live Updates</span>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transform transition-transform ${showUpdates ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Updates List */}
      {showUpdates && (
        <div className="max-h-80 overflow-y-auto">
          {allUpdates.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No recent updates
            </div>
          ) : (
            <div className="space-y-1">
              {allUpdates.map((update) => (
                <div
                  key={update.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    getUpdateStyle(update.type)
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getIndicatorColor(update.type)}`}></div>
                      <span className="text-sm text-gray-900">{update.message}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(update.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {showUpdates && allUpdates.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              clearUpdates();
              setUnreadCount(0);
            }}
            className="w-full text-xs text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear all updates
          </button>
        </div>
      )}
    </div>
  );
};

// Helper functions for styling
const getUpdateStyle = (type) => {
  switch (type) {
    case 'stock_update':
      return 'border-l-4 border-l-blue-500';
    case 'price_update':
      return 'border-l-4 border-l-green-500';
    case 'new_product':
      return 'border-l-4 border-l-purple-500';
    case 'user_activity':
      return 'border-l-4 border-l-orange-500';
    default:
      return 'border-l-4 border-l-gray-300';
  }
};

const getIndicatorColor = (type) => {
  switch (type) {
    case 'stock_update':
      return 'bg-blue-500';
    case 'price_update':
      return 'bg-green-500';
    case 'new_product':
      return 'bg-purple-500';
    case 'user_activity':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

export default LiveUpdates;
