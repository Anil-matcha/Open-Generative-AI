/**
 * WebSocket Service - Handles real-time polling and updates for long-running AI tasks
 */
export class MonitoringService {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.pollingTasks = new Map();
    this.eventListeners = new Map();
    this.heartbeatInterval = null;
    this.url = null;
  }

  /**
   * Start the monitoring service
   */
  async start() {
    // Skip WebSocket connection in development
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.log('[MonitoringService] Skipping WebSocket connection in development mode');
      return;
    }

    // Only connect in production or when explicitly needed
    await this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  async connect(url = null) {
    if (this.connected) return;

    this.url = url || this.getWebSocketUrl();

    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onclose = this.onClose.bind(this);
      this.ws.onerror = this.onError.bind(this);

      // Wait for connection with timeout
      await this.waitForConnection(5000);

    } catch (error) {
      console.error('[WebSocketService] Connection failed:', error);
      this.handleReconnect();
    }
  }

  /**
   * Get WebSocket URL from current location
   */
  getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/ai-updates`;
  }

  /**
   * Wait for WebSocket connection
   */
  waitForConnection(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, timeoutMs);

      if (this.ws.readyState === WebSocket.OPEN) {
        clearTimeout(timeout);
        resolve();
        return;
      }

      this.ws.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.ws.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * WebSocket event handlers
   */
  onOpen() {
    console.log('[WebSocketService] Connected');
    this.connected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.startHeartbeat();
    this.emit('connected');
  }

  onMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    } catch (error) {
      console.error('[WebSocketService] Failed to parse message:', error);
    }
  }

  onClose(event) {
    console.log('[WebSocketService] Disconnected:', event.code, event.reason);
    this.connected = false;
    this.stopHeartbeat();

    if (!event.wasClean) {
      this.handleReconnect();
    }

    this.emit('disconnected', { code: event.code, reason: event.reason });
  }

  onError(error) {
    console.error('[WebSocketService] Error:', error);
    this.emit('error', error);
  }

  /**
   * Handle incoming messages
   */
  handleMessage(data) {
    const { type, requestId, payload } = data;

    switch (type) {
      case 'task_update':
        this.handleTaskUpdate(requestId, payload);
        break;
      case 'task_complete':
        this.handleTaskComplete(requestId, payload);
        break;
      case 'task_failed':
        this.handleTaskFailed(requestId, payload);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        this.emit('message', data);
    }
  }

  /**
   * Handle task status updates
   */
  handleTaskUpdate(requestId, payload) {
    const task = this.pollingTasks.get(requestId);
    if (task) {
      task.onUpdate(payload);
      this.emit('task_update', { requestId, ...payload });
    }
  }

  handleTaskComplete(requestId, payload) {
    const task = this.pollingTasks.get(requestId);
    if (task) {
      task.resolve(payload);
      this.pollingTasks.delete(requestId);
      this.emit('task_complete', { requestId, ...payload });
    }
  }

  handleTaskFailed(requestId, payload) {
    const task = this.pollingTasks.get(requestId);
    if (task) {
      task.reject(new Error(payload.error || 'Task failed'));
      this.pollingTasks.delete(requestId);
      this.emit('task_failed', { requestId, ...payload });
    }
  }

  /**
   * Poll for result with WebSocket-based real-time updates
   */
  async pollForResult(requestId, type = 'unknown', maxAttempts = 60, baseInterval = 2000) {
    return new Promise((resolve, reject) => {
      const task = {
        requestId,
        type,
        resolve,
        reject,
        onUpdate: (update) => {
          // Emit progress updates
          this.emit('progress', { requestId, type, ...update });
        },
        startTime: Date.now(),
        maxDuration: maxAttempts * baseInterval
      };

      this.pollingTasks.set(requestId, task);

      // Subscribe to updates for this request
      if (this.connected) {
        this.send({
          type: 'subscribe_task',
          requestId,
          taskType: type
        });
      }

      // Fallback polling if WebSocket not available
      if (!this.connected) {
        this.fallbackPolling(task, maxAttempts, baseInterval);
      }

      // Timeout safeguard
      setTimeout(() => {
        if (this.pollingTasks.has(requestId)) {
          this.pollingTasks.delete(requestId);
          reject(new Error('Task polling timeout'));
        }
      }, task.maxDuration);
    });
  }

  /**
   * Fallback HTTP polling when WebSocket unavailable
   */
  async fallbackPolling(task, maxAttempts, baseInterval) {
    const getInterval = (attempt) => {
      const exponentialDelay = Math.min(baseInterval * Math.pow(1.5, attempt - 1), 30000);
      const jitter = exponentialDelay * 0.2 * Math.random();
      return exponentialDelay + jitter;
    };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, getInterval(attempt)));

        // Make HTTP request to check status
        const response = await fetch(`/api/tasks/${task.requestId}/status`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Task not found');
          }
          continue;
        }

        const data = await response.json();
        const status = data.status?.toLowerCase();

        if (status === 'completed' || status === 'succeeded' || status === 'success') {
          task.resolve(data);
          this.pollingTasks.delete(task.requestId);
          return;
        }

        if (status === 'failed' || status === 'error') {
          throw new Error(data.error || 'Task failed');
        }

        // Continue polling
        task.onUpdate({ progress: data.progress, status });

      } catch (error) {
        if (attempt === maxAttempts) {
          task.reject(error);
          this.pollingTasks.delete(task.requestId);
        }
      }
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(data) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Handle reconnection logic
   */
  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocketService] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocketService] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Exponential backoff, max 30s
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.send({ type: 'ping' });
      }
    }, 30000); // 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connected = false;
    this.stopHeartbeat();

    // Reject all pending tasks
    for (const [requestId, task] of this.pollingTasks) {
      task.reject(new Error('WebSocket disconnected'));
    }
    this.pollingTasks.clear();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocketService] Event callback error:', error);
        }
      });
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connected: this.connected,
      readyState: this.ws ? this.ws.readyState : -1,
      reconnectAttempts: this.reconnectAttempts,
      activeTasks: this.pollingTasks.size,
      url: this.url
    };
  }

  /**
   * Force reconnection
   */
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}
export const monitoringService = new MonitoringService();
