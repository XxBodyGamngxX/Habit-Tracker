import React, { useState } from 'react';
import { useTasks } from '@/context/TasksContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Plus, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StandaloneTodo: React.FC = () => {
  const { tasks, addTask, deleteTask, toggleTask, filter, setFilter } = useTasks();
  const [newTitle, setNewTitle] = useState('');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const today = new Date().toISOString().substring(0, 10);
    addTask(newTitle.trim(), 'Personal', today, 'medium');
    setNewTitle('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="max-w-xl w-full space-y-6 animate-in fade-in-50 duration-300">
      <div className="text-center space-y-1">
        <h1 className="font-display text-3xl font-black text-primary">
          Focus Task Board
        </h1>
        <p className="text-xs text-text-secondary">
          Minimalist to-do interface for secondary monitors and quick checklists.
        </p>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          placeholder="What are you folding next?..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="h-11 text-sm bg-surface shadow-xs"
        />
        <Button type="submit" className="h-11 px-5 font-bold shrink-0">
          <Plus className="w-4 h-4 mr-1" />
          <span>Add</span>
        </Button>
      </form>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 p-1 rounded-xl bg-surface border border-border">
          {(['pending', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all',
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-text-secondary">
          {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Task Items */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((t) => (
            <Card
              key={t.id}
              className={cn(
                'flex items-center justify-between p-3.5 border transition-all',
                t.completed ? 'opacity-60 bg-surface/50' : 'bg-surface hover:border-primary/40'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleTask(t.id)}
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                    t.completed
                      ? 'bg-success border-success text-white'
                      : 'border-border hover:border-primary bg-background'
                  )}
                >
                  {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <span
                  className={cn(
                    'text-xs font-bold truncate',
                    t.completed ? 'line-through text-text-tertiary' : 'text-text-primary'
                  )}
                >
                  {t.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => deleteTask(t.id)}
                className="text-text-tertiary hover:text-danger p-1 shrink-0 ml-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center border-dashed text-text-secondary text-xs">
            No tasks in this view.
          </Card>
        )}
      </div>
    </div>
  );
};
