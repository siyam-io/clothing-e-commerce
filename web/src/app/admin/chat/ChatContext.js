"use client";

import { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import api from "@/lib/api";
import { useParams } from "next/navigation";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { token, user } = useAuthStore();
  const { id } = useParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef();

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    socketRef.current = io(
      process.env.NEXT_PUBLIC_API_URL.replace("/api", ""),
      {
        auth: { token },
        transports: ["websocket"],
      },
    );

    socketRef.current.on("new_message", (data) => {
      fetchConversations();
    });

    socketRef.current.on("chat_mode_changed", (data) => {
      setConversations(prev => prev.map(c => c._id === data.conversationId ? { ...c, mode: data.mode, isHandedOver: data.isHandedOver } : c));
    });

    socketRef.current.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    fetchConversations();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [token]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error("📡 Intelligence Failure", err);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (participantId) => {
    try {
      const existing = conversations.find(c => 
        c.participants.some(p => String(p._id) === String(participantId))
      );

      if (existing) return existing._id;

      const res = await api.post("/chat/conversations/start", { participantId });
      if (res.data.success) {
        await fetchConversations();
        return res.data.conversation._id;
      }
    } catch (err) {
      console.error("Failed to start conversation", err);
    }
  };

  // Sync active conversation details
  useEffect(() => {
    if (!id) {
      setActiveConversation(null);
      return;
    }

    let cancelled = false;
    const found = conversations.find(c => c._id === id);

    if (found) {
      setActiveConversation(found);
    } else {
      setActiveConversation(null);
      api.get(`/chat/conversations/${id}`)
        .then(res => {
          if (!cancelled && res.data.success) {
            setActiveConversation(res.data.conversation);
          }
        })
        .catch(err => console.error("Error fetching single conversation", err));
    }

    return () => {
      cancelled = true;
    };
  }, [id, conversations]);

  // Sync messages only when the selected conversation changes.
  useEffect(() => {
    if (!id) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    let cancelled = false;
    setMessages([]);
    setMessagesLoading(true);

    const { resetUnread } = useChatStore.getState();
    resetUnread(id).then(() => {
      fetchConversations();
    });

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/conversations/${id}/messages`);
        if (!cancelled) setMessages(res.data);
      } catch (err) {
        console.error("Transmission Intercepted", err);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };
    fetchMessages();

    const socket = socketRef.current;
    if (socket) {
      const handler = (data) => {
        if (data.conversationId === id) {
          setMessages(prev => {
            const exists = prev.find(m => m._id === data.message._id);
            if (exists) return prev;
            return [...prev, data.message];
          });
          
          resetUnread(id).then(() => {
            fetchConversations();
          });
        }
      };
      const seenHandler = (data) => {
        if (data.conversationId === id) {
          setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
        }
      };

      const editHandler = (data) => {
        if (data.conversationId === id) {
          setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, text: data.text, isEdited: true } : m));
        }
      };

      const deleteHandler = (data) => {
        if (data.conversationId === id) {
          setMessages(prev => prev.filter(m => m._id !== data.messageId));
        }
      };

      const modeHandler = (data) => {
        if (data.conversationId === id) {
          setActiveConversation(prev => prev ? { ...prev, mode: data.mode, isHandedOver: data.isHandedOver } : prev);
        }
        setConversations(prev => prev.map(c => c._id === data.conversationId ? { ...c, mode: data.mode, isHandedOver: data.isHandedOver } : c));
      };

      socket.on("new_message", handler);
      socket.on("messages_seen", seenHandler);
      socket.on("message_edited", editHandler);
      socket.on("message_deleted", deleteHandler);
      socket.on("chat_mode_changed", modeHandler);
      return () => {
        cancelled = true;
        socket.off("new_message", handler);
        socket.off("messages_seen", seenHandler);
        socket.off("message_edited", editHandler);
        socket.off("message_deleted", deleteHandler);
        socket.off("chat_mode_changed", modeHandler);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const customer = useMemo(() => {
    if (!activeConversation) return null;
    const myId = user?._id || user?.id;
    let other = activeConversation.participants?.find(p => String(p._id || p.id) !== String(myId));
    return other || activeConversation.participants?.[0] || null;
  }, [activeConversation, user]);

  const handleSend = () => {
    const socket = socketRef.current;
    if (input.trim() && socket) {
      socket.emit("send_message", {
        text: input,
        conversationId: id,
        recipientId: customer?._id
      });
      setInput("");
    }
  };

  const handleEditMessage = (messageId, newText) => {
    const socket = socketRef.current;
    if (socket && newText.trim()) {
      socket.emit("edit_message", { messageId, text: newText });
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const { notify } = await import("@/utils/swal");
    const confirmed = await notify.confirm("Delete Message?", "Are you sure you want to delete this message?");
    const socket = socketRef.current;
    if (confirmed && socket) {
      socket.emit("delete_message", { messageId });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    const socket = socketRef.current;
    if (!file || !socket) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        socket.emit("send_message", {
          image: res.data.url,
          conversationId: id,
          recipientId: customer?._id
        });
      }
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setConversationMode = async (newMode) => {
    if (!id) return;
    const socket = socketRef.current;
    if (socket) {
      socket.emit("set_chat_mode", { mode: newMode, conversationId: id });
    }

    // Optimistic state update
    setActiveConversation((prev) =>
      prev ? { ...prev, mode: newMode, isHandedOver: newMode === "agent" } : prev
    );
    setConversations((prev) =>
      prev.map((c) =>
        c._id === id ? { ...c, mode: newMode, isHandedOver: newMode === "agent" } : c
      )
    );

    try {
      await api.patch(`/chat/conversations/${id}/mode`, { mode: newMode });
    } catch (e) {
      console.warn("Mode API fallback notice:", e.message);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      conversations, 
      loading,
      socket: socketRef.current, 
      fetchConversations,
      startConversation,
      onlineUsers,
      activeConversation,
      setConversationMode,
      messages,
      messagesLoading,
      setMessages,
      input,
      setInput,
      isUploading,
      customer,
      handleSend,
      handleEditMessage,
      handleDeleteMessage,
      handleFileChange,
      fileInputRef
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
