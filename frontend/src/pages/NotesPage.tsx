import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Plus,
  Star,
  Edit2,
  Trash2,
  Tag,
  Calendar,
} from 'lucide-react';
import { notesApi } from '../api/endpoints';
import type { Note } from '../api/types';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const DEFAULT_CATEGORIES = ['General', 'School', 'Personal', 'Ideas', 'Finance', 'Fitness', 'Work'];

export const NotesPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formState, setFormState] = useState({
    title: '',
    category: 'General',
    content: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete Dialog State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await notesApi.list({
        q: searchQuery.trim() || undefined,
        favorite: showOnlyFavorites ? true : undefined,
      });
      setNotes(res || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch notes';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, showOnlyFavorites]);

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    notes.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (selectedCategory !== 'All' && note.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [notes, selectedCategory]);

  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setFormState({ title: '', category: 'General', content: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: Note) => {
    setEditingNote(note);
    setFormState({
      title: note.title,
      category: note.category || 'General',
      content: note.content,
    });
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) return;

    setSaving(true);
    try {
      if (editingNote) {
        await notesApi.update(editingNote.id, {
          title: formState.title,
          category: formState.category,
          content: formState.content,
        });
        showToast('Note updated!', 'success');
      } else {
        await notesApi.create({
          title: formState.title,
          category: formState.category,
          content: formState.content,
          favorite: false,
        });
        showToast('Note created!', 'success');
      }
      setIsModalOpen(false);
      fetchNotes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save note';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await notesApi.toggleFavorite(note.id);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, favorite: updated.favorite } : n))
      );
      showToast(
        updated.favorite ? 'Added to favorites' : 'Removed from favorites',
        'info'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle favorite';
      showToast(msg, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await notesApi.delete(deleteTargetId);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTargetId));
      showToast('Note deleted', 'success');
      setDeleteTargetId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete note';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes & Knowledge Base"
        subtitle="Organize thoughts, study notes, ideas, and favorites."
        action={
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-darkcard text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 border-slate-200 dark:border-darkborder transition-all"
          />
        </div>

        <Button
          variant={showOnlyFavorites ? 'primary' : 'outline'}
          size="md"
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-center"
        >
          <Star className={`w-4 h-4 ${showOnlyFavorites ? 'fill-current' : ''}`} />
          <span>Favorites Only</span>
        </Button>
      </div>

      {/* Category Chips Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <Chip
          variant={selectedCategory === 'All' ? 'primary' : 'secondary'}
          onClick={() => setSelectedCategory('All')}
          className="cursor-pointer select-none shrink-0"
        >
          All
        </Chip>
        {categories.map((cat) => (
          <Chip
            key={cat}
            variant={selectedCategory === cat ? 'primary' : 'outline'}
            onClick={() => setSelectedCategory(cat)}
            className="cursor-pointer select-none shrink-0"
          >
            {cat}
          </Chip>
        ))}
      </div>

      {/* Notes Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes found"
          description={
            searchQuery || selectedCategory !== 'All' || showOnlyFavorites
              ? 'Try adjusting your search query or filters.'
              : 'Create your first note to capture ideas, plans, and study guides.'
          }
          actionLabel="Create Note"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="p-5 flex flex-col justify-between hover:border-brand-500/40 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2">
                    {note.title}
                  </h3>
                  <button
                    onClick={(e) => handleToggleFavorite(note, e)}
                    className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors shrink-0 focus:outline-none"
                    title={note.favorite ? 'Unfavorite' : 'Favorite'}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        note.favorite
                          ? 'text-amber-500 fill-amber-500'
                          : 'hover:text-amber-500'
                      }`}
                    />
                  </button>
                </div>

                {note.category && (
                  <div className="mb-3">
                    <Chip variant="secondary" size="sm" icon={Tag}>
                      {note.category}
                    </Chip>
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {note.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-darkborder/60 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3 h-3" />
                  {note.updated_date
                    ? new Date(note.updated_date).toLocaleDateString()
                    : note.created_date
                    ? new Date(note.created_date).toLocaleDateString()
                    : 'Recent'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(note)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                    title="Edit Note"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(note.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? 'Edit Note' : 'Create Note'}
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Biology Exam Review or Weekly Goals"
            value={formState.title}
            onChange={(e) => setFormState({ ...formState, title: e.target.value })}
            required
          />

          <Select
            label="Category"
            value={formState.category}
            onChange={(e) => setFormState({ ...formState, category: e.target.value })}
            options={DEFAULT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
          />

          <Textarea
            label="Content"
            rows={6}
            placeholder="Write your note content here..."
            value={formState.content}
            onChange={(e) => setFormState({ ...formState, content: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingNote ? 'Update Note' : 'Create Note'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
