import { format, differenceInDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Trash2, AlertCircle, Calendar, Clock, ExternalLink, ArrowUpRight, Pencil } from 'lucide-react';
import { Subscription } from '@/src/types';
import { cn } from '@/src/utils';

interface SubscriptionCardProps {
  key?: string | number;
  subscription: Subscription;
  onDelete: (id: string) => void;
  onEdit: (sub: Subscription) => void;
}

export default function SubscriptionCard({ subscription, onDelete, onEdit }: SubscriptionCardProps) {
  const endDate = parseISO(subscription.endDate);
  const daysUntil = differenceInDays(endDate, new Date());
  const isUrgent = daysUntil <= subscription.reminderDays && daysUntil >= 0;
  const isExpired = daysUntil < 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -2 }}
      className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md shadow-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div 
              className="w-1.5 h-1.5 rounded-full shadow-sm" 
              style={{ backgroundColor: subscription.color }} 
            />
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
              {isExpired ? 'Expired' : isUrgent ? 'Expiring Soon' : 'Active'}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {subscription.name}
          </h3>
        </div>
        
        {subscription.cancelUrl && (
          <a 
            href={subscription.cancelUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            title="Cancel subscription"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span className="font-medium">{format(endDate, 'MMM d, yyyy')}</span>
          </div>
        </div>

        <div className={cn(
          "flex items-center justify-between px-3 py-2 rounded-xl border transition-colors",
          isExpired
            ? "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500"
            : isUrgent 
              ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400" 
              : "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400"
        )}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
            {isExpired ? <Clock className="w-3 h-3" /> : isUrgent ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span>{isExpired ? 'Ended' : daysUntil === 0 ? 'Ends Today' : daysUntil === 1 ? 'Ends Tomorrow' : `Ends in ${daysUntil} days`}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[9px] font-mono text-gray-300 dark:text-gray-700 uppercase tracking-widest">
          Ref: {subscription.id.slice(0, 6)}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(subscription)}
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Pencil className="w-2.5 h-2.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  );
}
