"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "vs_notes";

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(ms) {
  const d = new Date(ms);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isYesterday = new Date(now - 864e5).toDateString() === d.toDateString();
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

export default function NotesModal({ onClose }) {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(() => {
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedNote = notes.find((n) => n.id === selectedId);
  const isEditing = selectedId != null;

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setBody(selectedNote.body ?? "");
    } else {
      setTitle("");
      setBody("");
    }
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.body]);

  const persist = useCallback((nextNotes) => {
    setNotes(nextNotes);
    saveNotes(nextNotes);
  }, []);

  const createNote = useCallback(() => {
    const id = generateId();
    const note = { id, title: "New Note", body: "", updatedAt: Date.now() };
    persist([note, ...notes]);
    setSelectedId(id);
    setTitle("New Note");
    setBody("");
  }, [notes, persist]);

  const saveCurrent = useCallback(() => {
    if (!selectedId) return;
    const next = notes.map((n) =>
      n.id === selectedId
        ? { ...n, title: title.trim() || "New Note", body: body.trim(), updatedAt: Date.now() }
        : n
    );
    persist(next);
  }, [selectedId, title, body, notes, persist]);

  const deleteNote = useCallback(() => {
    if (!selectedId) return;
    persist(notes.filter((n) => n.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, notes, persist]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        saveCurrent();
        if (isEditing) setSelectedId(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isEditing, onClose, saveCurrent]);

  const handleBack = () => {
    saveCurrent();
    setSelectedId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] m-auto bg-[#f5f5f7] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* List sidebar */}
        <div className={`w-full md:w-72 shrink-0 border-r border-gray-200/80 flex flex-col bg-white/90 ${isEditing ? "hidden md:flex" : ""}`}>
          <div className="p-3 border-b border-gray-200/80 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-gray-800">Notes</span>
            <button
              onClick={createNote}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200/80 hover:text-gray-800 transition-colors cursor-pointer"
              title="New note"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No notes yet</div>
            ) : (
              notes
                .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
                .map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedId(note.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-100/80 transition-colors cursor-pointer ${
                      selectedId === note.id ? "bg-[#e8e8ed]" : ""
                    }`}
                  >
                    <div className="font-medium text-[15px] text-gray-900 truncate">
                      {note.title || "New Note"}
                    </div>
                    <div className="text-[13px] text-gray-500 truncate mt-0.5">
                      {note.body?.replace(/\n/g, " ").slice(0, 60) || "No content"}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">{formatDate(note.updatedAt)}</div>
                  </button>
                ))
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f5f5f7]">
          {isEditing ? (
            <>
              <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-b border-gray-200/80 bg-white/90">
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200/80 cursor-pointer md:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveCurrent}
                  placeholder="Title"
                  className="flex-1 bg-transparent text-[17px] font-semibold text-gray-900 placeholder-gray-400 outline-none py-1"
                />
                <button
                  onClick={() => { saveCurrent(); deleteNote(); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                  title="Delete note"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onBlur={saveCurrent}
                placeholder="Start writing..."
                className="flex-1 w-full resize-none px-4 py-4 text-[15px] text-gray-800 placeholder-gray-400 bg-transparent outline-none leading-relaxed"
                style={{ minHeight: 200 }}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-[15px]">
              Select a note or create a new one
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => { saveCurrent(); onClose(); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-200/80 flex items-center justify-center text-gray-600 hover:bg-gray-300/80 transition-colors cursor-pointer z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
