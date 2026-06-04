import { useState } from "react";

const channels = [
  { id: 1, name: "general", type: "channel", unread: 3, lastMessage: "Nguyễn A: Deploy xong rồi nhé" },
  { id: 2, name: "backend-team", type: "channel", unread: 0, lastMessage: "Lê C: PR đã merge" },
  { id: 3, name: "frontend-team", type: "channel", unread: 1, lastMessage: "Trần B: Update UI mới" },
  { id: 4, name: "random", type: "channel", unread: 0, lastMessage: "Phạm D: Ai đi ăn trưa?" }
];

const directMessages = [
  { id: 5, name: "Nguyễn Văn A", type: "dm", status: "online", unread: 2, lastMessage: "Check PR giúp mình nhé" },
  { id: 6, name: "Trần Thị B", type: "dm", status: "online", unread: 0, lastMessage: "OK, mình sẽ review" },
  { id: 7, name: "Lê Văn C", type: "dm", status: "offline", unread: 0, lastMessage: "Đã fix xong bug đó" }
];

const messages = [
  { id: 1, user: "Nguyễn Văn A", avatar: "N", time: "09:30", content: "Mọi người ơi, mình vừa deploy xong version mới lên staging nhé.", reactions: [{ emoji: "👍", count: 3 }] },
  { id: 2, user: "Trần Thị B", avatar: "T", time: "09:32", content: "Nice! Mình sẽ test ngay. Có gì thay đổi lớn không?", reactions: [] },
  { id: 3, user: "Nguyễn Văn A", avatar: "N", time: "09:33", content: "Chủ yếu fix bug login và optimize performance cho dashboard. Chi tiết trong PR #142.", reactions: [{ emoji: "🔥", count: 2 }] },
  { id: 4, user: "Lê Văn C", avatar: "L", time: "09:35", content: "Mình đã check DevOps side, mọi thứ ổn. Monitoring không có alert nào.", reactions: [{ emoji: "✅", count: 4 }] },
  { id: 5, user: "Phạm Thị D", avatar: "P", time: "09:40", content: "Mình bắt đầu test flow payment nhé. Có ai cần mình test thêm gì không?", reactions: [] }
];

function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  const [messageInput, setMessageInput] = useState("");

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6 animate-fade-in">
      {/* Chat Sidebar */}
      <div className="w-[280px] bg-darkCard border-r border-darkBorder flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-darkBorder">
          <h2 className="text-base font-semibold text-darkText mb-3">Messages</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-darkTextGray" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-darkBg border border-darkBorder text-sm text-darkText placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold text-darkTextGray uppercase tracking-wider px-2 mb-2">Channels</p>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                ${selectedChannel.id === channel.id ? "bg-primaryBlue/10 text-primaryBlue" : "text-darkTextGray hover:bg-white/5 hover:text-darkText"}`}
            >
              <span className="text-sm">#</span>
              <span className="flex-1 text-sm truncate">{channel.name}</span>
              {channel.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primaryBlue text-white text-[10px] flex items-center justify-center font-medium">
                  {channel.unread}
                </span>
              )}
            </button>
          ))}

          <p className="text-xs font-semibold text-darkTextGray uppercase tracking-wider px-2 mb-2 mt-4">Direct Messages</p>
          {directMessages.map((dm) => (
            <button
              key={dm.id}
              onClick={() => setSelectedChannel(dm)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                ${selectedChannel.id === dm.id ? "bg-primaryBlue/10 text-primaryBlue" : "text-darkTextGray hover:bg-white/5 hover:text-darkText"}`}
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accentIndigo to-accentPurple flex items-center justify-center text-white text-[10px] font-medium">
                  {dm.name.charAt(0)}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-darkCard ${dm.status === "online" ? "bg-successGreen" : "bg-darkTextGray"}`} />
              </div>
              <span className="flex-1 text-sm truncate">{dm.name}</span>
              {dm.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-dangerRed text-white text-[10px] flex items-center justify-center font-medium">
                  {dm.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Main */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-darkBorder shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-darkTextGray">#</span>
            <h3 className="text-sm font-semibold text-darkText">{selectedChannel.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-darkTextGray hover:text-darkText hover:bg-white/5 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <button className="p-2 rounded-lg text-darkTextGray hover:text-darkText hover:bg-white/5 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accentIndigo to-accentPurple flex items-center justify-center text-white text-sm font-medium shrink-0">
                {message.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-darkText">{message.user}</span>
                  <span className="text-xs text-darkTextGray">{message.time}</span>
                </div>
                <p className="text-sm text-darkText/90 leading-relaxed">{message.content}</p>
                {message.reactions.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {message.reactions.map((reaction, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-darkBorder/50 text-xs">
                        {reaction.emoji} <span className="text-darkTextGray">{reaction.count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          <div className="flex items-center gap-2 text-xs text-darkTextGray">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-darkTextGray animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-darkTextGray animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-darkTextGray animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>Trần B đang nhập...</span>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-darkBorder">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-darkTextGray hover:text-darkText hover:bg-white/5 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              type="text"
              placeholder={`Nhắn tin vào #${selectedChannel.name}...`}
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              className="flex-1 h-10 px-4 rounded-xl bg-darkBg border border-darkBorder text-sm text-darkText placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors"
            />
            <button className="p-2 rounded-lg text-darkTextGray hover:text-darkText hover:bg-white/5 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            <button className="p-2.5 rounded-xl bg-primaryBlue text-white hover:bg-blue-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
