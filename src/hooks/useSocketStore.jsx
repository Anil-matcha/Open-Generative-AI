import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * @typedef {Object} Collaborator
 * @property {string} id - Unique collaborator identifier
 * @property {string} name - Collaborator name
 * @property {string} avatar - Avatar URL
 * @property {string} color - Collaborator color (for cursors/highlights)
 * @property {boolean} isOnline - Whether collaborator is online
 * @property {Date} lastSeen - Last seen timestamp
 * @property {Object} cursor - Current cursor position {x, y, scene}
 */

/**
 * @typedef {Object} CollaborationEvent
 * @property {string} id - Unique event identifier
 * @property {string} type - Event type ('cursor-move', 'element-update', 'scene-change')
 * @property {string} userId - User who triggered the event
 * @property {Object} data - Event data
 * @property {Date} timestamp - Event timestamp
 */

/**
 * @typedef {Object} SocketState
 * @property {boolean} isConnected - Whether socket is connected
 * @property {Collaborator[]} collaborators - List of collaborators
 * @property {CollaborationEvent[]} recentEvents - Recent collaboration events
 * @property {string|null} roomId - Current collaboration room ID
 * @property {boolean} isHost - Whether current user is room host
 * @property {string|null} connectionError - Connection error message
 * @property {number} reconnectAttempts - Number of reconnection attempts
 */

/**
 * Real-time collaboration state hook
 * @param {string} userId - Current user ID
 * @param {string} userName - Current user name
 * @returns {Object} Socket store with state and actions
 */
export const useSocketStore = (userId, userName) => {
  const [state, setState] = useState({
    isConnected: false,
    collaborators: [],
    recentEvents: [],
    roomId: null,
    isHost: false,
    connectionError: null,
    reconnectAttempts: 0
  });

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Initialize socket connection
  const connect = useCallback((roomId) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Mock WebSocket connection - replace with actual WebSocket URL
      const wsUrl = `ws://localhost:8080/ws?room=${roomId}&user=${userId}`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          roomId,
          connectionError: null,
          reconnectAttempts: 0
        }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          sendMessage('heartbeat', { timestamp: Date.now() });
        }, 30000); // 30 seconds

        // Join room
        sendMessage('join-room', {
          userId,
          userName,
          roomId
        });
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, isConnected: false }));

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt reconnection
        attemptReconnect(roomId);
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          connectionError: 'Connection failed'
        }));
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        connectionError: error.message
      }));
    }
  }, [userId, userName]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      collaborators: [],
      recentEvents: [],
      roomId: null,
      isHost: false
    }));
  }, []);

  const attemptReconnect = useCallback((roomId) => {
    if (state.reconnectAttempts >= 5) {
      setState(prev => ({
        ...prev,
        connectionError: 'Failed to reconnect after 5 attempts'
      }));
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);

    reconnectTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
      connect(roomId);
    }, delay);
  }, [state.reconnectAttempts, connect]);

  const sendMessage = useCallback((type, data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data: {
          ...data,
          userId,
          timestamp: new Date()
        }
      };
      socketRef.current.send(JSON.stringify(message));
    }
  }, [userId]);

  const handleMessage = useCallback((message) => {
    const { type, data } = message;

    switch (type) {
      case 'room-joined':
        setState(prev => ({
          ...prev,
          collaborators: data.collaborators || [],
          isHost: data.isHost || false
        }));
        break;

      case 'user-joined':
        setState(prev => ({
          ...prev,
          collaborators: [...prev.collaborators, data.user]
        }));
        addEvent('user-joined', data.user.name + ' joined the session');
        break;

      case 'user-left':
        setState(prev => ({
          ...prev,
          collaborators: prev.collaborators.filter(c => c.id !== data.userId)
        }));
        addEvent('user-left', data.userName + ' left the session');
        break;

      case 'cursor-move':
        updateCollaboratorCursor(data.userId, data.cursor);
        break;

      case 'element-update':
        addEvent('element-update', `${data.userName} updated ${data.elementType}`);
        // Emit event for other stores to handle
        emitCollaborationEvent('element-update', data);
        break;

      case 'scene-change':
        addEvent('scene-change', `${data.userName} changed to scene "${data.sceneName}"`);
        emitCollaborationEvent('scene-change', data);
        break;

      case 'project-sync':
        emitCollaborationEvent('project-sync', data);
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }, []);

  const updateCollaboratorCursor = useCallback((userId, cursor) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.map(c =>
        c.id === userId ? { ...c, cursor, lastSeen: new Date() } : c
      )
    }));
  }, []);

  const addEvent = useCallback((type, description) => {
    const event = {
      id: `event-${Date.now()}`,
      type,
      description,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      recentEvents: [event, ...prev.recentEvents.slice(0, 49)] // Keep last 50 events
    }));
  }, []);

  // Collaboration event emitter (simplified - in real app, use proper event system)
  const collaborationListeners = useRef(new Map());

  const onCollaborationEvent = useCallback((eventType, callback) => {
    if (!collaborationListeners.current.has(eventType)) {
      collaborationListeners.current.set(eventType, new Set());
    }
    collaborationListeners.current.get(eventType).add(callback);

    return () => {
      const listeners = collaborationListeners.current.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }, []);

  const emitCollaborationEvent = useCallback((eventType, data) => {
    const listeners = collaborationListeners.current.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in collaboration event listener:', error);
        }
      });
    }
  }, []);

  // Broadcast user actions
  const broadcastCursorMove = useCallback((cursor) => {
    sendMessage('cursor-move', { cursor });
  }, [sendMessage]);

  const broadcastElementUpdate = useCallback((elementId, elementType, changes) => {
    sendMessage('element-update', {
      elementId,
      elementType,
      changes,
      userName
    });
  }, [sendMessage, userName]);

  const broadcastSceneChange = useCallback((sceneId, sceneName) => {
    sendMessage('scene-change', {
      sceneId,
      sceneName,
      userName
    });
  }, [sendMessage, userName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    ...state,

    // Connection actions
    connect,
    disconnect,

    // Broadcast actions
    broadcastCursorMove,
    broadcastElementUpdate,
    broadcastSceneChange,

    // Event system
    onCollaborationEvent,

    // Utilities
    getCollaboratorById: (id) => state.collaborators.find(c => c.id === id),
    getOnlineCollaborators: () => state.collaborators.filter(c => c.isOnline),
    isUserHost: () => state.isHost
  };
};