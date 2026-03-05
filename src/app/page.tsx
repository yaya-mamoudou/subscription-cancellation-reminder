'use client';

import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bell, BellOff, Search, CreditCard, Calendar, ShieldCheck, Sparkles, Moon, Sun, LogIn, LogOut, User as UserIcon, AlertCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Subscription } from '@/src/types';
import SubscriptionCard from '@/src/components/SubscriptionCard';
import AddSubscriptionModal from '@/src/components/AddSubscriptionModal';
import { cn } from '@/src/utils';
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, User, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error && parsed.error.includes('Missing or insufficient permissions')) {
          errorMessage = "You don't have permission to perform this action. Please check your account.";
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-red-100 dark:border-red-900/30 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Application Error</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SubSentinelApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [asyncError, setAsyncError] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Trigger Error Boundary for async errors
  if (asyncError) throw asyncError;

  // Initialize client-side states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('subsentinel_dark_mode');
      if (saved !== null) {
        setIsDarkMode(saved === 'true');
      } else {
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }

      if (typeof Notification !== 'undefined') {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed, user:', user?.email);
      setUser(user);
      setIsAuthReady(true);
      
      // Initialize user document if it doesn't exist
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          lastLogin: serverTimestamp()
        }, { merge: true }).catch(err => console.error("Error updating user doc:", err));
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setSubscriptions([]);
      return;
    }

    const path = `users/${user.uid}/subscriptions`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscription[];
      setSubscriptions(subs);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        setAsyncError(e);
      }
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('subsentinel_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Check for upcoming expirations and notify
  useEffect(() => {
    if (notificationPermission === 'granted' && subscriptions.length > 0) {
      const expiringSoon = subscriptions.filter(sub => {
        const days = differenceInDays(new Date(sub.endDate), new Date());
        return days >= 0 && days <= 2;
      });

      if (expiringSoon.length > 0) {
        expiringSoon.forEach(sub => {
          new Notification('Subscription Expiring Soon', {
            body: `${sub.name} trial ends in ${differenceInDays(new Date(sub.endDate), new Date())} days. Don't forget to cancel!`,
            icon: '/favicon.ico'
          });
        });
      }
    }
  }, [subscriptions, notificationPermission]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      new Notification('Notifications Enabled', {
        body: 'SubSentinel will now alert you before your trials expire.',
      });
    }
  };

  const handleSaveSubscription = async (subData: Omit<Subscription, 'id'>) => {
    if (!user) return;
    const path = `users/${user.uid}/subscriptions`;

    try {
      if (editingSubscription) {
        const subRef = doc(db, path, editingSubscription.id);
        await updateDoc(subRef, {
          ...subData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, path), {
          ...subData,
          userId: user.uid,
          createdAt: new Date().toISOString() // Using ISO string for rules validation as per blueprint
        });
      }
      setEditingSubscription(null);
    } catch (error) {
      try {
        handleFirestoreError(error, editingSubscription ? OperationType.UPDATE : OperationType.CREATE, path);
      } catch (e) {
        setAsyncError(e);
      }
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/subscriptions`;
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch (e) {
        setAsyncError(e);
      }
    }
  };

  const handleEditSubscription = (sub: Subscription) => {
    setEditingSubscription(sub);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setEditingSubscription(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubscription(null);
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      return sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [subscriptions, searchQuery]);

  const upcomingCount = useMemo(() => {
    return subscriptions.filter(s => {
      const days = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days <= 7 && days >= 0;
    }).length;
  }, [subscriptions]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-1.5 sm:gap-2 truncate">
                SubSentinel
                <span className="hidden sm:inline px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full text-[8px] text-blue-600 dark:text-blue-400 uppercase tracking-widest font-bold">Beta</span>
              </h1>
              <p className="hidden sm:block text-[8px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-[0.1em]">Trial Monitor</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={requestPermission}
              className={cn(
                "p-2 rounded-full transition-all",
                notificationPermission === 'granted' 
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                  : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              title={notificationPermission === 'granted' ? "Notifications Enabled" : "Enable Notifications"}
            >
              {notificationPermission === 'granted' ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenModal}
                  className="group flex items-center gap-2 bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full font-bold text-xs transition-all hover:bg-blue-700 active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
                  <span className="hidden sm:inline">New Reminder</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full font-bold text-xs transition-all hover:opacity-90 active:scale-95 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {!user ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">Secure your subscriptions.</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10 font-medium">
              Sign in with Google to sync your subscription reminders across all your devices and never miss a trial end date again.
            </p>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <LogIn className="w-5 h-5" />
              Get Started with Google
            </button>
          </div>
        ) : (
          <>
            {/* Hero & Stats Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full mb-3"
                >
                  <Sparkles className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300">Smart Trial Tracking</span>
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-2"
                >
                  Welcome back, {user.displayName?.split(' ')[0]}.
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-500 dark:text-gray-400 text-sm max-w-md font-medium"
                >
                  SubSentinel is currently monitoring {subscriptions.length} subscriptions for you.
                </motion.p>
              </div>

              {/* Stats Overview */}
              <div className="flex flex-wrap gap-3">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex items-center gap-3 min-w-[140px] shadow-sm"
                >
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 dark:text-gray-100 leading-none mb-0.5">
                      {subscriptions.length}
                    </div>
                    <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex items-center gap-3 min-w-[140px] shadow-sm"
                >
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                    <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 dark:text-gray-100 leading-none mb-0.5">
                      {upcomingCount}
                    </div>
                    <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Expiring</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Search & List */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                <div className="w-full sm:w-auto">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-0.5">Your Guard List</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage and monitor your active subscriptions.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search your list..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredSubscriptions.map((sub: Subscription) => (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onDelete={handleDeleteSubscription}
                      onEdit={handleEditSubscription}
                    />
                  ))}
                </AnimatePresence>

                {filteredSubscriptions.length === 0 && (
                  <div className="col-span-full py-24 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl mb-6 shadow-sm">
                      <Bell className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">The guard is empty</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto font-medium text-sm">
                      {searchQuery 
                        ? "No matches found for your search."
                        : "You haven't added any subscriptions to track yet."}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={handleOpenModal}
                        className="mt-6 text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-2 mx-auto text-sm"
                      >
                        Add your first reminder <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <AddSubscriptionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleSaveSubscription}
        initialData={editingSubscription}
      />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 dark:border-gray-800 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-60">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 dark:text-gray-100">SubSentinel v2.0</span>
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} SubSentinel. Secure cloud sync enabled.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <ErrorBoundary>
      <SubSentinelApp />
    </ErrorBoundary>
  );
}
