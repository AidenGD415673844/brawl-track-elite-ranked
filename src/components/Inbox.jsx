import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Flame, AlertTriangle, Trophy, Star, BookOpen, X, CheckCheck, Trash2 } from "lucide-react";
import {
  loadInbox,
  markInboxRead,
  markAllInboxRead,
  deleteInboxMessage,
  clearInbox,
} from "@/lib/inbox";

const ICON_MAP = {
  flame: Flame,
  alert: AlertTriangle,
  trophy: Trophy,
  star: Star,
  book: BookOpen,
};

const TYPE_COLORS = {
  streak: "text-orange-500",
  tilt: "text-red-500",
  rankup: "text-yellow-500",
  milestone: "text-cyan-500",
  upgrade: "text-cyan-400",
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Inbox({ open, onClose }) {
  const [messages, setMessages] = useState(() => loadInbox());
  const [activeCategory, setActiveCategory] = useState("all");

  const refresh = () => setMessages(loadInbox());

  const handleRead = (id) => {
    setMessages(markInboxRead(id));
  };

  const handleReadAll = () => {
    setMessages(markAllInboxRead());
  };

  const handleDelete = (id) => {
    setMessages(deleteInboxMessage(id));
  };

  const handleClear = () => {
    setMessages(clearInbox());
  };

  const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "insights", label: "Insights" },
    { id: "alerts", label: "Alerts" },
    { id: "achievements", label: "Achievements" },
  ];

  const filteredMessages = activeCategory === "all"
    ? messages
    : messages.filter((m) => (m.category || "insights") === activeCategory);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 p-4"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <Card className="h-full flex flex-col bg-card/95 backdrop-blur-xl border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-500" />
                  <h3 className="text-sm font-display font-bold text-foreground">Inbox</h3>
                  {messages.filter((m) => !m.read).length > 0 && (
                    <span className="text-[10px] font-bold bg-cyan-500 text-white rounded-full px-1.5 py-0.5">
                      {messages.filter((m) => !m.read).length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <>
                      <Button size="sm" variant="ghost" onClick={handleReadAll} className="h-7 px-2 text-[10px]">
                        <CheckCheck className="w-3.5 h-3.5 mr-1" /> Read All
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleClear} className="h-7 px-2 text-[10px] hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={onClose} className="h-7 px-2">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Category tabs */}
              <div className="flex gap-1 px-3 py-2 border-b border-border">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-display font-bold transition ${
                      activeCategory === cat.id
                        ? "bg-cyan-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Streak alerts, rank-ups, and tilt warnings will appear here.
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const Icon = ICON_MAP[msg.icon] || Star;
                    const colorClass = TYPE_COLORS[msg.type] || "text-muted-foreground";
                    return (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className={`rounded-xl border p-3 cursor-pointer transition ${
                          msg.read
                            ? "bg-muted/30 border-border"
                            : "bg-cyan-500/5 border-cyan-500/20"
                        }`}
                        onClick={() => !msg.read && handleRead(msg.id)}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorClass}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">{msg.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{msg.body}</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(msg.timestamp)}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                            className="text-muted-foreground hover:text-red-500 transition shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}