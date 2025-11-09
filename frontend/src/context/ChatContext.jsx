import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import api from '../api/api';
import { useAuth } from './AuthContext.jsx';
import { toast } from 'react-toastify';

const ChatContext = createContext(null);

const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080';
const WS_ENDPOINT = `${BACKEND_BASE}/ws`;

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState({});
  const [presence, setPresence] = useState({});
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef(null);
  const reconnectTimer = useRef(null);
  const threadSubscriptionRef = useRef(null);
  const activeThreadRef = useRef(null);
  const userRef = useRef(null);

  const loadThreads = async () => {
    if (!user) return [];
    const { data } = await api.get('/chat/threads', { params: { userId: user.id } });
    setThreads(data);
    setActiveThreadId((current) => {
      if (current == null) {
        return current;
      }
      return data.some((thread) => thread.id === current) ? current : null;
    });
    return data;
  };

  const markThreadRead = async (threadId, lastMessageId) => {
    if (!user || !lastMessageId) return [];
    try {
      const { data } = await api.post(`/chat/threads/${threadId}/read`, {
        userId: user.id,
        lastMessageId
      });
      if (data.length) {
        setMessages((prev) => {
          const existing = prev[threadId] ?? [];
          const updates = new Map(data.map((msg) => [msg.id, msg]));
          return {
            ...prev,
            [threadId]: existing.map((msg) => updates.get(msg.id) ?? msg)
          };
        });
      }
      setThreads((prev) => prev.map((thread) => (
        thread.id === threadId
          ? { ...thread, unreadCount: 0 }
          : thread
      )));
      return data;
    } catch (error) {
      return [];
    }
  };

  const loadMessages = async (threadId, { markRead = false } = {}) => {
    const { data } = await api.get(`/chat/threads/${threadId}/messages`, { params: { size: 50 } });
    const ordered = data.reverse();
    setMessages((prev) => ({ ...prev, [threadId]: ordered }));
    if (ordered.length && markRead) {
      const lastMessageId = ordered[ordered.length - 1].id;
      markThreadRead(threadId, lastMessageId);
    }
  };

  const clearReconnectTimer = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  const connect = () => {
    if (!user || stompClientRef.current) return;
    const socket = new SockJS(WS_ENDPOINT);
    const client = Stomp.over(socket);
    client.debug = () => {};
    client.connect({}, () => {
      clearReconnectTimer();
      setConnected(true);
      stompClientRef.current = client;
      subscribeChannels();
      sendPresence(true);
    }, () => scheduleReconnect());
  };

  const scheduleReconnect = () => {
    setConnected(false);
    if (reconnectTimer.current) return;
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      disconnect();
      connect();
    }, 5000);
  };

  const disconnect = () => {
    clearReconnectTimer();
    if (stompClientRef.current) {
      stompClientRef.current.disconnect(() => {
        stompClientRef.current = null;
      });
    }
  };

  const subscribeChannels = () => {
    const client = stompClientRef.current;
    if (!client || !user) return;
    client.subscribe('/topic/general', onMessageReceived);
    client.subscribe('/topic/presence', onPresenceUpdate);
    client.subscribe(`/topic/user.${user.id}.notifications`, onNotificationReceived);
    subscribeToActiveThread();
  };

  const subscribeToActiveThread = () => {
    const client = stompClientRef.current;
    if (!client || !activeThreadId) return;
    if (threadSubscriptionRef.current) {
      threadSubscriptionRef.current.unsubscribe();
      threadSubscriptionRef.current = null;
    }
    threadSubscriptionRef.current = client.subscribe(`/queue/thread.${activeThreadId}`, onMessageReceived);
  };

  const onPresenceUpdate = (frame) => {
    const payload = JSON.parse(frame.body);
    setPresence((prev) => ({ ...prev, [payload.userId]: payload }));
  };

  const onNotificationReceived = (frame) => {
    const notification = JSON.parse(frame.body);
    const currentThreadId = activeThreadRef.current;
    if (notification.threadId && notification.messageId) {
      if (notification.threadId !== currentThreadId) {
        toast.info('New message received');
      }
      loadThreads();
      loadMessages(notification.threadId, { markRead: notification.threadId === currentThreadId });
    }
  };

  const onMessageReceived = (frame) => {
    const message = JSON.parse(frame.body);
    const currentThreadId = activeThreadRef.current;
    const currentUserId = userRef.current?.id;
    setMessages((prev) => {
      const threadMessages = prev[message.threadId] ?? [];
      if (threadMessages.some((existing) => existing.id === message.id)) {
        return prev;
      }
      return { ...prev, [message.threadId]: [...threadMessages, message] };
    });
    if (message.threadId === currentThreadId && message.senderId !== currentUserId) {
      markThreadRead(message.threadId, message.id);
    }
  };

  const sendPresence = (online) => {
    if (!stompClientRef.current || !user) return;
    stompClientRef.current.send('/app/chat/presence', {}, JSON.stringify({
      userId: user.id,
      online
    }));
  };

  const sendViaRest = async (bodyPayload, file, { refreshThreads = false, ensureActiveThread = false } = {}) => {
    const formData = new FormData();
    formData.append('payload', new Blob([JSON.stringify(bodyPayload)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    try {
      const { data } = await api.post('/chat/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const threadId = data.threadId;
      if (refreshThreads) {
        await loadThreads();
      }
      if (ensureActiveThread && threadId) {
        setActiveThreadId(threadId);
      }
      await loadMessages(threadId, { markRead: ensureActiveThread || threadId === activeThreadRef.current });
      return true;
    } catch (error) {
      toast.error('Failed to send message.');
      return false;
    }
  };

  const sendMessage = async ({ file, ...payload }) => {
    if (!user) return false;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Attachment must be 5MB or smaller.');
        return false;
      }
      return sendViaRest({
        ...payload,
        senderId: user.id
      }, file, {
        refreshThreads: !payload.threadId || !stompClientRef.current,
        ensureActiveThread: !payload.threadId
      });
    }

    const body = {
      ...payload,
      senderId: user.id
    };
    if (!stompClientRef.current) {
      return sendViaRest(body, undefined, { refreshThreads: true, ensureActiveThread: !payload.threadId });
    }

    stompClientRef.current.send('/app/chat/send', {}, JSON.stringify(body));
    return true;
  };

  useEffect(() => {
    userRef.current = user;
    if (user) {
      loadThreads();
      connect();
    } else {
      setThreads([]);
      setMessages({});
      setActiveThreadId(null);
    }
    return () => {
      sendPresence(false);
      disconnect();
    };
  }, [user]);

  useEffect(() => {
    activeThreadRef.current = activeThreadId;
    if (activeThreadId) {
      loadMessages(activeThreadId, { markRead: true });
      subscribeToActiveThread();
    } else if (threadSubscriptionRef.current) {
      threadSubscriptionRef.current.unsubscribe();
      threadSubscriptionRef.current = null;
    }
  }, [activeThreadId]);

  const value = useMemo(() => {
    const generalThread = threads.find((thread) => thread.type === 'GENERAL');
    const generalUnreadCount = generalThread?.unreadCount ?? 0;
    const directUnreadCount = threads
      .filter((thread) => thread.type !== 'GENERAL')
      .reduce((sum, thread) => sum + (thread.unreadCount ?? 0), 0);
    const totalUnreadCount = generalUnreadCount + directUnreadCount;

    return {
      threads,
      activeThreadId,
      setActiveThreadId,
      messages,
      sendMessage,
      loadThreads,
      loadMessages,
      connected,
      presence,
      generalUnreadCount,
      directUnreadCount,
      totalUnreadCount
    };
  }, [threads, activeThreadId, messages, connected, presence, sendMessage, loadThreads, loadMessages]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
