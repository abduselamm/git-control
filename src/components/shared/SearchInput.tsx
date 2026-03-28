"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search…", id }: Props) {
  return (
    <div className="relative">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8 py-1.5 rounded-md text-sm w-full focus:outline-none"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
