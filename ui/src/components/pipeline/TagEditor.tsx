"use client";

import { useState, useRef, useEffect, useId } from "react";

interface TagEditorProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  allTags?: string[];
}

export function TagEditor({ tags, onAdd, onRemove, allTags }: TagEditorProps) {
  const id = useId();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const trimmed = input.trim().toLowerCase();

  const suggestions =
    allTags && trimmed.length > 0
      ? allTags.filter(
          (t) =>
            t.toLowerCase().includes(trimmed) &&
            !tags.includes(t)
        )
      : [];

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function addTag(tag: string) {
    const value = tag.trim();
    if (value && !tags.includes(value)) {
      onAdd(value);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        addTag(suggestions[selectedIndex] || suggestions[0]);
      } else if (input.trim()) {
        addTag(input.trim());
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "ArrowDown" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-foreground mb-1.5"
      >
        Tags
      </label>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[11px]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-accent/70 transition-colors cursor-pointer leading-none"
                aria-label={`Remove tag ${tag}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input with autocomplete */}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="w-full border border-sidebar-border rounded-md px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          placeholder="Add a tag..."
          spellCheck={false}
          autoComplete="off"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-20 left-0 right-0 mt-1 bg-surface border border-sidebar-border rounded-md shadow-lg max-h-40 overflow-y-auto"
          >
            {suggestions.map((suggestion, i) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                  i === selectedIndex
                    ? "bg-accent/10 text-accent"
                    : "text-foreground hover:bg-surface-hover"
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
