import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useProjectsStore } from '../../stores/projectsStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface DotEvent {
  label: string;
  color: string;
  type: 'project' | 'task';
  id: string;
  projectId?: string;
}

export const CalendarPage = () => {
  const navigate = useNavigate();
  const { projects, fetchProjects } = useProjectsStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => { fetchProjects(); }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build event map: dateStr → DotEvent[]
  const eventMap = new Map<string, DotEvent[]>();
  const addEvent = (dateStr: string, event: DotEvent) => {
    if (!eventMap.has(dateStr)) eventMap.set(dateStr, []);
    eventMap.get(dateStr)!.push(event);
  };

  projects.forEach((p) => {
    if (p.dueDate) {
      const d = new Date(p.dueDate);
      addEvent(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, {
        label: p.title, color: p.color, type: 'project', id: p.id,
      });
    }
    p.tasks.forEach((t) => {
      if (t.dueDate && t.status !== 'DONE' && t.status !== 'CANCELLED') {
        const d = new Date(t.dueDate);
        addEvent(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, {
          label: t.title, color: p.color, type: 'task', id: t.id, projectId: p.id,
        });
      }
    });
  });

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // Selected day state
  const [selected, setSelected] = useState<number | null>(null);
  const selectedKey = selected ? `${year}-${month}-${selected}` : null;
  const selectedEvents = selectedKey ? (eventMap.get(selectedKey) || []) : [];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Calendar</h1>

      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/5 transition-all"><ChevronLeft size={18} /></button>
        <h2 className="text-white font-semibold text-lg">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/5 transition-all"><ChevronRight size={18} /></button>
      </div>

      {/* Grid */}
      <div className="bg-surface-800 rounded-2xl border border-white/5 overflow-hidden mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-white/30 text-xs font-semibold">{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="h-16 border-b border-r border-white/5 last:border-r-0" />;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selected;
            const key = `${year}-${month}-${day}`;
            const events = eventMap.get(key) || [];

            return (
              <motion.div
                key={i} whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(day === selected ? null : day)}
                className={`h-16 border-b border-r border-white/5 last:border-r-0 p-1.5 cursor-pointer transition-all ${
                  isSelected ? 'bg-accent-purple/20' : 'hover:bg-white/5'
                }`}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-accent-purple-light text-white' : isSelected ? 'text-white' : 'text-white/60'
                }`}>
                  {day}
                </span>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {events.slice(0, 3).map((e, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-white font-semibold mb-3 text-sm">
            {MONTHS[month]} {selected}{' '}
            <span className="text-white/30 font-normal">— {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</span>
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-white/30 text-sm">Nothing scheduled</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e, i) => (
                <div key={i}
                  onClick={() => navigate(e.type === 'project' ? `/projects/${e.id}` : `/projects/${e.projectId}`)}
                  className="flex items-center gap-3 p-3 bg-surface-800 rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-all">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                  <div>
                    <p className="text-white text-sm font-medium">{e.label}</p>
                    <p className="text-white/30 text-xs capitalize">{e.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs text-white/30">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-purple-light" /> Project deadline</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-gold" /> Task due date</span>
      </div>
    </div>
  );
};
