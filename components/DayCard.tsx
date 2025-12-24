
import React from 'react';
import { Habit, HabitLog } from '../types';
import { Check, Square } from 'lucide-react';

interface DayCardProps {
  date: string;
  habits: Habit[];
  logs: HabitLog[];
  onToggle: (habitId: string, date: string) => void;
}

const DayCard: React.FC<DayCardProps> = ({ date, habits, logs, onToggle }) => {
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) return '@Today';
    if (checkDate.getTime() === yesterday.getTime()) return '@Yesterday';

    const diffDays = Math.round((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1 && diffDays < 7) {
      return `@Last ${d.toLocaleDateString('en-US', { weekday: 'long' })}`;
    }

    return `@${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  };

  const isCompleted = (habitId: string) => {
    return logs.some(l => l.habitId === habitId && l.date === date && l.completed);
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-4 min-h-[220px] flex flex-col hover:bg-[#252525] transition-colors group">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[#8e8e8e] font-medium text-sm">
          {formatDateLabel(date)}
        </span>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <button className="p-1 hover:bg-[#333] rounded text-[#8e8e8e]">
            <span className="text-xs">Edit</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        {habits.map(habit => {
          const done = isCompleted(habit.id);
          return (
            <div 
              key={habit.id}
              onClick={() => onToggle(habit.id, date)}
              className={`flex items-center gap-3 p-1.5 rounded-md cursor-pointer transition-colors ${done ? 'bg-[#2a2a2a]/40' : 'hover:bg-[#2a2a2a]'}`}
            >
              <div className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${done ? 'bg-indigo-600 border-indigo-600' : 'border-[#444] bg-transparent'}`}>
                {done && <Check size={14} className="text-white" strokeWidth={4} />}
              </div>
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-lg leading-none shrink-0">{habit.emoji}</span>
                <span className={`text-sm font-medium truncate ${done ? 'text-[#8e8e8e] line-through' : 'text-[#e1e1e1]'}`}>
                  {habit.name}
                </span>
              </div>
            </div>
          );
        })}
        {habits.length === 0 && (
          <div className="text-[#444] text-xs italic mt-4 text-center">No habits tracked</div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#2b2b2b] flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-[#333]" />
         <div className="h-1 flex-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500" 
              style={{ width: `${habits.length > 0 ? (habits.filter(h => isCompleted(h.id)).length / habits.length) * 100 : 0}%` }}
            />
         </div>
      </div>
    </div>
  );
};

export default DayCard;
