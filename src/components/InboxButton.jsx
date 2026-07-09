import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/lib/inbox";

export default function InboxButton({ onClick }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const update = () => setUnread(getUnreadCount());
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative w-9 h-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition flex items-center justify-center"
    >
      <Bell className="w-4 h-4" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}