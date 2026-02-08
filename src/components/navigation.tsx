"use client";

import { useState } from "react";

export type ViewType = "activity" | "summary" | "projects" | "calendar" | "search";

interface NavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const tabs: { id: ViewType; label: string; icon: string }[] = [
  { id: "summary", label: "Summary", icon: "📋" },
  { id: "activity", label: "Activity", icon: "📊" },
  { id: "projects", label: "Projects", icon: "🎯" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "search", label: "Search", icon: "🔍" },
];

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  return (
    <nav className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeView === tab.id
              ? "bg-aurora-500/20 text-aurora-300 border border-aurora-500/50"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
