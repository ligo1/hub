import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Note } from '../../types';

interface NoteCardProps {
  note: Note;
  onUpdate?: (id: string, title: string, content: string) => void;
  onDelete?: (id: string) => void;
}

export const NoteCard = ({ note, onUpdate, onDelete }: NoteCardProps) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleSave = () => {
    onUpdate?.(note.id, title, content);
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(note.title);
    setContent(note.content);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-800 rounded-xl border border-white/5 p-4 group hover:border-white/10 transition-all"
    >
      {editing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-700 text-white text-sm font-semibold px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-accent-purple-light"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full bg-surface-700 text-white/80 text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-accent-purple-light resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 font-medium">
              <Check size={12} /> Save
            </button>
            <button onClick={handleCancel} className="flex items-center gap-1 text-xs text-white/40 hover:text-white font-medium">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-white text-sm font-semibold">{note.title}</h4>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => setEditing(true)} className="p-1 text-white/30 hover:text-white/80 transition-colors" aria-label="Edit note">
                <Pencil size={13} />
              </button>
              {onDelete && (
                <button onClick={() => onDelete(note.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors" aria-label="Delete note">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
          <p className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap">{note.content}</p>
          <p className="text-white/20 text-[10px] mt-3">
            {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </>
      )}
    </motion.div>
  );
};
