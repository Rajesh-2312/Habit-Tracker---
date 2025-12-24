
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Habit, HabitLog } from '../types';

interface ChartsViewProps {
  habits: Habit[];
  logs: HabitLog[];
  variant?: 'compact' | 'full';
}

const ChartsView: React.FC<ChartsViewProps> = ({ habits, logs, variant = 'full' }) => {
  const completionByHabit = useMemo(() => {
    return habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id && l.completed);
      return {
        name: h.name,
        count: habitLogs.length,
        color: h.color
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5 for compact
  }, [habits, logs]);

  const activityByDay = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = logs.filter(l => l.date === dateStr && l.completed).length;
      return { date: dateStr, count };
    }).reverse();
    return days;
  }, [logs]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    habits.forEach(h => {
      counts[h.category] = (counts[h.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [habits]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  const isCompact = variant === 'compact';

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-right-4 duration-500`}>
      {/* Activity Heatmap Area - Key visualization for streaks */}
      <div className="bg-[#191919] p-5 rounded-2xl border border-[#2b2b2b]">
        <h3 className="text-xs font-bold mb-4 text-[#8e8e8e] uppercase tracking-wider">Consistency (14 Days)</h3>
        <div className={`${isCompact ? 'h-[180px]' : 'h-[300px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityByDay}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#444" 
                fontSize={10} 
                tickFormatter={(val) => val.split('-').slice(2).join('')} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide={isCompact} stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2b2b2b', borderRadius: '8px', fontSize: '10px' }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress per Habit */}
      <div className="bg-[#191919] p-5 rounded-2xl border border-[#2b2b2b]">
        <h3 className="text-xs font-bold mb-4 text-[#8e8e8e] uppercase tracking-wider">Completions</h3>
        <div className={`${isCompact ? 'h-[180px]' : 'h-[300px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionByHabit} layout={isCompact ? 'vertical' : 'horizontal'}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" horizontal={!isCompact} vertical={isCompact} />
              {isCompact ? (
                <>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#8e8e8e" fontSize={10} width={60} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" stroke="#8e8e8e" fontSize={12} tickLine={false} />
                  <YAxis stroke="#8e8e8e" fontSize={12} tickLine={false} axisLine={false} />
                </>
              )}
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2b2b2b', borderRadius: '8px' }}
                cursor={{ fill: '#2a2a2a' }}
              />
              <Bar dataKey="count" radius={isCompact ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
                {completionByHabit.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Balance */}
      <div className="bg-[#191919] p-5 rounded-2xl border border-[#2b2b2b]">
        <h3 className="text-xs font-bold mb-4 text-[#8e8e8e] uppercase tracking-wider">Category Mix</h3>
        <div className="flex items-center gap-4">
           <div className="h-[140px] w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-2 overflow-hidden">
             {categoryDistribution.map((cat, idx) => (
               <div key={cat.name} className="flex items-center gap-2 truncate">
                 <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                 <span className="text-[10px] text-[#8e8e8e] font-medium truncate uppercase tracking-tighter">{cat.name}: {cat.value}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsView;
