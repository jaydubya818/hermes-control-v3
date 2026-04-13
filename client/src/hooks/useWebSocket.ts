import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  type: string;
  payload?: any;
}

type MessageHandler = (payload: any) => void;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
      const token = localStorage.getItem('token');
      if (token) ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
    };

    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        const handlers = handlersRef.current.get(message.type);
        if (handlers) handlers.forEach(handler => handler(message.payload));
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);

    ws.onclose = () => {
      setConnectionState('disconnected');
      wsRef.current = null;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;
      reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const send = useCallback((type: string, payload?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  const onMessage = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) handlersRef.current.set(type, []);
    handlersRef.current.get(type)!.push(handler);

    return () => {
      const handlers = handlersRef.current.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }, []);

  return { send, onMessage, connectionState, isConnected: connectionState === 'connected' };
}
