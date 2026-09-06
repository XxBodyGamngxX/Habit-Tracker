import React, { useState } from 'react';
import { useTasks } from '@/context/TasksContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Link } from 'react-router-dom';
import { Plus, Check, Trash2, Calendar, ExternalLink } from 'lucide-react';
import type { TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

export const Todo: React.FC = () => {
  const { tasks, addTask, deleteTask, toggleTask, filter, setFilter } = useTasks();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });

  const categories = ['Personal', 'Work', 'Study', 'Fitness', 'Finance'];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title.trim(), category, dueDate, priority);
    setTitle('');
    setModalOpen(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const priorityColors: Record<TaskPriority, string> = {
    low: 'text-text-secondary bg-background border-border',
    medium: 'text-warning bg-warning/10 border-warning/30',
    high: 'text-danger bg-danger/10 border-danger/30',
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-primary">
            To-Do List
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Prioritize your creases and earn +30 XP for each completed task.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/standalone/todo"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-surface hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
            title="Open Standalone Window"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>

          <Button onClick={() => setModalOpen(true)} className="h-10 px-4 font-bold gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>New Task Crease</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="h-10">
            <TabsTrigger value="pending" className="px-4 text-xs font-bold">
              Pending ({tasks.filter((t) => !t.completed).length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-4 text-xs font-bold">
              Completed ({tasks.filter((t) => t.completed).length})
            </TabsTrigger>
            <TabsTrigger value="all" className="px-4 text-xs font-bold">
              All ({tasks.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                'flex items-center justify-between p-4 transition-all duration-200 border-2',
                task.completed
                  ? 'border-border/60 bg-surface/60 opacity-70'
                  : 'border-border bg-surface hover:border-primary/40'
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0',
                    task.completed
                      ? 'bg-success border-success text-white'
                      : 'border-border hover:border-primary bg-background'
                  )}
                  title={task.completed ? 'Mark pending' : 'Mark completed (+30 XP)'}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="flex flex-col min-w-0">
                  <span
                    className={cn(
                      'text-sm font-bold truncate transition-all',
                      task.completed ? 'line-through text-text-tertiary' : 'text-text-primary'
                    )}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-background border border-border text-text-secondary">
                      {task.category}
                    </span>
                    {task.priority && (
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border',
                          priorityColors[task.priority]
                        )}
                      >
                        {task.priority}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
                        <Calendar className="w-3 h-3" />
                        <span>{task.dueDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
                className="w-8 h-8 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger-bg shrink-0 ml-2"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-display text-lg font-bold text-text-primary">
            No tasks found in this view
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1 mb-5">
            {filter === 'completed'
              ? 'Complete tasks to see them archived here.'
              : 'Add a new task crease to organize your morning.'}
          </p>
          <Button onClick={() => setModalOpen(true)} className="font-bold text-xs">
            Create Task Crease
          </Button>
        </Card>
      )}

      {/* Task Creation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">
              Create New Task Crease
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Fold an actionable to-do item into your day.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Task Title</label>
              <Input
                required
                placeholder="e.g., Review project proposal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Due Date</label>
              <Input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              Fold Task Crease (+30 XP potential)
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
