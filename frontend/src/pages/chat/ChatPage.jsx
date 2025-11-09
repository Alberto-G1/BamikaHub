import React, { useEffect, useMemo, useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { FaPaperPlane, FaPaperclip, FaTimes, FaCheck, FaCheckDouble, FaSearch, FaPlus, FaUser, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext.jsx';
import './ChatPage.css';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080';

const ChatPage = () => {
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    messages,
    sendMessage,
    loadThreads,
    loadMessages,
    connected,
    presence
  } = useChat();
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [upload, setUpload] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [messageQuery, setMessageQuery] = useState('');

  const activeMessages = useMemo(() => messages[activeThreadId] ?? [], [messages, activeThreadId]);
  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) ?? null, [threads, activeThreadId]);
  const filteredUsers = useMemo(() => {
    if (!userQuery.trim()) {
      return userList;
    }
    const q = userQuery.trim().toLowerCase();
    return userList.filter((u) =>
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  }, [userList, userQuery]);

  const resolveAvatarUrl = (value) => {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    return `${BACKEND_BASE}${value}`;
  };

  const getInitials = (value = '') => {
    const parts = value.split(' ').filter(Boolean);
    if (!parts.length) return '?';
    const initials = `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`;
    return initials.toUpperCase();
  };

  const renderAvatar = (avatarUrl, name, size = 'md') => {
    const resolved = resolveAvatarUrl(avatarUrl);
    if (resolved) {
      return <img src={resolved} alt={name ?? 'avatar'} className={`chat-avatar-img ${size}`} />;
    }
    return <span className={`chat-avatar-fallback ${size}`}>{getInitials(name)}</span>;
  };

  useEffect(() => {
    setMessageQuery('');
    setDraft('');
    setUpload(null);
  }, [activeThreadId]);

  const resolveThreadLabel = (thread) => {
    if (!thread) return '';
    if (thread.type === 'GENERAL') {
      return thread.subject || 'General Chat';
    }
    if (thread.subject) {
      return thread.subject;
    }
    const rawParticipants = Array.isArray(thread.participants)
      ? thread.participants
      : Object.values(thread.participants || {});
    const others = rawParticipants.filter((p) => p && p.id !== user?.id);
    if (others.length === 0) {
      return 'Direct Message';
    }
    const names = others.map((p) => p.fullName || `User #${p.id}`).join(', ');
    return names || 'Direct Message';
  };

  const handleSend = async () => {
    if (!draft.trim() && !upload) return;
    if (!activeThreadId) {
      toast.error('Select a conversation first.');
      return;
    }
    const thread = threads.find((t) => t.id === activeThreadId);
    const sent = await sendMessage({
      threadId: activeThreadId,
      content: draft,
      general: thread?.type === 'GENERAL',
      file: upload ?? undefined
    });
    if (sent) {
      setDraft('');
      setUpload(null);
    }
  };

  const openNewChatModal = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get('/chat/users', { params: { excludeUserId: user?.id } });
      setUserList(data);
      setUserQuery('');
      setSelectedUser(null);
      setShowNewChat(true);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const startPrivateChat = async () => {
    if (!selectedUser) return;
    setStartingChat(true);
    try {
      const { data } = await api.post('/chat/threads/private', {
        senderId: user?.id,
        recipientId: selectedUser.id
      });
      await loadThreads();
      setActiveThreadId(data.id);
      await loadMessages(data.id, { markRead: true });
      setShowNewChat(false);
      setSelectedUser(null);
      toast.success('Private chat ready');
    } catch (e) {
      toast.error('Failed to start chat');
    } finally {
      setStartingChat(false);
    }
  };

  const filteredMessages = useMemo(() => {
    if (!messageQuery.trim()) {
      return activeMessages;
    }
    const q = messageQuery.trim().toLowerCase();
    return activeMessages.filter((msg) => {
      if (msg.content && msg.content.toLowerCase().includes(q)) return true;
      if (msg.senderName && msg.senderName.toLowerCase().includes(q)) return true;
      if (msg.attachment?.fileName && msg.attachment.fileName.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [activeMessages, messageQuery]);

  const canSend = !!activeThreadId && (!!draft.trim() || !!upload);

  const renderMessageStatus = (message) => {
    if (message.senderId !== user?.id) {
      return null;
    }
    if (message.readAt) {
      return <FaCheckDouble className="chat-status read" title="Read" />;
    }
    if (message.deliveredAt) {
      return <FaCheckDouble className="chat-status delivered" title="Delivered" />;
    }
    return <FaCheck className="chat-status sent" title="Sent" />;
  };

  return (
    <section className="reporting-page chat-page">
      <div className="chat-layout" data-animate="fade-up">
        
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-title">
              <FaUsers className="sidebar-icon" />
              <span>Messages</span>
            </div>
            <div className="chat-connection-status">
              <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
                {connected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>
          </div>
          
          <div className="chat-sidebar-actions">
            <button 
              type="button" 
              className="reporting-btn reporting-btn--gold reporting-btn--sm"
              onClick={openNewChatModal} 
              disabled={loadingUsers}
            >
              <FaPlus /> New Chat
            </button>
          </div>
          
          <div className="chat-thread-list">
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const participantList = Array.isArray(thread.participants)
                ? thread.participants
                : Object.values(thread.participants || {});
              const onlineCount = participantList.filter((p) => presence[p.id]?.online).length;
              const others = participantList.filter((p) => p.id !== user?.id);
              const primaryParticipant = others[0] ?? participantList[0];
              const label = resolveThreadLabel(thread);
              
              return (
                <div
                  key={thread.id}
                  className={`chat-thread-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveThreadId(isActive ? null : thread.id)}
                >
                  <div className="thread-item-inner">
                    <div className="thread-avatar">
                      {renderAvatar(
                        thread.type === 'GENERAL' ? null : primaryParticipant?.avatar,
                        thread.type === 'GENERAL' ? (thread.subject || 'General Chat') : primaryParticipant?.fullName,
                        'sm'
                      )}
                      {thread.type === 'PRIVATE' && onlineCount > 0 && (
                        <span className="online-indicator"></span>
                      )}
                    </div>
                    <div className="thread-text">
                      <div className="thread-title">{label}</div>
                      <div className="thread-meta">
                        {thread.type === 'PRIVATE' ? (
                          <span className="online-status">{onlineCount} online</span>
                        ) : (
                          <span className="thread-type">Group</span>
                        )}
                        {thread.lastMessage && (
                          <span className="last-message-time">
                            {new Date(thread.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="thread-unread">{thread.unreadCount}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Chat Area */}
        <section className="chat-content">
          {activeThread ? (
            <>
              <header className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-header-avatar">
                    {(() => {
                      const headerParticipants = Array.isArray(activeThread.participants)
                        ? activeThread.participants
                        : Object.values(activeThread.participants || {});
                      const headerPrimary = activeThread.type === 'GENERAL'
                        ? null
                        : headerParticipants.find((p) => p.id !== user?.id) ?? headerParticipants[0];
                      return renderAvatar(
                        activeThread.type === 'GENERAL' ? null : headerPrimary?.avatar,
                        resolveThreadLabel(activeThread),
                        'md'
                      );
                    })()}
                  </div>
                  <div className="chat-header-details">
                    <h2 className="chat-header-title">{resolveThreadLabel(activeThread)}</h2>
                    {activeThread.type === 'PRIVATE' && (
                      <div className="chat-header-subtitle">
                        {activeThread.unreadCount > 0 ? `${activeThread.unreadCount} unread messages` : 'All caught up'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="chat-header-actions">
                  <div className="message-search">
                    <FaSearch className="search-icon" />
                    <input
                      type="search"
                      className="reporting-input"
                      placeholder="Search in conversation..."
                      value={messageQuery}
                      onChange={(e) => setMessageQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                    onClick={() => setActiveThreadId(null)}
                  >
                    Close
                  </button>
                </div>
              </header>

              {/* Scrollable Messages Area */}
              <div className="chat-messages-container">
                <div className="chat-messages">
                  {filteredMessages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    return (
                      <div key={message.id} className={`chat-message-row ${isOwn ? 'outgoing' : 'incoming'}`}>
                        {!isOwn && (
                          <div className="chat-avatar">
                            {renderAvatar(message.senderAvatar, message.senderName, 'sm')}
                          </div>
                        )}
                        <article className={`chat-message ${isOwn ? 'outgoing' : 'incoming'}`}>
                          {!isOwn && (
                            <header className="chat-message-header">
                              <span className="chat-sender">{message.senderName}</span>
                              <span className="chat-time">
                                {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </header>
                          )}
                          <div className="chat-message-content">
                            {message.content && <p>{message.content}</p>}
                            {message.attachment && (
                              <a className="chat-attachment" href={message.attachment.downloadUrl} target="_blank" rel="noreferrer">
                                <FaPaperclip /> {message.attachment.fileName}
                              </a>
                            )}
                          </div>
                          <footer className="chat-message-footer">
                            {isOwn && (
                              <>
                                <span className="chat-time">
                                  {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {renderMessageStatus(message)}
                              </>
                            )}
                          </footer>
                        </article>
                        {isOwn && (
                          <div className="chat-avatar">
                            {renderAvatar(user?.profilePictureUrl, user?.fullName || user?.username, 'sm')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!filteredMessages.length && (
                    <div className="chat-empty-results">
                      <div className="reporting-empty-state">
                        No messages found matching your search.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Composer */}
              <footer className="chat-composer">
                <div className="composer-actions">
                  <label className={`attachment-button ${!activeThreadId ? 'disabled' : ''}`}>
                    <FaPaperclip />
                    <input type="file" hidden disabled={!activeThreadId} onChange={(e) => setUpload(e.target.files?.[0] ?? null)} />
                  </label>
                  {upload && (
                    <div className="attachment-preview">
                      <span>{upload.name}</span>
                      <button type="button" onClick={() => setUpload(null)}>
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  className="reporting-textarea"
                  placeholder="Write your message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  disabled={!activeThreadId}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`reporting-btn ${canSend ? 'reporting-btn--gold' : 'reporting-btn--secondary'}`}
                  onClick={handleSend}
                  disabled={!canSend}
                  title={!connected ? 'Queued via backup channel' : undefined}
                >
                  <FaPaperPlane />
                </button>
              </footer>
            </>
          ) : (
            <div className="chat-empty-state">
              <div className="reporting-card">
                <div className="reporting-empty-state">
                  <FaUsers className="empty-icon" />
                  <h3>Welcome to Messages</h3>
                  <p>Select a conversation from the sidebar or start a new chat to begin messaging.</p>
                  <button 
                    className="reporting-btn reporting-btn--gold"
                    onClick={openNewChatModal}
                  >
                    <FaPlus /> Start New Chat
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="reporting-overlay">
          <div className="reporting-card reporting-modal chat-modal">
            <div className="reporting-card__header">
              <h2 className="reporting-card__title">Start New Chat</h2>
              <button 
                className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                onClick={() => setShowNewChat(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="reporting-card__content">
              <div className="reporting-form-group">
                <label className="reporting-form-label">Search Users</label>
                <div className="user-search">
                  <FaSearch className="search-icon" />
                  <input
                    type="search"
                    className="reporting-input"
                    placeholder="Search by name or email..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="user-list">
                {loadingUsers && (
                  <div className="reporting-loading">
                    <div className="reporting-spinner" />
                    <p>Loading users...</p>
                  </div>
                )}
                {!loadingUsers && filteredUsers.length === 0 && (
                  <div className="reporting-empty-state">
                    No users found matching your search.
                  </div>
                )}
                {!loadingUsers && filteredUsers.map(u => (
                  <div 
                    key={u.id} 
                    className={`user-item ${selectedUser?.id === u.id ? 'selected' : ''}`} 
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="user-info">
                      {renderAvatar(u.avatar, u.fullName || u.email, 'sm')}
                      <div className="user-details">
                        <span className="user-name">{u.fullName || u.email}</span>
                        <span className="user-email">{u.email}</span>
                      </div>
                    </div>
                    <span className={`status-dot ${u.online ? 'online' : 'offline'}`}></span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="reporting-card__actions">
              <button 
                type="button" 
                className="reporting-btn reporting-btn--secondary"
                onClick={() => setShowNewChat(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="reporting-btn reporting-btn--gold"
                disabled={!selectedUser || startingChat} 
                onClick={startPrivateChat}
              >
                {startingChat ? 'Starting Chat...' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ChatPage;