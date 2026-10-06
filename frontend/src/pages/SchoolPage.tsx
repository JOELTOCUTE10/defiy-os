import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { schoolApi } from '../api/endpoints';
import { api } from '../api/client';
import type { SchoolClass, Assignment, StudySession, SchoolSummary } from '../api/types';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/ui/PageHeader';
import { StatTile } from '../components/ui/StatTile';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionNav } from '../components/ui/SectionNav';

export const SchoolPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assignments' | 'sessions' | 'classes'>('assignments');

  const [summary, setSummary] = useState<SchoolSummary | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);

  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isStudyPlanOpen, setIsStudyPlanOpen] = useState(false);

  // Forms
  const [classForm, setClassForm] = useState({
    name: '',
    teacher: '',
    schedule: '',
    color: '#6366f1',
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    type: 'homework' as 'homework' | 'project' | 'test' | 'quiz',
    class_id: '',
    due_date: '',
    notes: '',
  });

  const [sessionForm, setSessionForm] = useState({
    topic: '',
    class_id: '',
    assignment_id: '',
    date: new Date().toISOString().split('T')[0],
    minutes: 30,
    notes: '',
  });

  const [studyPlanForm, setStudyPlanForm] = useState({
    title: '',
    due_date: '',
    minutes_per_day: 30,
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, classesRes, assignRes, sessionsRes] = await Promise.all([
        schoolApi.getSummary().catch(() => null),
        schoolApi.listClasses().catch(() => []),
        schoolApi.listAssignments().catch(() => []),
        schoolApi.listStudySessions().catch(() => []),
      ]);

      if (sumRes) setSummary(sumRes);
      setClasses(classesRes || []);
      setAssignments(assignRes || []);

      const parsedSessions = Array.isArray(sessionsRes)
        ? sessionsRes
        : (sessionsRes as { sessions?: StudySession[] })?.sessions || [];
      setStudySessions(parsedSessions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load school data';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    setActionLoading(true);
    try {
      await schoolApi.createClass({
        name: classForm.name,
        teacher: classForm.teacher || undefined,
        schedule: classForm.schedule || undefined,
        color: classForm.color,
      });
      showToast('Class created successfully!', 'success');
      setIsAddClassOpen(false);
      setClassForm({ name: '', teacher: '', schedule: '', color: '#6366f1' });
      fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create class';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) return;
    setActionLoading(true);
    try {
      await schoolApi.createAssignment({
        title: assignmentForm.title,
        type: assignmentForm.type,
        class_id: assignmentForm.class_id || undefined,
        due_date: assignmentForm.due_date || undefined,
        notes: assignmentForm.notes || undefined,
      });
      showToast('Assignment added successfully!', 'success');
      setIsAddAssignmentOpen(false);
      setAssignmentForm({ title: '', type: 'homework', class_id: '', due_date: '', notes: '' });
      fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add assignment';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAssignment = async (assignment: Assignment) => {
    const newStatus = assignment.status === 'completed' ? 'pending' : 'completed';
    try {
      await schoolApi.updateAssignment(assignment.id, { status: newStatus });
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignment.id ? { ...a, status: newStatus } : a))
      );
      showToast(
        newStatus === 'completed' ? 'Assignment completed!' : 'Assignment marked pending',
        'success'
      );
      const sumRes = await schoolApi.getSummary().catch(() => null);
      if (sumRes) setSummary(sumRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update assignment';
      showToast(msg, 'error');
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.topic.trim()) return;
    setActionLoading(true);
    try {
      await schoolApi.createStudySession({
        topic: sessionForm.topic,
        class_id: sessionForm.class_id || undefined,
        assignment_id: sessionForm.assignment_id || undefined,
        date: sessionForm.date,
        minutes: Number(sessionForm.minutes) || 30,
        notes: sessionForm.notes || undefined,
        completed: false,
      });
      showToast('Study session logged!', 'success');
      setIsAddSessionOpen(false);
      setSessionForm({
        topic: '',
        class_id: '',
        assignment_id: '',
        date: new Date().toISOString().split('T')[0],
        minutes: 30,
        notes: '',
      });
      fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log study session';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSession = async (session: StudySession) => {
    const updatedCompleted = !session.completed;
    try {
      await api.patch(`/school/sessions/${session.id}`, { completed: updatedCompleted });
      setStudySessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, completed: updatedCompleted } : s))
      );
      showToast(
        updatedCompleted ? 'Study session completed!' : 'Study session marked incomplete',
        'success'
      );
      const sumRes = await schoolApi.getSummary().catch(() => null);
      if (sumRes) setSummary(sumRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update session';
      showToast(msg, 'error');
    }
  };

  const handleGenerateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyPlanForm.title.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post<{
        sessions: StudySession[];
        note?: string;
        generated_by?: string;
      }>('/school/study-plan', {
        title: studyPlanForm.title,
        due_date: studyPlanForm.due_date || undefined,
        minutes_per_day: Number(studyPlanForm.minutes_per_day) || 30,
      });

      showToast(
        res.generated_by === 'gemini'
          ? 'AI study plan generated and added!'
          : 'Study plan created!',
        'success'
      );
      setIsStudyPlanOpen(false);
      setStudyPlanForm({ title: '', due_date: '', minutes_per_day: 30 });
      fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate study plan';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeChipVariant = (type: Assignment['type']) => {
    switch (type) {
      case 'test':
        return 'danger';
      case 'project':
        return 'primary';
      case 'quiz':
        return 'warning';
      case 'homework':
      default:
        return 'secondary';
    }
  };

  const summaryData = summary as unknown as {
    pending_assignments?: number | Assignment[];
    week_minutes?: number;
    study_minutes_this_week?: number;
    classes_count?: number;
    total_classes?: number;
  } | null;

  const pendingCount =
    typeof summaryData?.pending_assignments === 'number'
      ? summaryData.pending_assignments
      : Array.isArray(summaryData?.pending_assignments)
      ? summaryData.pending_assignments.length
      : assignments.filter((a) => a.status === 'pending').length;

  const weekMinutes =
    summaryData?.week_minutes ?? summaryData?.study_minutes_this_week ?? 0;

  const classesCount =
    summaryData?.classes_count ?? summaryData?.total_classes ?? classes.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="School & Academics"
        subtitle="Manage your courses, assignments, study sessions, and AI study plans."
        action={
          <Button
            variant="primary"
            onClick={() => setIsStudyPlanOpen(true)}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Study Plan</span>
          </Button>
        }
      />

      {/* School Summary Header */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            title="Study Time This Week"
            value={`${weekMinutes} mins`}
            subtitle="Logged focus time"
            icon={Clock}
            iconColor="text-brand-500 bg-brand-50 dark:bg-brand-500/10"
          />
          <StatTile
            title="Pending Assignments"
            value={pendingCount}
            subtitle="Tasks remaining"
            icon={FileText}
            iconColor="text-amber-500 bg-amber-50 dark:bg-amber-500/10"
          />
          <StatTile
            title="Enrolled Classes"
            value={classesCount}
            subtitle="Active courses"
            icon={GraduationCap}
            iconColor="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
          />
        </div>
      )}

      {/* Section Navigation */}
      <SectionNav
        items={[
          { id: 'assignments', label: 'Assignments', icon: FileText, badge: pendingCount },
          { id: 'sessions', label: 'Study Sessions', icon: Clock, badge: studySessions.length },
          { id: 'classes', label: 'Classes', icon: BookOpen, badge: classesCount },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'assignments' | 'sessions' | 'classes')}
      />

      {/* TAB 1: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Assignments & Tasks
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddAssignmentOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Assignment</span>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No assignments yet"
              description="Keep track of your homework, quizzes, tests, and projects."
              actionLabel="Add Assignment"
              onAction={() => setIsAddAssignmentOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => {
                const isCompleted = assignment.status === 'completed';
                const cls = classes.find((c) => String(c.id) === String(assignment.class_id));

                return (
                  <Card
                    key={assignment.id}
                    className={`p-4 flex items-center justify-between gap-4 ${
                      isCompleted ? 'opacity-70 bg-slate-50/50 dark:bg-darkcard/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggleAssignment(assignment)}
                        className="text-slate-400 hover:text-brand-500 transition-colors shrink-0 focus:outline-none"
                        title={isCompleted ? 'Mark pending' : 'Mark complete'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-semibold text-sm text-slate-900 dark:text-slate-100 truncate ${
                              isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : ''
                            }`}
                          >
                            {assignment.title}
                          </h4>
                          <Chip variant={getTypeChipVariant(assignment.type)} size="sm">
                            {assignment.type}
                          </Chip>
                          {cls && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-md font-medium"
                              style={{
                                backgroundColor: `${cls.color || '#6366f1'}20`,
                                color: cls.color || '#6366f1',
                              }}
                            >
                              {cls.name}
                            </span>
                          )}
                        </div>

                        {assignment.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {assignment.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {assignment.due_date && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-brand-500" />
                        <span>Due {new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDY SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              This Week's Study Sessions
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddSessionOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Log Session</span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : studySessions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No study sessions this week"
              description="Log your study time or use the AI Study Plan button to auto-schedule sessions."
              actionLabel="Log Session"
              onAction={() => setIsAddSessionOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {studySessions.map((session) => (
                <Card
                  key={session.id}
                  className={`p-4 flex items-center justify-between gap-4 ${
                    session.completed ? 'opacity-70 bg-slate-50/50 dark:bg-darkcard/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleSession(session)}
                      className="text-slate-400 hover:text-brand-500 transition-colors shrink-0 focus:outline-none"
                    >
                      {session.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <h4
                        className={`font-semibold text-sm text-slate-900 dark:text-slate-100 truncate ${
                          session.completed ? 'line-through text-slate-500 dark:text-slate-400' : ''
                        }`}
                      >
                        {session.topic}
                      </h4>
                      {session.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Chip variant="primary" size="sm" icon={Clock}>
                      {session.minutes} mins
                    </Chip>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Classes & Courses
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddClassOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          ) : classes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No classes added yet"
              description="Add your courses to organize assignments and track study sessions."
              actionLabel="Add Class"
              onAction={() => setIsAddClassOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <Card key={cls.id} className="p-5 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 bottom-0 w-1.5"
                    style={{ backgroundColor: cls.color || '#6366f1' }}
                  />
                  <div className="pl-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {cls.name}
                      </h4>
                      <BookOpen className="w-5 h-5 text-slate-400" />
                    </div>

                    {cls.teacher && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span className="font-semibold">Instructor:</span> {cls.teacher}
                      </p>
                    )}

                    {cls.schedule && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.schedule}</span>
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD CLASS */}
      <Modal isOpen={isAddClassOpen} onClose={() => setIsAddClassOpen(false)} title="Add New Class">
        <form onSubmit={handleAddClass} className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g. CS 101: Computer Science"
            value={classForm.name}
            onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
            required
          />
          <Input
            label="Teacher / Instructor"
            placeholder="e.g. Dr. Smith"
            value={classForm.teacher}
            onChange={(e) => setClassForm({ ...classForm, teacher: e.target.value })}
          />
          <Input
            label="Schedule"
            placeholder="e.g. MWF 10:00 AM - 11:15 AM"
            value={classForm.schedule}
            onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={classForm.color}
                onChange={(e) => setClassForm({ ...classForm, color: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-darkborder p-1 bg-transparent"
              />
              <span className="text-xs text-slate-500 font-mono">{classForm.color}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddClassOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Create Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD ASSIGNMENT */}
      <Modal
        isOpen={isAddAssignmentOpen}
        onClose={() => setIsAddAssignmentOpen(false)}
        title="Add Assignment"
      >
        <form onSubmit={handleAddAssignment} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Chapter 4 Problem Set"
            value={assignmentForm.title}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Type"
              value={assignmentForm.type}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  type: e.target.value as 'homework' | 'project' | 'test' | 'quiz',
                })
              }
              options={[
                { value: 'homework', label: 'Homework' },
                { value: 'project', label: 'Project' },
                { value: 'quiz', label: 'Quiz' },
                { value: 'test', label: 'Test / Exam' },
              ]}
            />
            <Select
              label="Class"
              value={assignmentForm.class_id}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, class_id: e.target.value })}
              options={[
                { value: '', label: 'None / General' },
                ...classes.map((c) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </div>
          <Input
            label="Due Date"
            type="date"
            value={assignmentForm.due_date}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
          />
          <Textarea
            label="Notes"
            placeholder="Additional instructions or notes..."
            value={assignmentForm.notes}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddAssignmentOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD STUDY SESSION */}
      <Modal
        isOpen={isAddSessionOpen}
        onClose={() => setIsAddSessionOpen(false)}
        title="Log Study Session"
      >
        <form onSubmit={handleAddSession} className="space-y-4">
          <Input
            label="Topic / Focus"
            placeholder="e.g. Organic Chemistry reactions review"
            value={sessionForm.topic}
            onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={sessionForm.date}
              onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              min={5}
              step={5}
              value={sessionForm.minutes}
              onChange={(e) => setSessionForm({ ...sessionForm, minutes: Number(e.target.value) })}
            />
          </div>
          <Select
            label="Associated Class"
            value={sessionForm.class_id}
            onChange={(e) => setSessionForm({ ...sessionForm, class_id: e.target.value })}
            options={[
              { value: '', label: 'None' },
              ...classes.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
          <Textarea
            label="Notes"
            placeholder="What did you accomplish?"
            value={sessionForm.notes}
            onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddSessionOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Log Session
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GENERATE STUDY PLAN */}
      <Modal
        isOpen={isStudyPlanOpen}
        onClose={() => setIsStudyPlanOpen(false)}
        title="Generate AI Study Plan"
      >
        <form onSubmit={handleGenerateStudyPlan} className="space-y-4">
          <Input
            label="Topic or Exam Title"
            placeholder="e.g. Midterm Exam Prep"
            value={studyPlanForm.title}
            onChange={(e) => setStudyPlanForm({ ...studyPlanForm, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Due / Exam Date"
              type="date"
              value={studyPlanForm.due_date}
              onChange={(e) => setStudyPlanForm({ ...studyPlanForm, due_date: e.target.value })}
            />
            <Input
              label="Target Minutes / Day"
              type="number"
              min={10}
              step={5}
              value={studyPlanForm.minutes_per_day}
              onChange={(e) =>
                setStudyPlanForm({ ...studyPlanForm, minutes_per_day: Number(e.target.value) })
              }
            />
          </div>
          <Card className="p-3 bg-brand-50/50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <span>
              The AI will break down your study topic into structured study sessions distributed across the days leading up to your due date.
            </span>
          </Card>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStudyPlanOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Generate Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
