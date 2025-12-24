
import React, { useState } from 'react';
import { Habit, HabitLog } from '../types';
import { Check, Trash2, Calendar, Target, Flame, Edit2, TrendingUp, TrendingDown, Minus, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  onToggle: (habitId: string, date: string) => void;
  onDelete: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onUpdateNote: (habitId: string, date: string, note: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, logs, onToggle, onDelete, onEdit, onUpdateNote }) => {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const habitColor = habit.color || '#6366f1';

  // Calculate current streak
  const calculateStreak = () => {
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const isDone = (dateStr: string) => 
      logs.some(l => l.habitId === habit.id && l.date === dateStr && l.completed);

    const todayCompleted = isDone(today);
    const yesterdayCompleted = isDone(yesterday);

    if (!todayCompleted && !yesterdayCompleted) return 0;

    let streak = 0;
    const checkDate = new Date(todayCompleted ? today : yesterday);
    
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (isDone(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Calculate Trend (Comparing last 7 days vs previous 7 days)
  const getTrend = () => {
    const getCount = (offset: number, days: number) => {
      let count = 0;
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (offset + i));
        const dStr = d.toISOString().split('T')[0];
        if (logs.some(l => l.habitId === habit.id && l.date === dStr && l.completed)) {
          count++;
        }
      }
      return count;
    };

    const current = getCount(0, 7);
    const previous = getCount(7, 7);

    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const streakCount = calculateStreak();
  const trend = getTrend();

  // Generate days based on duration starting from startDate
  const generateDays = () => {
    const daysCount = habit.duration === 'week' ? 7 : 30;
    const days = [];
    const start = new Date(habit.startDate);
    
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const trackingDays = generateDays();

  const getLogForDate = (date: string) => 
    logs.find(l => l.habitId === habit.id && l.date === date);

  const completionCount = trackingDays.filter(date => getLogForDate(date)?.completed).length;
  const progressPercent = Math.round((completionCount / trackingDays.length) * 100);

  const pastReflections = logs
    .filter(l => l.habitId === habit.id && l.note && l.note.trim() !== '')
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div 
      className={`bg-[#191919] border border-[#2b2b2b] rounded-3xl p-6 flex flex-col items-center hover:border-opacity-50 transition-all group relative overflow-hidden ${isNotesOpen ? 'ring-1' : ''}`}
      style={{ 
        borderColor: isNotesOpen ? habitColor : undefined,
        boxShadow: isNotesOpen ? `0 0 20px ${habitColor}20` : undefined
      }}
    >
      {/* Background Decor */}
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity" 
        style={{ backgroundColor: habitColor }}
      />
      
      {/* Header Info */}
      <div className="w-full flex justify-between items-start mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8e8e8e] bg-[#252525] px-2 py-1 rounded-lg border border-[#333]">
          {habit.category}
        </span>
        <div className="flex gap-1 z-10">
          <button 
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className={`p-2 rounded-xl transition-all ${isNotesOpen ? 'text-white' : 'text-[#8e8e8e] hover:bg-opacity-10'}`}
            style={{ 
              backgroundColor: isNotesOpen ? habitColor : undefined,
              color: !isNotesOpen ? undefined : 'white'
            }}
            title="Reflections & Notes"
          >
            <BookOpen size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(habit);
            }}
            className="text-[#8e8e8e] hover:text-white p-2 rounded-xl transition-all"
            title="Edit Habit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(habit.id);
            }}
            className="text-[#8e8e8e] hover:text-red-400 p-2 rounded-xl hover:bg-red-400/10 transition-all"
            title="Delete Habit"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Emoji and Title */}
      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
        {habit.emoji || '✨'}
      </div>
      
      <div className="flex flex-col items-center gap-2 mb-1">
        <h3 className="text-xl font-bold text-white text-center group-hover:text-opacity-80 transition-colors">
          {habit.name}
        </h3>
        
        <div className="flex items-center gap-1.5">
          {streakCount > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full border border-orange-500/20 animate-in fade-in zoom-in duration-300 shadow-sm shadow-orange-500/5">
              <Flame size={12} fill="currentColor" />
              <span className="text-[10px] font-black">{streakCount}</span>
            </div>
          )}
          
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all shadow-sm
            ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              trend === 'down' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
              'bg-[#252525] text-[#8e8e8e] border-[#333]'}`}
          >
            {trend === 'up' && <TrendingUp size={10} />}
            {trend === 'down' && <TrendingDown size={10} />}
            {trend === 'stable' && <Minus size={10} />}
            <span className="uppercase tracking-tighter">{trend}</span>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-[#8e8e8e] text-center mb-6 line-clamp-2 min-h-[2rem]">
        {habit.description || 'No description provided.'}
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-[#121212] rounded-full h-1.5 mb-6 overflow-hidden border border-[#2b2b2b]">
        <div 
          className="h-full rounded-full transition-all duration-1000" 
          style={{ 
            width: `${progressPercent}%`,
            backgroundColor: habitColor,
            boxShadow: `0 0 8px ${habitColor}50`
          }}
        />
      </div>

      {!isNotesOpen ? (
        <div className={`grid ${habit.duration === 'week' ? 'grid-cols-7' : 'grid-cols-6'} gap-2 w-full mb-6`}>
          {trackingDays.map((date, idx) => {
            const completed = getLogForDate(date)?.completed;
            const isToday = date === today;
            const isPast = date < today;

            return (
              <button
                key={date}
                onClick={() => onToggle(habit.id, date)}
                title={date}
                className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all relative
                  ${completed 
                    ? 'text-white shadow-lg' 
                    : isToday 
                      ? 'bg-[#2b2b2b] border text-opacity-80'
                      : isPast
                        ? 'bg-[#191919] border border-[#2b2b2b] text-[#444]'
                        : 'bg-[#121212] text-[#333]'
                  }
                  hover:scale-110 active:scale-95
                `}
                style={{ 
                  backgroundColor: completed ? habitColor : undefined,
                  borderColor: isToday && !completed ? habitColor : undefined,
                  color: isToday && !completed ? habitColor : undefined,
                  boxShadow: completed ? `0 4px 12px ${habitColor}40` : undefined
                }}
              >
                {completed ? <Check size={12} strokeWidth={3} /> : (idx + 1)}
                {isToday && !completed && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: habitColor }} />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4 mb-6 animate-in slide-in-from-top-4 duration-300 overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#8e8e8e] uppercase tracking-widest border-b border-[#2b2b2b] pb-2">
            <span>Journal Entry: Today</span>
            <span style={{ color: habitColor }}>{today}</span>
          </div>
          
          <textarea 
            placeholder="How did it go? Any thoughts or feelings today?"
            value={getLogForDate(today)?.note || ''}
            onChange={(e) => onUpdateNote(habit.id, today, e.target.value)}
            className="w-full bg-[#121212] border border-[#2b2b2b] rounded-xl p-3 text-xs text-[#e1e1e1] focus:outline-none focus:ring-1 min-h-[80px] transition-all"
            style={{ 
              borderColor: getLogForDate(today)?.note ? habitColor : undefined,
              boxShadow: getLogForDate(today)?.note ? `0 0 5px ${habitColor}20` : undefined
            }}
          />

          {pastReflections.length > 0 && (
            <div className="mt-2">
              <h4 className="text-[10px] font-bold text-[#8e8e8e] uppercase tracking-widest mb-3 flex items-center gap-2">
                <HistoryIcon size={10} /> History
              </h4>
              <div className="space-y-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                {pastReflections.map(reflection => (
                  <div key={reflection.date} className="bg-[#252525] border border-[#333] rounded-lg p-3 group/item">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold uppercase" style={{ color: habitColor }}>{reflection.date}</span>
                      {reflection.completed && <Check size={8} className="text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-[#8e8e8e] leading-relaxed italic line-clamp-3">"{reflection.note}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="w-full flex justify-between items-center text-[10px] text-[#8e8e8e] font-bold uppercase tracking-tighter mt-auto pt-4 border-t border-[#2b2b2b]">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>Starts {habit.startDate}</span>
        </div>
        <div className="flex items-center gap-1">
          <Target size={12} />
          <span>{habit.duration}ly</span>
        </div>
      </div>
    </div>
  );
};

// Internal icon component for cleaner code
const HistoryIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default HabitCard;
