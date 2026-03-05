import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Bell, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Subscription, COLORS } from '@/src/types';
import { cn } from '@/src/utils';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sub: Omit<Subscription, 'id'>) => void;
  initialData?: Subscription | null;
}

export default function AddSubscriptionModal({ isOpen, onClose, onAdd, initialData }: AddSubscriptionModalProps) {
  const [name, setName] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderDays, setReminderDays] = useState(3);
  const [cancelUrl, setCancelUrl] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEndDate(initialData.endDate);
      setReminderDays(initialData.reminderDays);
      setCancelUrl(initialData.cancelUrl || '');
      setColor(initialData.color);
    } else {
      setName('');
      setEndDate(new Date().toISOString().split('T')[0]);
      setReminderDays(3);
      setCancelUrl('');
      setColor(COLORS[0]);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !endDate) return;

    onAdd({
      name,
      endDate,
      reminderDays,
      cancelUrl: cancelUrl || undefined,
      color,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-[32px] p-8 z-50 shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
                  {initialData ? 'Edit Reminder' : 'Add Reminder'}
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                  {initialData ? 'Update your trial monitor details.' : 'Set up a new trial monitor.'}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] ml-1">Subscription Name</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  placeholder="e.g. Netflix, Adobe Cloud"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" /> Cancellation URL
                </label>
                <input
                  type="url"
                  value={cancelUrl}
                  onChange={(e) => setCancelUrl(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  placeholder="https://service.com/cancel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all dark:[color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                    <Bell className="w-3 h-3" /> Reminder
                  </label>
                  <select
                    value={reminderDays}
                    onChange={(e) => setReminderDays(parseInt(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none"
                  >
                    {[1, 2, 3, 5, 7, 14].map((d) => (
                      <option key={d} value={d} className="bg-white dark:bg-gray-900">{d} days before</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] ml-1">Color Accent</label>
                <div className="flex justify-between items-center px-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all border-2",
                        color === c 
                          ? "border-gray-900 dark:border-gray-100 scale-125 shadow-sm" 
                          : "border-transparent opacity-40 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-[0.1em] text-xs py-4 rounded-2xl transition-all shadow-md active:scale-[0.98] mt-4"
              >
                {initialData ? 'Update Guard' : 'Activate Guard'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
