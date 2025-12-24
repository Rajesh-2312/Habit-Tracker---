
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutGrid, BarChart3, Sparkles, BrainCircuit, X, MessageSquareQuote, Calendar, List, Filter, ArrowUpDown, Check, Lightbulb, Wand2, TrendingUp, Edit2 } from 'lucide-react';
import { Habit, HabitLog, Category, HabitInsight, Duration } from './types';
import DayCard from './components/DayCard';
import HabitCard from './components/HabitCard';
import ChartsView from './components/ChartsView';
import { getHabitInsights, suggestNewHabits } from './services/geminiService';

const CATEGORIES: Category[] = ['Health', 'Productivity', 'Mindfulness', 'Social', 'Finance', 'Other'];
const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316'  // Orange
];

interface SuggestedHabit {
  name: string;
  description: string;
  category: Category;
  frequency: 'daily' | 'weekly';
  emoji: string;
}

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('zenhabits_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<HabitLog[]>(() => {
    const saved = localStorage.getItem('zenhabits_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'daily' | 'manage' | 'ai'>('daily');
  const [viewRange, setViewRange] = useState<'week' | 'month'>('week');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [insight, setInsight] = useState<HabitInsight | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Suggestion State
  const [userGoal, setUserGoal] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestedHabit[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Form State
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'Health' as Category,
    duration: 'week' as Duration,
    emoji: '✨',
    color: '#6366f1',
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    localStorage.setItem('zenhabits_list', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('zenhabits_logs', JSON.stringify(logs));
  }, [logs]);

  const handleToggleHabit = (habitId: string, date: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        return prev.map(l => (l.id === existing.id ? { ...l, completed: !l.completed } : l));
      }
      return [...prev, { id: crypto.randomUUID(), habitId, date, completed: true }];
    });
  };

  const handleUpdateNote = (habitId: string, date: string, note: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        return prev.map(l => (l.id === existing.id ? { ...l, note } : l));
      }
      return [...prev, { id: crypto.randomUUID(), habitId, date, completed: false, note }];
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
    setNewHabit({ 
      name: '', 
      description: '', 
      category: 'Health', 
      duration: 'week', 
      emoji: '✨',
      color: '#6366f1',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabit({
      name: habit.name,
      description: habit.description,
      category: habit.category,
      duration: habit.duration,
      emoji: habit.emoji,
      color: habit.color,
      startDate: habit.startDate
    });
    setIsModalOpen(true);
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name) return;
    
    if (editingHabit) {
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? { 
        ...h, 
        ...newHabit 
      } : h));
    } else {
      const habit: Habit = {
        ...newHabit,
        id: crypto.randomUUID(),
        frequency: 'daily',
        createdAt: Date.now()
      };
      setHabits([...habits, habit]);
    }
    
    closeModal();
  };

  const handleAdoptSuggestion = (s: SuggestedHabit) => {
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: s.name,
      description: s.description,
      category: s.category,
      frequency: s.frequency,
      duration: 'week',
      emoji: s.emoji,
      startDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
    };
    setHabits([...habits, habit]);
    setSuggestions(suggestions.filter(item => item.name !== s.name));
  };

  const handleDeleteHabit = (id: string) => {
    if (window.confirm('Delete this habit definition and all its logs?')) {
      setHabits(prev => prev.filter(h => h.id !== id));
      setLogs(prev => prev.filter(l => l.habitId !== id));
    }
  };

  const fetchInsights = async () => {
    if (habits.length === 0) return;
    setIsAiLoading(true);
    const data = await getHabitInsights(habits, logs);
    if (data) setInsight(data);
    setIsAiLoading(false);
  };

  const handleGetSuggestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGoal.trim()) return;
    setIsSuggesting(true);
    const results = await suggestNewHabits(userGoal);
    setSuggestions(results);
    setIsSuggesting(false);
  };

  // Generate date range for display
  const displayDays = useMemo(() => {
    const days = [];
    const count = viewRange === 'week' ? 12 : 30;
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [viewRange]);

  return (
    <div className="min-h-screen pb-20 lg:pb-0 lg:pl-64 flex flex-col bg-[#121212]">
      {/* Sidebar - Desktop */}
      <nav className="fixed bottom-0 left-0 w-full lg:w-64 lg:h-full bg-[#191919] border-t lg:border-t-0 lg:border-r border-[#2b2b2b] z-40 px-4 py-6 flex lg:flex-col justify-between items-center lg:items-start">
        <div className="hidden lg:flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-[#333] rounded-lg flex items-center justify-center text-white border border-[#444]">
            <Check size={18} strokeWidth={3} />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#e1e1e1]">ZenHabit AI</span>
        </div>

        <div className="flex lg:flex-col w-full gap-1 justify-around lg:justify-start">
          {[
            { id: 'daily', icon: LayoutGrid, label: 'Tracker' },
            { id: 'manage', icon: List, label: 'Habits' },
            { id: 'ai', icon: Sparkles, label: 'AI Coach' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${activeTab === tab.id ? 'bg-[#2b2b2b] text-white' : 'text-[#8e8e8e] hover:bg-[#252525]'}`}
            >
              <tab.icon size={18} />
              <span className="hidden lg:block">{tab.label}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="lg:mt-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg lg:w-full flex items-center justify-center gap-2 transition-all shadow-lg text-sm font-bold"
        >
          <Plus size={16} />
          <span className="hidden lg:block">New Habit</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 max-w-[1800px] mx-auto w-full">
        {/* Header Navigation Toggles */}
        {activeTab === 'daily' && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center bg-[#191919] p-1 rounded-lg border border-[#2b2b2b]">
              <button 
                onClick={() => setViewRange('week')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewRange === 'week' ? 'bg-[#2b2b2b] text-white' : 'text-[#8e8e8e] hover:text-white'}`}
              >
                <Calendar size={14} /> This week
              </button>
              <button 
                onClick={() => setViewRange('month')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewRange === 'month' ? 'bg-[#2b2b2b] text-white' : 'text-[#8e8e8e] hover:text-white'}`}
              >
                <Calendar size={14} /> This month
              </button>
              <button className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold text-[#8e8e8e] hover:text-white transition-all">
                <Sparkles size={14} /> Streak
              </button>
            </div>

            <div className="flex items-center gap-2">
               <button className="p-2 text-[#8e8e8e] hover:bg-[#191919] rounded-md"><ArrowUpDown size={18} /></button>
               <button className="p-2 text-[#8e8e8e] hover:bg-[#191919] rounded-md"><Filter size={18} /></button>
               <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 shadow-sm"
               >
                 New <Plus size={14} />
               </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'daily' && (
            habits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 bg-[#191919] rounded-2xl flex items-center justify-center mb-6 border border-[#2b2b2b]">
                  <Plus className="text-[#444]" size={32} />
                </div>
                <h2 className="text-lg font-bold text-[#e1e1e1]">No habits defined yet</h2>
                <p className="text-[#8e8e8e] text-sm max-w-xs mt-2 mb-8">Add rituals to start tracking your progress in this calendar view.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-xl"
                >
                  Create Habit
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: The Grid */}
                <div className="flex-1 order-2 lg:order-1">
                  <div className="flex items-center gap-2 mb-4 text-[#8e8e8e] font-bold text-xs uppercase tracking-widest">
                    <Calendar size={14} />
                    <span>Activity Grid</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {displayDays.map(date => (
                      <DayCard 
                        key={date}
                        date={date}
                        habits={habits}
                        logs={logs}
                        onToggle={handleToggleHabit}
                      />
                    ))}
                  </div>
                </div>

                {/* Right Side: Integrated Analytics */}
                <div className="lg:w-[450px] order-1 lg:order-2 space-y-6">
                  <div className="sticky top-8">
                    <div className="flex items-center gap-2 mb-4 text-[#8e8e8e] font-bold text-xs uppercase tracking-widest">
                      <TrendingUp size={14} />
                      <span>Live Visualization</span>
                    </div>
                    <ChartsView habits={habits} logs={logs} variant="compact" />
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'manage' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Active Rituals</h2>
                  <p className="text-[#8e8e8e] text-sm mt-1">Manage and track long-term progress for each individual habit.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#191919] border border-[#2b2b2b] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#252525] transition-colors"
                >
                  <Plus size={16} /> New Habit
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {habits.map(habit => (
                  <HabitCard 
                    key={habit.id}
                    habit={habit}
                    logs={logs}
                    onToggle={handleToggleHabit}
                    onDelete={handleDeleteHabit}
                    onEdit={handleEditHabit}
                    onUpdateNote={handleUpdateNote}
                  />
                ))}
                {habits.length === 0 && (
                   <div className="col-span-full py-20 text-center bg-[#191919] rounded-3xl border border-dashed border-[#2b2b2b]">
                     <p className="text-[#8e8e8e] font-medium">No habits to manage. Create your first one to see it here.</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Insights Section */}
              <div className="bg-[#191919] p-10 rounded-3xl border border-[#2b2b2b] shadow-2xl">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                    <Sparkles className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Neural Coach</h2>
                    <p className="text-[#8e8e8e] font-medium">Behavioral Analysis Engine</p>
                  </div>
                </div>

                {!insight ? (
                  <div className="text-center py-12">
                    <button 
                      onClick={fetchInsights}
                      disabled={isAiLoading || habits.length === 0}
                      className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center gap-3 mx-auto disabled:opacity-50"
                    >
                      {isAiLoading ? 'Synthesizing...' : 'Generate Progress Insights'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in zoom-in-95 duration-500">
                    <div className="bg-[#121212] p-8 rounded-2xl border border-[#2b2b2b]">
                      <p className="text-lg leading-relaxed text-[#e1e1e1] italic">
                        "{insight.summary}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {insight.recommendations.map((rec, i) => (
                        <div key={i} className="bg-[#252525] p-6 rounded-2xl border border-[#333] hover:border-indigo-500/30 transition-colors">
                           <p className="text-[#e1e1e1] leading-relaxed text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl">
                      <MessageSquareQuote className="text-indigo-400" size={24} />
                      <p className="text-indigo-300 font-bold">{insight.encouragement}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Goal-Based Suggestions Section */}
              <div className="bg-[#191919] p-10 rounded-3xl border border-[#2b2b2b] shadow-2xl">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-600/30">
                    <Lightbulb className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Ritual Architect</h2>
                    <p className="text-[#8e8e8e] font-medium">Design habits based on your life goals</p>
                  </div>
                </div>

                <form onSubmit={handleGetSuggestions} className="mb-10">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={userGoal}
                      onChange={(e) => setUserGoal(e.target.value)}
                      placeholder="e.g. I want to improve my morning productivity"
                      className="flex-1 bg-[#121212] border border-[#2b2b2b] rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                    />
                    <button 
                      type="submit"
                      disabled={isSuggesting || !userGoal.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                    >
                      {isSuggesting ? <span className="animate-pulse">Architecting...</span> : <><Wand2 size={20} /> Get Suggestions</>}
                    </button>
                  </div>
                </form>

                {suggestions.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {suggestions.map((s, idx) => (
                      <div key={idx} className="bg-[#121212] border border-[#2b2b2b] p-6 rounded-2xl hover:border-emerald-500/40 transition-all flex flex-col group relative overflow-hidden">
                        <span className="text-3xl mb-4">{s.emoji}</span>
                        <h3 className="text-lg font-bold text-white mb-2">{s.name}</h3>
                        <p className="text-xs text-[#8e8e8e] mb-4 flex-1 leading-relaxed">{s.description}</p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2b2b2b]">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{s.category}</span>
                          <button 
                            onClick={() => handleAdoptSuggestion(s)}
                            className="text-xs bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-all border border-emerald-600/20"
                          >
                            Adopt Ritual
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal for adding/editing habits */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#191919] border border-[#2b2b2b] w-full max-w-lg rounded-2xl p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={closeModal}
              className="absolute top-8 right-8 text-[#8e8e8e] hover:text-white"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-8">
              {editingHabit ? 'Edit Habit' : 'New Habit'}
            </h2>
            <form onSubmit={handleAddHabit} className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#8e8e8e] uppercase tracking-widest mb-2">Name</label>
                  <input required type="text" value={newHabit.name} onChange={(e) => setNewHabit({...newHabit, name: e.target.value})} className="w-full bg-[#252525] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none" />
                </div>
                <div className="w-20">
                  <label className="block text-xs font-bold text-[#8e8e8e] uppercase tracking-widest mb-2">Emoji</label>
                  <input type="text" maxLength={2} value={newHabit.emoji} onChange={(e) => setNewHabit({...newHabit, emoji: e.target.value})} className="w-full bg-[#252525] border border-[#333] rounded-lg px-2 py-3 text-center text-xl focus:outline-none" />
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-bold text-[#8e8e8e] uppercase tracking-widest mb-3">Habit Color</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewHabit({...newHabit, color})}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newHabit.color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative group">
                    <input 
                      type="color" 
                      value={newHabit.color}
                      onChange={(e) => setNewHabit({...newHabit, color: e.target.value})}
                      className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer p-0 block"
                    />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#8e8e8e] uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Custom</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#8e8e8e] uppercase tracking-widest mb-2">Category</label>
                  <select value={newHabit.category} onChange={(e) => setNewHabit({...newHabit, category: e.target.value as Category})} className="w-full bg-[#252525] border border-[#333] rounded-lg px-4 py-3 text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8e8e8e] uppercase tracking-widest mb-2">Starts on</label>
                  <input type="date" value={newHabit.startDate} onChange={(e) => setNewHabit({...newHabit, startDate: e.target.value})} className="w-full bg-[#252525] border border-[#333] rounded-lg px-4 py-3 text-white" />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full text-white font-bold py-4 rounded-xl shadow-lg mt-6 transition-all hover:brightness-110"
                style={{ backgroundColor: newHabit.color }}
              >
                {editingHabit ? 'Update Habit' : 'Create Habit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
