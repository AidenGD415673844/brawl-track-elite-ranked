import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Plus, Trash2, Pencil, Check, X, Users, ArrowRight, Gauge,
} from "lucide-react";
import {
  getSpaces, createSpace, deleteSpace, updateSpace,
  loadSpaceData, syncActiveSpace, getActiveSpaceId, getGreeting,
} from "@/lib/brawlSpaces";

export default function BrawlSpaces() {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");

  useEffect(() => {
    // Sync current data back to active space before loading the list
    syncActiveSpace();
    setSpaces(getSpaces());
    setActiveId(getActiveSpaceId());
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const space = createSpace(newName.trim(), newUsername.trim());
    setSpaces(getSpaces());
    setCreating(false);
    setNewName("");
    setNewUsername("");
    handleSelect(space.id);
  };

  const handleSelect = (id) => {
    loadSpaceData(id);
    setActiveId(id);
    navigate("/");
  };

  const handleDelete = (id) => {
    deleteSpace(id);
    setSpaces(getSpaces());
    setActiveId(getActiveSpaceId());
  };

  const handleStartEdit = (space) => {
    setEditingId(space.id);
    setEditName(space.name);
    setEditUsername(space.username || "");
  };

  const handleSaveEdit = (id) => {
    updateSpace(id, { name: editName.trim(), username: editUsername.trim() });
    setSpaces(getSpaces());
    setEditingId(null);
  };

  const greeting = getGreeting();
  const activeSpace = spaces.find((s) => s.id === activeId);
  const displayName = activeSpace?.username || "Player";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12] dark:opacity-40"
        style={{
          background:
            "radial-gradient(600px circle at 20% 0%, rgba(34,211,238,0.12), transparent 40%), radial-gradient(600px circle at 90% 10%, rgba(168,85,247,0.14), transparent 40%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-8 pb-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 mx-auto mb-4">
            <Gauge className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight bg-gradient-to-r from-cyan-500 to-purple-600 dark:from-cyan-300 dark:to-purple-300 bg-clip-text text-transparent">
            {greeting}! {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Select a BrawlSpace to continue tracking your ranked journey
          </p>
        </motion.div>

        {/* Spaces grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {spaces.map((space) => (
              <motion.div
                key={space.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card
                  className={`p-5 rounded-2xl bg-card border-border cursor-pointer transition hover:border-cyan-500/50 ${
                    space.id === activeId ? "border-cyan-500/50 ring-1 ring-cyan-500/30" : ""
                  }`}
                  onClick={() => editingId !== space.id && handleSelect(space.id)}
                >
                  {editingId === space.id ? (
                    /* Edit mode */
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Space Name</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-muted border-border text-foreground text-sm h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Username</Label>
                        <Input
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder="In-game username"
                          className="bg-muted border-border text-foreground text-sm h-8 mt-1"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={() => handleSaveEdit(space.id)} className="h-7 bg-emerald-500 text-white rounded-lg">
                          <Check className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 border-border rounded-lg">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-cyan-500" />
                          <h3 className="font-display font-bold text-foreground">{space.name}</h3>
                        </div>
                        {space.username && (
                          <p className="text-xs text-muted-foreground mb-2">@{space.username}</p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{space.battleLog?.length || 0} battles</span>
                          <span>{space.snapshots?.length || 0} snapshots</span>
                          {space.playerData?.currentElo && (
                            <span>{space.playerData.currentElo.toLocaleString()} Elo</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => handleStartEdit(space)} className="h-7 w-7 p-0">
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(space.id)} className="h-7 w-7 p-0 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {editingId !== space.id && (
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
                      <span className="text-[10px] font-bold text-cyan-500 flex items-center gap-1">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Create new space card */}
          {creating ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-5 rounded-2xl bg-card border-cyan-500/30 border-dashed">
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Space Name</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Main Account"
                      className="bg-muted border-border text-foreground text-sm h-8 mt-1"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Username</Label>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="In-game username"
                      className="bg-muted border-border text-foreground text-sm h-8 mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleCreate} disabled={!newName.trim()} className="h-7 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg">
                      <Plus className="w-3 h-3 mr-1" /> Create
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setCreating(false); setNewName(""); setNewUsername(""); }} className="h-7 border-border rounded-lg">
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setCreating(true)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-2 min-h-[140px] hover:border-cyan-500/50 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">New BrawlSpace</span>
            </motion.button>
          )}
        </div>

        {/* Back to home */}
        <div className="flex justify-center pt-4">
          <Link to="/">
            <Button variant="outline" className="border-border bg-card text-foreground hover:bg-muted rounded-xl">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}