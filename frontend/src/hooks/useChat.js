import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useUserStore } from '../store/user';

const socketBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useChat = (activeConversationId, handlers = {}) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!currentUser?._id) return undefined;

    const socket = io(socketBaseUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('registerUser', currentUser._id);
      setSocketReady(true);
    });

    socket.on('disconnect', () => {
      setSocketReady(false);
    });

    socket.on('chat:message-created', (payload) => {
      handlers.onMessageCreated?.(payload);
    });

    socket.on('chat:conversation-updated', (payload) => {
      handlers.onConversationUpdated?.(payload);
    });

    socket.on('chat:message-read', (payload) => {
      handlers.onMessageRead?.(payload);
    });

    socket.on('chat:message-updated', (payload) => {
      handlers.onMessageUpdated?.(payload);
    });

    socket.on('chat:message-deleted', (payload) => {
      handlers.onMessageDeleted?.(payload);
    });

    socket.on('chat:typing', (payload) => {
      handlers.onTyping?.(payload);
    });

    socket.on('chat:presence', (payload) => {
      handlers.onPresence?.(payload);
    });

    return () => {
      socket.close();
      socketRef.current = null;
      setSocketReady(false);
    };
  }, [currentUser?._id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId) return undefined;

    socket.emit('joinConversation', activeConversationId);
    return () => {
      socket.emit('leaveConversation', activeConversationId);
    };
  }, [activeConversationId]);

  return {
    emitTyping: (payload) => {
      socketRef.current?.emit('chat:typing', payload);
    },
    socketReady,
  };
};
