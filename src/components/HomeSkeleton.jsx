import React from "react";

export default function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-44 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted rounded-xl animate-pulse" />
            <div className="h-9 w-24 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="h-28 w-full rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-52 w-full rounded-2xl border border-border bg-card animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-32 rounded-2xl border border-border bg-card animate-pulse" />
          <div className="h-32 rounded-2xl border border-border bg-card animate-pulse" />
        </div>
        <div className="h-80 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
    </div>
  );
}