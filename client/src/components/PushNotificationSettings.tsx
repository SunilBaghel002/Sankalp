// src/components/PushNotificationSettings.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    BellOff,
    Check,
    X,
    Loader2,
    Sun,
    Moon,
    Flame,
    Trophy,
    AlertCircle,
    Send,
    Smartphone,
    Settings,
    ChevronRight,
    Zap,
} from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

const PushNotificationSettings: React.FC = () => {
    const {
        isSupported,
        isSubscribed,
        isLoading,
        permission,
        error,
        preferences,
        subscribe,
        unsubscribe,
        sendTestNotification,
        updatePreferences,
    } = usePushNotifications();

    const [testSending, setTestSending] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    const handleToggleSubscription = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    const handleTestNotification = async () => {
        setTestSending(true);
        setTestResult(null);

        const success = await sendTestNotification();
        setTestResult(success ? 'success' : 'error');
        setTestSending(false);

        // Clear result after 3 seconds
        setTimeout(() => setTestResult(null), 3000);
    };

    const handlePreferenceChange = async (key: string, value: boolean) => {
        await updatePreferences({ [key]: value });
    };

    const preferenceItems = [
        {
            key: 'morning_motivation',
            label: 'Morning Motivation',
            description: 'Start your day with an inspiring message',
            icon: Sun,
            color: 'text-yellow-400',
        },
        {
            key: 'habit_reminders',
            label: 'Habit Reminders',
            description: 'Get notified at your scheduled habit times',
            icon: Bell,
            color: 'text-blue-400',
        },
        {
            key: 'streak_alerts',
            label: 'Streak Alerts',
            description: 'Warning when your streak is at risk',
            icon: Flame,
            color: 'text-orange-400',
        },
        {
            key: 'evening_reminder',
            label: 'Evening Reminder',
            description: 'Reminder for incomplete habits in the evening',
            icon: Moon,
            color: 'text-indigo-400',
        },
        {
            key: 'achievement_alerts',
            label: 'Achievement Alerts',
            description: 'Celebrate when you unlock new badges',
            icon: Trophy,
            color: 'text-yellow-400',
        },
        {
            key: 'sleep_reminders',
            label: 'Sleep Reminders',
            description: 'Bedtime reminders for better sleep',
            icon: Moon,
            color: 'text-purple-400',
        },
    ];

    if (!isSupported) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-500/20 p-3 rounded-xl">
                        <BellOff className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Push Notifications</h3>
                        <p className="text-sm text-red-400">Not supported in this browser</p>
                    </div>
                </div>
                <p className="text-slate-400 text-sm">
                    Push notifications are not available in your browser. Try using Chrome, Firefox, or Edge for the best experience.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden"
        >
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isSubscribed ? 'bg-green-500/20' : 'bg-slate-700'}`}>
                            <Bell className={`w-6 h-6 ${isSubscribed ? 'text-green-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Push Notifications</h3>
                            <p className="text-sm text-slate-400">
                                {isSubscribed ? 'Notifications enabled' : 'Enable to stay on track'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleToggleSubscription}
                        disabled={isLoading}
                        className={`relative w-14 h-8 rounded-full transition-colors ${isSubscribed ? 'bg-green-500' : 'bg-slate-600'
                            } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    >
                        <motion.div
                            animate={{ x: isSubscribed ? 24 : 2 }}
                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
                            ) : isSubscribed ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <X className="w-4 h-4 text-slate-400" />
                            )}
                        </motion.div>
                    </button>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-2"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                            <p className="text-sm text-red-300">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Permission Denied Warning */}
                {permission === 'denied' && (
                    <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-xl">
                        <p className="text-sm text-yellow-300">
                            🔒 Notifications are blocked. Please enable them in your browser settings:
                        </p>
                        <p className="text-xs text-yellow-200/70 mt-1">
                            Click the lock icon in your browser's address bar → Site settings → Notifications → Allow
                        </p>
                    </div>
                )}
            </div>

            {/* Test Notification */}
            {isSubscribed && (
                <div className="p-6 border-b border-slate-700 bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-slate-400" />
                            <span className="text-slate-300">Test Notification</span>
                        </div>
                        <button
                            onClick={handleTestNotification}
                            disabled={testSending}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${testResult === 'success'
                                    ? 'bg-green-500/20 text-green-400'
                                    : testResult === 'error'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                        >
                            {testSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : testResult === 'success' ? (
                                <Check className="w-4 h-4" />
                            ) : testResult === 'error' ? (
                                <X className="w-4 h-4" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>
                                {testSending ? 'Sending...' : testResult === 'success' ? 'Sent!' : testResult === 'error' ? 'Failed' : 'Send Test'}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Notification Preferences */}
            <AnimatePresence>
                {isSubscribed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="p-4 border-b border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Settings className="w-4 h-4" />
                                <span className="text-sm font-medium">Notification Types</span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-700/50">
                            {preferenceItems.map((item) => {
                                const Icon = item.icon;
                                const isEnabled = preferences[item.key as keyof typeof preferences];

                                return (
                                    <motion.div
                                        key={item.key}
                                        className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-slate-700' : 'bg-slate-800'}`}>
                                                <Icon className={`w-5 h-5 ${isEnabled ? item.color : 'text-slate-500'}`} />
                                            </div>
                                            <div>
                                                <p className={`font-medium ${isEnabled ? 'text-white' : 'text-slate-400'}`}>
                                                    {item.label}
                                                </p>
                                                <p className="text-xs text-slate-500">{item.description}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handlePreferenceChange(item.key, !isEnabled)}
                                            className={`relative w-12 h-7 rounded-full transition-colors ${isEnabled ? 'bg-orange-500' : 'bg-slate-600'
                                                }`}
                                        >
                                            <motion.div
                                                animate={{ x: isEnabled ? 22 : 2 }}
                                                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                                            />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Benefits section when not subscribed */}
            {!isSubscribed && permission !== 'denied' && (
                <div className="p-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Why enable notifications?
                    </h4>
                    <div className="space-y-3">
                        {[
                            { icon: Bell, text: 'Get reminded at your scheduled habit times' },
                            { icon: Flame, text: 'Never lose your streak with timely alerts' },
                            { icon: Sun, text: 'Start each day with motivation' },
                            { icon: Trophy, text: 'Celebrate achievements instantly' },
                        ].map((benefit, index) => (
                            <div key={index} className="flex items-center gap-3 text-sm text-slate-400">
                                <benefit.icon className="w-4 h-4 text-orange-400" />
                                <span>{benefit.text}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={subscribe}
                        disabled={isLoading}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Bell className="w-5 h-5" />
                        )}
                        <span>Enable Notifications</span>
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default PushNotificationSettings;