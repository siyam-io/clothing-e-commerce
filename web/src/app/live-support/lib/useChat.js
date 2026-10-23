import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import api from "@/lib/api";

export const useChat = (isOpen) => {
  const { token, user } = useAuthStore();
  const { socket, fetchUnreadCount } = useChatStore();
  
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isAiTyping, setIsAiTyping] = useState(false);

  // 🚀 Fetch initial or more messages
  const fetchMessages = useCallback(async (pageNum = 1) => {
    if (!token) return;
    
    try {
      if (pageNum > 1) setIsLoadingMore(true);
      
      const res = await api.get(`/chat/my-conversation?page=${pageNum}&limit=20`);

      const conversation = res.data;
      if (conversation) {
        setConversationId(conversation._id);
        const newMessages = conversation.messages || [];
        
        if (pageNum === 1) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...newMessages, ...prev]);
        }

        setHasMore(newMessages.length === 20);
      }
    } catch (err) {
      console.error("🚨 Chat Fetch Failed", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && token) {
      setPage(1);
      fetchMessages(1);
    }
  }, [isOpen, token, fetchMessages]);

  // 🧹 Reset unread count when chat is open and conversation exists
  useEffect(() => {
    if (isOpen && conversationId) {
      const { resetUnread } = useChatStore.getState();
      resetUnread(conversationId);
    }
  }, [isOpen, conversationId]);

  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (isOpen) {
        setMessages((prev) => [...prev, data.message]);
        setIsAiTyping(false);
        fetchUnreadCount();
        const { resetUnread } = useChatStore.getState();
        resetUnread();
      }
    };

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    
    const handleMessagesSeen = (data) => {
      // If the backend broadcasts this conversation was seen, mark all local messages as read
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    };

    const handleMessageEdited = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, text: data.text, isEdited: true } : m));
      }
    };

    const handleMessageDeleted = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.filter(m => m._id !== data.messageId));
      }
    };

    const handleAiTyping = (data) => {
      setIsAiTyping(!!data?.isTyping);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("messages_seen", handleMessagesSeen);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("ai_typing", handleAiTyping);
    
    setIsConnected(socket.connected);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("messages_seen", handleMessagesSeen);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("ai_typing", handleAiTyping);
    };
  }, [socket, isOpen, fetchUnreadCount, conversationId]);

  const sendMessage = (payload) => {
    const data = typeof payload === "string" ? { text: payload } : payload;
    const { text, image } = data;

    if (socket && socket.connected) {
      socket.emit("send_message", {
        text: text?.trim(),
        image,
        recipientId: "admin_room",
        conversationId,
      });
    }
  };

  return { messages, isConnected, isAiTyping, sendMessage, conversationId, loadMore, hasMore, isLoadingMore };
};
