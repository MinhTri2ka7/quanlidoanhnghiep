import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useCurrentUser } from "../../utils/useCurrentUser.js";
import { getDeviceId } from "../../utils/api.js";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import * as api from "../../utils/api.js";

function ChatPage() {
  const { user: currentUser } = useCurrentUser();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("rooms"); // rooms, friends, pending
  
  // Lists
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);

  // Form states
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [friendSearchEmail, setFriendSearchEmail] = useState("");
  const [friendSearchResult, setFriendSearchResult] = useState(null);
  const [friendSearchError, setFriendSearchError] = useState("");
  const [isFriendSearching, setIsFriendSearching] = useState(false);
  const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [attachmentMetadata, setAttachmentMetadata] = useState(null);

  // Group Details Modal
  const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false);
  const [groupEditName, setGroupEditName] = useState("");
  const [groupAddMemberEmail, setGroupAddMemberEmail] = useState("");
  const [groupAddMemberResult, setGroupAddMemberResult] = useState(null);
  const [groupAddMemberError, setGroupAddMemberError] = useState("");

  // UI state
  const [typingUsers, setTypingUsers] = useState({}); // roomId -> { userId: { username, timeout } }
  const [onlineStatus, setOnlineStatus] = useState({}); // userId -> boolean
  const [colleagues, setColleagues] = useState([]);
  const [sentRequestUserIds, setSentRequestUserIds] = useState(new Set());

  // Refs
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeRoomSubscriptionRef = useRef(null);
  const activeRoomRecallSubRef = useRef(null);
  const activeRoomSeenSubRef = useRef(null);
  const activeRoomTypingSubRef = useRef(null);
  const notificationsSubRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  // --- Initial Data Load ---

  useEffect(() => {
    loadRooms();
    loadFriends();
    loadPendingRequests();
    loadColleagues();
    
    // Connect to WebSocket STOMP
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto select room if passed from routing state (projectId or roomId)
  useEffect(() => {
    if (rooms.length > 0) {
      if (location.state?.projectId) {
        const projRoom = rooms.find(r => Number(r.projectId) === Number(location.state.projectId));
        if (projRoom) {
          setActiveRoom(projRoom);
        }
      } else if (location.state?.roomId) {
        const targetRoom = rooms.find(r => Number(r.id) === Number(location.state.roomId));
        if (targetRoom) {
          setActiveRoom(targetRoom);
        }
      }
    }
  }, [rooms, location.state]);

  // Handle active room switch
  useEffect(() => {
    if (activeRoom) {
      loadRoomMessages(activeRoom.id);
      subscribeToActiveRoom(activeRoom.id);
      
      // Update local unread count
      setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, unreadCount: 0 } : r));
    } else {
      unsubscribeFromActiveRoom();
      setMessages([]);
    }
  }, [activeRoom]);

  // --- Fetch APIs ---

  async function loadColleagues() {
    try {
      const data = await api.getAllUsers();
      setColleagues(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách đồng nghiệp:", err);
    }
  }

  async function loadRooms() {
    try {
      const data = await api.getChatRooms();
      setRooms(data);
    } catch (err) {
      console.error("Lỗi khi tải phòng chat:", err);
    }
  }

  async function loadFriends() {
    try {
      const data = await api.getFriends();
      setFriends(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách bạn bè:", err);
    }
  }

  async function loadPendingRequests() {
    try {
      const data = await api.getPendingFriendRequests();
      setPendingRequests(data);
    } catch (err) {
      console.error("Lỗi khi tải yêu cầu kết bạn:", err);
    }
  }

  async function loadRoomMessages(roomId) {
    try {
      const data = await api.getRoomMessages(roomId, searchQuery);
      setMessages(data);
      if (stompClientRef.current?.connected) {
        // Send seen receipt
        stompClientRef.current.publish({
          destination: "/app/chat.seenMessage",
          body: JSON.stringify({ roomId })
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải tin nhắn:", err);
    }
  }

  // --- WebSocket Setup ---

  function connectWebSocket() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const socketUrl = "http://localhost:8080/ws";
    
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        "X-Device-ID": getDeviceId()
      },
      reconnectDelay: 5000,
      debug: function (str) {
        // Suppress verbose debug logs in production, log errors
        if (str.includes("ERROR") || str.includes("DISCONNECT")) {
          console.warn("WebSocket STOMP: ", str);
        }
      },
      onConnect: (frame) => {
        console.log("Đã kết nối STOMP WebSocket!");
        
        // Subscribe to user notifications
        if (currentUser) {
          notificationsSubRef.current = client.subscribe(`/topic/notifications/${currentUser.id}`, (message) => {
            const notif = JSON.parse(message.body);
            handleNotification(notif);
          });
        }

        // Re-subscribe to active room if already selected
        if (activeRoom) {
          subscribeToActiveRoom(activeRoom.id);
        }
      },
      onDisconnect: () => {
        console.log("Đã ngắt kết nối STOMP WebSocket.");
      }
    });

    client.activate();
    stompClientRef.current = client;
  }

  function disconnectWebSocket() {
    unsubscribeFromActiveRoom();
    if (notificationsSubRef.current) notificationsSubRef.current.unsubscribe();
    if (stompClientRef.current) stompClientRef.current.deactivate();
  }

  function subscribeToActiveRoom(roomId) {
    if (!stompClientRef.current || !stompClientRef.current.connected) return;

    unsubscribeFromActiveRoom();

    // 1. Subscribe to new messages
    activeRoomSubscriptionRef.current = stompClientRef.current.subscribe(`/topic/room/${roomId}`, (message) => {
      const msg = JSON.parse(message.body);
      setMessages(prev => {
        // Prevent duplicate appending
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Send read receipt if selected
      stompClientRef.current.publish({
        destination: "/app/chat.seenMessage",
        body: JSON.stringify({ roomId })
      });
    });

    // 2. Subscribe to message recall
    activeRoomRecallSubRef.current = stompClientRef.current.subscribe(`/topic/room/${roomId}/recall`, (message) => {
      const body = JSON.parse(message.body);
      setMessages(prev => prev.map(m => m.id === body.messageId ? { ...m, ...body.recalledMessage } : m));
    });

    // 3. Subscribe to seen receipts
    activeRoomSeenSubRef.current = stompClientRef.current.subscribe(`/topic/room/${roomId}/seen`, (message) => {
      const body = JSON.parse(message.body);
      if (currentUser && body.userId !== currentUser.id) {
        setMessages(prev => prev.map(m => m.senderId === currentUser.id && m.seenAt === null ? { ...m, seenAt: new Date().toISOString() } : m));
      }
    });

    // 4. Subscribe to typing status
    activeRoomTypingSubRef.current = stompClientRef.current.subscribe(`/topic/room/${roomId}/typing`, (message) => {
      const body = JSON.parse(message.body);
      if (currentUser && body.userId === currentUser.id) return;

      setTypingUsers(prev => {
        const roomTyping = { ...(prev[roomId] || {}) };
        if (body.isTyping) {
          // Clear old timeout
          if (roomTyping[body.userId]?.timeout) {
            clearTimeout(roomTyping[body.userId].timeout);
          }
          // Set new timeout to auto clear typing indicator after 4 seconds
          const timeout = setTimeout(() => {
            setTypingUsers(p => {
              const rT = { ...(p[roomId] || {}) };
              delete rT[body.userId];
              return { ...p, [roomId]: rT };
            });
          }, 4000);

          roomTyping[body.userId] = { username: body.username, timeout };
        } else {
          if (roomTyping[body.userId]?.timeout) {
            clearTimeout(roomTyping[body.userId].timeout);
          }
          delete roomTyping[body.userId];
        }
        return { ...prev, [roomId]: roomTyping };
      });
    });
  }

  function unsubscribeFromActiveRoom() {
    if (activeRoomSubscriptionRef.current) activeRoomSubscriptionRef.current.unsubscribe();
    if (activeRoomRecallSubRef.current) activeRoomRecallSubRef.current.unsubscribe();
    if (activeRoomSeenSubRef.current) activeRoomSeenSubRef.current.unsubscribe();
    if (activeRoomTypingSubRef.current) activeRoomTypingSubRef.current.unsubscribe();

    activeRoomSubscriptionRef.current = null;
    activeRoomRecallSubRef.current = null;
    activeRoomSeenSubRef.current = null;
    activeRoomTypingSubRef.current = null;
  }

  function handleNotification(notif) {
    // Refresh room list
    loadRooms();
    loadPendingRequests();

    // Show toast or desktop notification if supported
    if (currentUser) {
      console.log("Thông báo mới: ", notif);
      if (activeRoom && activeRoom.id === notif.roomId) {
        // No toast needed if already inside room
        return;
      }
    }
  }

  // --- Chat Actions ---

  function handleTyping(e) {
    setMessageInput(e.target.value);
    if (!activeRoom || !stompClientRef.current?.connected) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      stompClientRef.current.publish({
        destination: "/app/chat.typing",
        body: JSON.stringify({ roomId: activeRoom.id, isTyping: true })
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (stompClientRef.current?.connected && activeRoom) {
        stompClientRef.current.publish({
          destination: "/app/chat.typing",
          body: JSON.stringify({ roomId: activeRoom.id, isTyping: false })
        });
      }
    }, 3000);
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if ((!messageInput.trim() && !attachmentMetadata) || !activeRoom) return;

    if (!stompClientRef.current?.connected) {
      alert("Mất kết nối server. Vui lòng đợi trong giây lát.");
      return;
    }

    const payload = {
      roomId: activeRoom.id,
      message: messageInput.trim()
    };

    if (attachmentMetadata) {
      payload.attachmentUrl = attachmentMetadata.url;
      payload.attachmentName = attachmentMetadata.name;
      payload.attachmentType = attachmentMetadata.type;
      payload.attachmentSize = attachmentMetadata.size;
    }

    stompClientRef.current.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(payload)
    });

    setMessageInput("");
    setAttachmentMetadata(null);
    setUploadingFile(null);

    // Cancel typing status immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stompClientRef.current.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({ roomId: activeRoom.id, isTyping: false })
    });
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(file);

    try {
      const data = await api.uploadChatAttachment(file);
      setAttachmentMetadata(data);
    } catch (err) {
      alert(err.message || "Không thể tải tệp lên.");
      setUploadingFile(null);
    }
  }

  function triggerRecallMessage(messageId) {
    if (!activeRoom || !stompClientRef.current?.connected) return;
    if (window.confirm("Bạn có chắc chắn muốn thu hồi tin nhắn này không?")) {
      stompClientRef.current.publish({
        destination: "/app/chat.recallMessage",
        body: JSON.stringify({ messageId, roomId: activeRoom.id })
      });
    }
  }

  // --- Group Chat Actions ---

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const room = await api.createGroupRoom(newGroupName.trim(), selectedGroupMembers);
      setIsGroupCreateOpen(false);
      setNewGroupName("");
      setSelectedGroupMembers([]);
      loadRooms();
      setActiveRoom(room);
    } catch (err) {
      alert(err.message);
    }
  }

  function toggleSelectGroupMember(userId) {
    setSelectedGroupMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  async function searchGroupMemberToAdd() {
    setGroupAddMemberError("");
    setGroupAddMemberResult(null);
    if (!groupAddMemberEmail.trim()) return;

    try {
      const res = await api.searchFriendByEmail(groupAddMemberEmail.trim());
      setGroupAddMemberResult(res);
    } catch (err) {
      setGroupAddMemberError(err.message);
    }
  }

  async function addMemberToGroup() {
    if (!groupAddMemberResult || !activeRoom) return;
    try {
      await api.addGroupMembers(activeRoom.id, [groupAddMemberResult.id]);
      alert("Đã thêm thành viên!");
      setGroupAddMemberEmail("");
      setGroupAddMemberResult(null);
      // Reload room members
      const updatedRooms = await api.getChatRooms();
      setRooms(updatedRooms);
      const curRoom = updatedRooms.find(r => r.id === activeRoom.id);
      if (curRoom) setActiveRoom(curRoom);
    } catch (err) {
      alert(err.message);
    }
  }

  async function kickGroupMember(userId) {
    if (!activeRoom) return;
    if (window.confirm("Xác nhận xóa thành viên này khỏi nhóm?")) {
      try {
        await api.removeGroupMember(activeRoom.id, userId);
        const updatedRooms = await api.getChatRooms();
        setRooms(updatedRooms);
        const curRoom = updatedRooms.find(r => r.id === activeRoom.id);
        if (curRoom) setActiveRoom(curRoom);
      } catch (err) {
        alert(err.message);
      }
    }
  }

  async function changeMemberRole(userId, role) {
    if (!activeRoom) return;
    try {
      await api.updateGroupMemberRole(activeRoom.id, userId, role);
      alert("Đã thay đổi quyền hạn thành công.");
      const updatedRooms = await api.getChatRooms();
      setRooms(updatedRooms);
      const curRoom = updatedRooms.find(r => r.id === activeRoom.id);
      if (curRoom) setActiveRoom(curRoom);
    } catch (err) {
      alert(err.message);
    }
  }

  async function changeGroupName(e) {
    e.preventDefault();
    if (!groupEditName.trim() || !activeRoom) return;
    try {
      await api.updateGroupName(activeRoom.id, groupEditName.trim());
      alert("Đổi tên nhóm thành công!");
      const updatedRooms = await api.getChatRooms();
      setRooms(updatedRooms);
      const curRoom = updatedRooms.find(r => r.id === activeRoom.id);
      if (curRoom) {
        setActiveRoom(curRoom);
      }
      setIsGroupDetailOpen(false);
    } catch (err) {
      alert(err.message);
    }
  }

  // --- Friendship Actions ---

  async function searchFriend() {
    setFriendSearchError("");
    setFriendSearchResult(null);
    if (!friendSearchEmail.trim()) return;
    setIsFriendSearching(true);

    try {
      const res = await api.searchFriendByEmail(friendSearchEmail.trim());
      setFriendSearchResult(res);
    } catch (err) {
      setFriendSearchError(err.message);
    } finally {
      setIsFriendSearching(false);
    }
  }

  async function sendFriendReq() {
    if (!friendSearchResult) return;
    try {
      await api.sendFriendRequest(friendSearchResult.email);
      alert("Đã gửi lời mời kết bạn!");
      setFriendSearchEmail("");
      setFriendSearchResult(null);
      loadPendingRequests();
    } catch (err) {
      alert(err.message);
    }
  }

  async function acceptFriend(requestId) {
    try {
      await api.acceptFriendRequest(requestId);
      alert("Kết bạn thành công!");
      loadPendingRequests();
      loadFriends();
      loadRooms();
    } catch (err) {
      alert(err.message);
    }
  }

  async function rejectFriend(requestId) {
    try {
      await api.rejectFriendRequest(requestId);
      loadPendingRequests();
    } catch (err) {
      alert(err.message);
    }
  }

  async function startPrivateChat(friendId) {
    try {
      const room = await api.createPrivateRoom(friendId);
      loadRooms();
      setActiveRoom(room);
      setActiveTab("rooms");
    } catch (err) {
      alert(err.message);
    }
  }

  // Helper formatting size
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // Render typing list
  function renderTypingText() {
    if (!activeRoom) return null;
    const activeTyping = typingUsers[activeRoom.id] || {};
    const usernames = Object.values(activeTyping).map(u => u.username);
    if (usernames.length === 0) return null;
    if (usernames.length === 1) return `${usernames[0]} đang nhập...`;
    return `${usernames.join(", ")} đang nhập...`;
  }

  const notFriendsColleagues = colleagues.filter(c => {
    if (!currentUser) return false;
    if (Number(c.id) === Number(currentUser.id)) return false;
    if (sentRequestUserIds.has(c.id)) return false;
    
    // Check if already friends
    const isFriend = friends.some(f => Number(f.friend.id) === Number(c.id));
    if (isFriend) return false;
    
    // Check if has incoming pending request
    const isIncoming = pendingRequests.some(r => Number(r.friend.id) === Number(c.id));
    if (isIncoming) return false;
    
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6 animate-fade-in text-darkText" style={{ display: "flex", height: "calc(100vh - 7rem)", margin: -24 }}>
      {/* 1. Left Sidebar */}
      <div style={{
        width: 320,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
      }}>
        {/* Tab Controls */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("rooms")}
            style={{
              flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
              borderBottom: activeTab === "rooms" ? "2px solid var(--accent)" : "none",
              color: activeTab === "rooms" ? "var(--accent)" : "var(--text-2)"
            }}
          >
            Hội thoại
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            style={{
              flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
              borderBottom: activeTab === "friends" ? "2px solid var(--accent)" : "none",
              color: activeTab === "friends" ? "var(--accent)" : "var(--text-2)"
            }}
          >
            Bạn bè ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            style={{
              flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
              borderBottom: activeTab === "pending" ? "2px solid var(--accent)" : "none",
              color: activeTab === "pending" ? "var(--accent)" : "var(--text-2)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4
            }}
          >
            Yêu cầu
            {pendingRequests.length > 0 && (
              <span style={{ padding: "1px 5px", borderRadius: "50%", background: "var(--danger)", color: "#fff", fontSize: 9 }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {activeTab === "rooms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Group Create Button */}
              <button
                className="btn-ghost"
                onClick={() => setIsGroupCreateOpen(true)}
                style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 0", border: "1px dashed var(--border)", borderRadius: 8, marginBottom: 8 }}
              >
                + Tạo nhóm chat mới
              </button>

              {rooms.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>Chưa có cuộc hội thoại nào</div>
              ) : (
                rooms.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRoom(r)}
                    style={{
                      width: "100%", padding: "10px 12px", border: "none", borderRadius: 8, textAlign: "left", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10, transition: "background 0.2s",
                      background: activeRoom && activeRoom.id === r.id ? "var(--accent-bg)" : "transparent"
                    }}
                    onMouseEnter={e => { if (!activeRoom || activeRoom.id !== r.id) e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={e => { if (!activeRoom || activeRoom.id !== r.id) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: r.type === "PRIVATE" ? "linear-gradient(135deg, #a78bfa, #818cf8)" 
                        : r.type === "PROJECT" ? "linear-gradient(135deg, #f59e0b, #d97706)" 
                        : r.type === "DEPARTMENT" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                        : r.type === "COMPANY" ? "linear-gradient(135deg, #10b981, #059669)"
                        : "linear-gradient(135deg, #6b7280, #4b5563)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13
                    }}>
                      {r.type === "PRIVATE" ? "💬" : r.type === "PROJECT" ? "📁" : r.type === "DEPARTMENT" ? "🏢" : r.type === "COMPANY" ? "📢" : "👥"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{r.name}</span>
                        {r.lastMessageTime && (
                          <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                            {new Date(r.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-2)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.lastMessage ? `${r.lastMessageSenderName ? r.lastMessageSenderName + ': ' : ''}${r.lastMessage}` : "Chưa có tin nhắn"}
                      </p>
                    </div>

                    {r.unreadCount > 0 && (
                      <span style={{
                        padding: "2px 6px", borderRadius: 99, background: "var(--danger)", color: "#fff", fontSize: 10, fontWeight: 600, flexShrink: 0
                      }}>{r.unreadCount}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === "friends" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Add friend search */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", margin: 0 }}>Thêm bạn bè qua email</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="email"
                    placeholder="ten@company.com"
                    value={friendSearchEmail}
                    onChange={e => setFriendSearchEmail(e.target.value)}
                    style={{ flex: 1, height: 32, fontSize: 12, padding: "0 8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, outline: "none", color: "var(--text)" }}
                  />
                  <button
                    onClick={searchFriend}
                    disabled={isFriendSearching}
                    style={{ height: 32, padding: "0 10px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}
                  >
                    Tìm
                  </button>
                </div>
                {friendSearchError && <p style={{ fontSize: 11, color: "var(--danger)", margin: 0 }}>{friendSearchError}</p>}
                {friendSearchResult && (
                  <div style={{ display: "flex", alignItems: "center", padding: 8, background: "var(--surface-2)", borderRadius: 6, marginTop: 4, justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                        {friendSearchResult.fullname[0]}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{friendSearchResult.fullname}</span>
                    </div>
                    <button
                      onClick={sendFriendReq}
                      style={{ padding: "4px 8px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                    >
                      Kết bạn
                    </button>
                  </div>
                )}
              </div>

              {/* Friends list */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", margin: "0 0 6px 0" }}>Tất cả bạn bè ({friends.length})</p>
                {friends.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>Chưa có bạn bè</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {friends.map(f => (
                      <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8, background: "var(--surface-2)", borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                            {f.friend.fullname[0]}
                          </div>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{f.friend.fullname}</p>
                            <p style={{ fontSize: 10, color: "var(--text-3)", margin: 0 }}>{f.friend.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => startPrivateChat(f.friend.id)}
                          style={{ padding: "4px 10px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                        >
                          Nhắn tin
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Company Colleagues */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", margin: "0 0 8px 0" }}>Đồng nghiệp trong công ty ({notFriendsColleagues.length})</p>
                {notFriendsColleagues.length === 0 ? (
                  <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", margin: "12px 0" }}>Không có đồng nghiệp mới nào</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                    {notFriendsColleagues.map(colleague => (
                      <div key={colleague.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "var(--surface-2)", borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {colleague.fullname ? colleague.fullname[0].toUpperCase() : "?"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{colleague.fullname}</p>
                            <p style={{ fontSize: 9, color: "var(--text-3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{colleague.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await api.sendFriendRequest(colleague.email);
                              alert(`Đã gửi lời mời kết bạn tới ${colleague.fullname}!`);
                              setSentRequestUserIds(prev => {
                                const newSet = new Set(prev);
                                newSet.add(colleague.id);
                                return newSet;
                              });
                            } catch (err) {
                              alert(err.message || "Lỗi khi gửi lời mời");
                            }
                          }}
                          style={{ padding: "4px 8px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}
                        >
                          Kết bạn
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "pending" && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", margin: "0 0 6px 0" }}>Yêu cầu kết bạn ({pendingRequests.length})</p>
              {pendingRequests.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>Không có yêu cầu nào</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {pendingRequests.map(r => (
                    <div key={r.id} style={{ padding: 8, background: "var(--surface-2)", borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                          {r.friend.fullname[0]}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{r.friend.fullname} muốn kết bạn</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => acceptFriend(r.id)}
                          style={{ flex: 1, padding: "4px 0", background: "var(--success)", color: "#fff", border: "none", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                        >
                          Đồng ý
                        </button>
                        <button
                          onClick={() => rejectFriend(r.id)}
                          style={{ flex: 1, padding: "4px 0", background: "var(--danger)", color: "#fff", border: "none", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle Panel: Messages View */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        {activeRoom ? (
          <>
            {/* Chat Room Header */}
            <div style={{
              height: 56, padding: "0 24px", display: "flex", alignItems: "center",
              borderBottom: "1px solid var(--border)", background: "var(--surface)", justifyContent: "space-between"
            }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                  {activeRoom.name}
                  {activeRoom.type === "PROJECT" && <span style={{ fontSize: 10, color: "var(--warning)", background: "var(--warning)15", border: "1px solid var(--warning)30", borderRadius: 4, padding: "1px 5px", marginLeft: 8 }}>Dự án</span>}
                  {activeRoom.type === "GROUP" && <span style={{ fontSize: 10, color: "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", marginLeft: 8 }}>Nhóm</span>}
                  {activeRoom.type === "DEPARTMENT" && <span style={{ fontSize: 10, color: "var(--accent)", background: "var(--accent)15", border: "1px solid var(--accent)30", borderRadius: 4, padding: "1px 5px", marginLeft: 8 }}>Phòng ban</span>}
                  {activeRoom.type === "COMPANY" && <span style={{ fontSize: 10, color: "var(--success)", background: "var(--success)15", border: "1px solid var(--success)30", borderRadius: 4, padding: "1px 5px", marginLeft: 8 }}>Tổng công ty</span>}
                </h3>
                <p style={{ fontSize: 11, color: "var(--text-3)", margin: "2px 0 0 0" }}>{activeRoom.members?.length || 0} thành viên</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Search query input inside active room */}
                <div style={{ relative: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Tìm tin nhắn..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      height: 32, width: 140, padding: "0 8px", fontSize: 11, border: "1px solid var(--border)", borderRadius: 6,
                      background: "var(--surface)", outline: "none", color: "var(--text)"
                    }}
                  />
                  <button
                    onClick={() => loadRoomMessages(activeRoom.id)}
                    style={{ height: 32, padding: "0 10px", background: "var(--surface-2)", border: "1px solid var(--border)", borderLeft: "none", borderRadius: "0 6px 6px 0", cursor: "pointer", fontSize: 11 }}
                  >
                    🔍
                  </button>
                </div>

                {activeRoom.type === "GROUP" && (
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setGroupEditName(activeRoom.name);
                      setIsGroupDetailOpen(true);
                    }}
                    style={{ fontSize: 12, padding: "6px 10px" }}
                  >
                    ⚙️ Quản lý nhóm
                  </button>
                )}
              </div>
            </div>

            {/* Messages Stream */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 13 }}>
                  Chưa có tin nhắn nào. Gửi lời chào để bắt đầu!
                </div>
              ) : (
                messages.map((m, index) => {
                  const isMe = currentUser && m.senderId === currentUser.id;
                  return (
                    <div key={m.id || index} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", gap: 8, maxWidth: "70%", alignItems: "flex-start" }}>
                        {!isMe && (
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {m.senderName ? m.senderName[0].toUpperCase() : "?"}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                          {!isMe && <span style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 2 }}>{m.senderName}</span>}
                          
                          {/* Message bubble */}
                          <div style={{
                            padding: "10px 14px", borderRadius: 12, fontSize: 13, wordBreak: "break-word", position: "relative",
                            background: isMe ? "var(--accent)" : "var(--surface)",
                            color: isMe ? "#fff" : "var(--text)",
                            border: isMe ? "none" : "1px solid var(--border)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}>
                            {m.isRecalled ? (
                              <em style={{ color: isMe ? "#ffffffaa" : "var(--text-3)" }}>Tin nhắn đã bị thu hồi</em>
                            ) : (
                              <>
                                {/* Attachments */}
                                {m.attachmentUrl && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: m.message ? 8 : 0 }}>
                                    {m.attachmentType.startsWith("image/") ? (
                                      <img
                                        src={m.attachmentUrl}
                                        alt={m.attachmentName}
                                        style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, objectFit: "cover", cursor: "pointer" }}
                                        onClick={() => window.open(m.attachmentUrl, "_blank")}
                                      />
                                    ) : (
                                      <div style={{
                                        display: "flex", alignItems: "center", gap: 8, padding: 8, borderRadius: 8,
                                        background: isMe ? "rgba(255,255,255,0.1)" : "var(--surface-2)",
                                        border: isMe ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--border)"
                                      }}>
                                        <span style={{ fontSize: 18 }}>📄</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <p style={{ fontSize: 11, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isMe ? "#fff" : "var(--text)" }}>
                                            {m.attachmentName}
                                          </p>
                                          <p style={{ fontSize: 9, margin: 0, color: isMe ? "#ffffffaa" : "var(--text-3)" }}>
                                            {formatBytes(m.attachmentSize)}
                                          </p>
                                        </div>
                                        <a
                                          href={m.attachmentUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ textDecoration: "none", fontSize: 12, padding: "4px 8px", background: "var(--accent)", color: "#fff", borderRadius: 6 }}
                                        >
                                          Tải
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {m.message && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.message}</p>}
                              </>
                            )}
                          </div>
                          
                          {/* Sent/Seen Status */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <span style={{ fontSize: 9, color: "var(--text-3)" }}>
                              {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span style={{ fontSize: 9, color: m.seenAt ? "var(--success)" : "var(--text-3)" }}>
                                {m.seenAt ? "✓ Đã xem" : "✓ Đã gửi"}
                              </span>
                            )}
                            {isMe && !m.isRecalled && (
                              <button
                                onClick={() => triggerRecallMessage(m.id)}
                                style={{ border: "none", background: "none", cursor: "pointer", color: "var(--danger)", fontSize: 9, padding: 0, marginLeft: 4 }}
                              >
                                Thu hồi
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Live typing status */}
              {renderTypingText() && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-3)" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    <span className="animate-bounce" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)" }} />
                    <span className="animate-bounce" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", animationDelay: "150ms" }} />
                    <span className="animate-bounce" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", animationDelay: "300ms" }} />
                  </div>
                  <span>{renderTypingText()}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: 16, background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
              <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                
                {/* File attachment preview */}
                {uploadingFile && (
                  <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", background: "var(--surface-2)", borderRadius: 8, justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>📎</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{uploadingFile.name}</span>
                      {!attachmentMetadata ? (
                        <span style={{ fontSize: 10, color: "var(--text-3)" }}>Đang tải lên...</span>
                      ) : (
                        <span style={{ fontSize: 10, color: "var(--success)" }}>Sẵn sàng</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadingFile(null);
                        setAttachmentMetadata(null);
                      }}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "var(--danger)", fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {/* File attach button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0
                    }}
                  >
                    📎
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />

                  {/* Input field */}
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={messageInput}
                    onChange={handleTyping}
                    style={{
                      flex: 1, height: 38, padding: "0 14px", borderRadius: 8, border: "1px solid var(--border)",
                      background: "var(--bg)", color: "var(--text)", outline: "none", fontSize: 13
                    }}
                  />

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={(!messageInput.trim() && !attachmentMetadata) || (uploadingFile && !attachmentMetadata)}
                    style={{ width: "auto", height: 38, padding: "0 18px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span>Gửi</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22,2 15,22 11,13 2,9" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-3)", gap: 12 }}>
            <span style={{ fontSize: 48 }}>💬</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Cổng Thông Tin Tin Nhắn</h3>
            <p style={{ margin: 0, fontSize: 13 }}>Hãy chọn một cuộc hội thoại từ thanh bên để bắt đầu trò chuyện realtime.</p>
          </div>
        )}
      </div>

      {/* 3. Group Create Modal */}
      {isGroupCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsGroupCreateOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tạo nhóm chat mới</h2>
              <button className="modal-close" onClick={() => setIsGroupCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="field-label">Tên nhóm <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="VD: Nhóm Kỹ Thuật, Nhóm Ăn Trưa..."
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Chọn thành viên nhóm (từ bạn bè)</label>
                  {friends.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>Hãy kết bạn trước khi tạo nhóm.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 8 }}>
                      {friends.map(f => (
                        <label key={f.friend.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: 4, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedGroupMembers.includes(f.friend.id)}
                            onChange={() => toggleSelectGroupMember(f.friend.id)}
                          />
                          <span>{f.friend.fullname} ({f.friend.email})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsGroupCreateOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={!newGroupName.trim() || selectedGroupMembers.length === 0} style={{ width: "auto", padding: "0 20px" }}>
                  Tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Group Detail/Settings Modal */}
      {isGroupDetailOpen && activeRoom && (
        <div className="modal-overlay" onClick={() => setIsGroupDetailOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Cấu hình nhóm chat</h2>
              <button className="modal-close" onClick={() => setIsGroupDetailOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Change name form */}
              <form onSubmit={changeGroupName} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                <label className="field-label">Đổi tên nhóm</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    required
                    value={groupEditName}
                    onChange={e => setGroupEditName(e.target.value)}
                    className="field-input"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 14px", height: 40 }}>Lưu</button>
                </div>
              </form>

              {/* Add member form */}
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                <label className="field-label">Thêm thành viên mới</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="email"
                    placeholder="Nhập email của bạn bè..."
                    value={groupAddMemberEmail}
                    onChange={e => setGroupAddMemberEmail(e.target.value)}
                    className="field-input"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={searchGroupMemberToAdd} className="btn-secondary" style={{ height: 40 }}>Tìm</button>
                </div>
                {groupAddMemberError && <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}>{groupAddMemberError}</p>}
                {groupAddMemberResult && (
                  <div style={{ display: "flex", alignItems: "center", padding: 8, background: "var(--surface-2)", borderRadius: 6, marginTop: 8, justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12 }}>{groupAddMemberResult.fullname} ({groupAddMemberResult.email})</span>
                    <button onClick={addMemberToGroup} style={{ padding: "4px 8px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>Thêm</button>
                  </div>
                )}
              </div>

              {/* Group members list */}
              <div>
                <label className="field-label">Thành viên trong nhóm ({activeRoom.members?.length || 0})</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                  {activeRoom.members?.map(member => {
                    const crm = activeRoom.members.find(u => u.id === member.id);
                    return (
                      <div key={member.id} style={{ display: "flex", alignItems: "center", padding: "6px 8px", background: "var(--surface-2)", borderRadius: 6, justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{member.fullname}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {currentUser && currentUser.id !== member.id && (
                            <button
                              onClick={() => kickGroupMember(member.id)}
                              style={{ padding: "2px 6px", background: "none", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 4, fontSize: 10, cursor: "pointer" }}
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsGroupDetailOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
