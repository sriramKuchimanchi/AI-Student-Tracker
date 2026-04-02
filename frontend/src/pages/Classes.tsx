import { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, School } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { ClassWithSections } from '../types';

export default function Classes() {
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [newClassName, setNewClassName] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [newSectionName, setNewSectionName] = useState<Record<number, string>>({});
  const [addingSectionFor, setAddingSectionFor] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchClasses = (): void => {
    api.get<ClassWithSections[]>('/classes').then(r => setClasses(r.data)).catch(console.error);
  };

  useEffect(() => { fetchClasses(); }, []);

  const toggleExpand = (id: number): void => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddClass = async (): Promise<void> => {
    const name = newClassName.trim();
    if (!name) { toast.error('Class name cannot be empty'); return; }
    setLoading(true);
    try {
      await api.post('/classes', { name });
      toast.success(`${name} added`);
      setNewClassName('');
      fetchClasses();
    } catch {
      toast.error('Class already exists or could not be added');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id: number, name: string): Promise<void> => {
    if (!window.confirm(`Delete ${name}? All its sections will also be removed.`)) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted');
      fetchClasses();
    } catch {
      toast.error('Could not delete class');
    }
  };

  const handleAddSection = async (classId: number): Promise<void> => {
    const name = (newSectionName[classId] ?? '').trim();
    if (!name) { toast.error('Section name cannot be empty'); return; }
    try {
      await api.post(`/classes/${classId}/sections`, { name });
      toast.success(`Section ${name} added`);
      setNewSectionName(prev => ({ ...prev, [classId]: '' }));
      setAddingSectionFor(null);
      fetchClasses();
    } catch {
      toast.error('Section already exists or could not be added');
    }
  };

  const handleDeleteSection = async (classId: number, sectionId: number, name: string): Promise<void> => {
    if (!window.confirm(`Delete Section ${name}?`)) return;
    try {
      await api.delete(`/classes/${classId}/sections/${sectionId}`);
      toast.success('Section deleted');
      fetchClasses();
    } catch {
      toast.error('Could not delete section');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-header">Classes & Sections</h1>
        <p className="text-slate-500 text-sm mt-1">Manage the class and section structure of your school</p>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Add New Class</h2>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="e.g., Class 10"
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddClass()}
          />
          <button onClick={handleAddClass} disabled={loading} className="btn-primary shrink-0">
            <Plus size={14} /> Add Class
          </button>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <School size={20} className="text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">No classes added yet. Add your first class above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => {
            const isExpanded = expandedIds.has(cls.id);
            return (
              <div key={cls.id} className="card overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-50 transition-colors"
                  onClick={() => toggleExpand(cls.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
                      {isExpanded
                        ? <ChevronDown size={14} className="text-brand-600" />
                        : <ChevronRight size={14} className="text-brand-600" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{cls.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cls.sections.length} {cls.sections.length === 1 ? 'section' : 'sections'}
                        {cls.student_count > 0 && ` · ${cls.student_count} students`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }}
                    className="btn-danger py-1.5 px-2.5 text-xs opacity-0 group-hover:opacity-100 hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-surface-100 bg-surface-50 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sections</p>
                      <button
                        onClick={() => setAddingSectionFor(addingSectionFor === cls.id ? null : cls.id)}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        <Plus size={12} /> Add Section
                      </button>
                    </div>

                    {addingSectionFor === cls.id && (
                      <div className="flex gap-2 mb-3">
                        <input
                          className="input flex-1 text-sm py-1.5"
                          placeholder="e.g., Section A"
                          value={newSectionName[cls.id] ?? ''}
                          onChange={e => setNewSectionName(prev => ({ ...prev, [cls.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddSection(cls.id)}
                          autoFocus
                        />
                        <button onClick={() => handleAddSection(cls.id)} className="btn-primary text-xs py-1.5">
                          Add
                        </button>
                        <button onClick={() => setAddingSectionFor(null)} className="btn-secondary text-xs py-1.5">
                          Cancel
                        </button>
                      </div>
                    )}

                    {cls.sections.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">No sections yet. Add one above.</p>
                    ) : (
                      <div className="space-y-2">
                        {cls.sections.map(sec => (
                          <div
                            key={sec.id}
                            className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-surface-200"
                          >
                            <span className="text-sm font-medium text-slate-700">{sec.name}</span>
                            <button
                              onClick={() => handleDeleteSection(cls.id, sec.id, sec.name)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}