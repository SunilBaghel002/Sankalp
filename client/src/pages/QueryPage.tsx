// src/pages/QueryPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Send,
    Bot,
    User,
    Mail,
    MessageCircle,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
} from "lucide-react";

interface Message {
    id: string;
    type: "user" | "bot";
    content: string;
    timestamp: Date;
}

interface FAQ {
    question: string;
    answer: string;
    category: string;
}

const QueryPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"chat" | "email" | "faq">("chat");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            type: "bot",
            content: "Hello! I'm Sankalp Assistant. I can help you understand the rules, payment process, and how the challenge works. How can I help you today?",
            timestamp: new Date(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const [emailForm, setEmailForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [emailSent, setEmailSent] = useState(false);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const faqs: FAQ[] = [
        {
            category: "Payment",
            question: "Is my ₹500 refundable?",
            answer: "Yes, but ONLY if you complete all 100 days without missing a single check-in. The refund is processed automatically on Day 101 and takes 3-7 business days to reach your account.",
        },
        {
            category: "Payment",
            question: "What happens to my money if I quit?",
            answer: "If you miss even one day, your ₹500 is forfeited permanently. This money goes into the 'Winners Fund' to reward those who complete the challenge.",
        },
        {
            category: "Rules",
            question: "Can I change my habits after starting?",
            answer: "No. Once you start the challenge, your 5 habits are locked for the entire 100 days. Choose wisely!",
        },
        {
            category: "Rules",
            question: "What if I forget to check in?",
            answer: "Forgetting is not an excuse. If you miss the 11:59 PM deadline, you lose your ₹500. Set multiple alarms!",
        },
        {
            category: "Rules",
            question: "Can I pause the challenge for emergencies?",
            answer: "No. The 100-day clock never stops. Some cohorts allow ONE emergency skip with medical proof, but it must be submitted within 48 hours.",
        },
        {
            category: "Technical",
            question: "What if the app is down?",
            answer: "You can check in from any device with internet. Use a friend's phone, a computer, anything. App issues are not accepted as excuses.",
        },
        {
            category: "Technical",
            question: "Can I check in from different devices?",
            answer: "Yes, you can use any device to check in. However, suspicious patterns (like checking in from 10 different devices) may trigger our anti-cheat system.",
        },
        {
            category: "Challenge",
            question: "When does my challenge start?",
            answer: "Your challenge starts at 00:00 IST the day AFTER you complete payment and set your habits.",
        },
        {
            category: "Challenge",
            question: "What counts as a valid habit?",
            answer: "Any measurable daily action: '30 min exercise', 'Read 10 pages', 'Meditate 15 min', etc. Vague habits like 'Be happy' are not recommended.",
        },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // AI Response Generator (Simulated)
    const generateAIResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();

        // Payment related
        if (lowerMessage.includes("refund") || lowerMessage.includes("money back")) {
            return "You get your ₹500 back ONLY if you complete all 100 days without missing a single day. The refund is automatic and takes 3-7 business days after Day 100.";
        }

        if (lowerMessage.includes("pay") || lowerMessage.includes("₹500") || lowerMessage.includes("500")) {
            return "The ₹500 deposit is required upfront via Razorpay. This money is at risk - you lose it if you miss even one day. It's refunded only after completing 100 days.";
        }

        // Rules related
        if (lowerMessage.includes("miss") || lowerMessage.includes("skip")) {
            return "Missing even ONE day means you lose your entire ₹500. There are no second chances. Some cohorts allow ONE emergency skip with medical proof within 48 hours.";
        }

        if (lowerMessage.includes("habit")) {
            return "You must choose exactly 5 habits. These are locked once the challenge starts and cannot be changed for 100 days. Choose habits that are specific and measurable.";
        }

        if (lowerMessage.includes("time") || lowerMessage.includes("deadline")) {
            return "You must check in before 11:59 PM IST every single day. The deadline is strict - even 12:00 AM means failure and loss of your ₹500.";
        }

        if (lowerMessage.includes("start") || lowerMessage.includes("begin")) {
            return "Your challenge starts at 00:00 IST the day AFTER you pay and set your habits. Day 1 begins automatically - there's no warm-up period.";
        }

        if (lowerMessage.includes("cheat") || lowerMessage.includes("fake")) {
            return "We track device fingerprints and behavior patterns. Cheating results in immediate disqualification, money forfeiture, and permanent ban. Don't even try!";
        }

        // General
        if (lowerMessage.includes("how") || lowerMessage.includes("work")) {
            return "Sankalp works on a simple principle: Deposit ₹500, commit to 5 habits for 100 days, check in daily before 11:59 PM. Complete all days = get your money back. Miss one day = lose it all.";
        }

        return "I understand you have questions! The key things to remember: 1) ₹500 deposit at risk, 2) 5 habits for 100 days, 3) Daily check-in before 11:59 PM, 4) Miss one day = lose money. What specific aspect would you like to know more about?";
    };

    const handleSendMessage = () => {
        if (inputMessage.trim() === "") return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: "user",
            content: inputMessage,
            timestamp: new Date(),
        };

        setMessages([...messages, userMessage]);
        setInputMessage("");
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: "bot",
                content: generateAIResponse(inputMessage),
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botResponse]);
            setIsTyping(false);
        }, 1500);
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would send to your backend
        console.log("Email sent:", emailForm);
        setEmailSent(true);
        setTimeout(() => {
            setEmailSent(false);
            setEmailForm({ name: "", email: "", subject: "", message: "" });
        }, 3000);
    };

    const copyEmail = () => {
        navigator.clipboard.writeText("support@sankalp.app");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/")}
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <HelpCircle className="text-orange-500" />
                                Support Center
                            </h1>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto px-4 pt-8">
                <div className="flex flex-wrap gap-4 justify-center mb-8">
                    {[
                        { id: "chat", label: "AI Assistant", icon: <Bot className="w-5 h-5" /> },
                        { id: "faq", label: "FAQs", icon: <HelpCircle className="w-5 h-5" /> },
                        { id: "email", label: "Email Us", icon: <Mail className="w-5 h-5" /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === tab.id
                                    ? "bg-orange-500 text-white"
                                    : "bg-slate-800 hover:bg-slate-700"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Chat Tab */}
                {activeTab === "chat" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                            {/* Messages Area */}
                            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        {message.type === "bot" && (
                                            <div className="bg-orange-500/10 p-2 rounded-lg h-fit">
                                                <Bot className="w-5 h-5 text-orange-500" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[70%] p-4 rounded-2xl ${message.type === "user"
                                                    ? "bg-orange-500 text-white"
                                                    : "bg-slate-800"
                                                }`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                            <p className="text-xs opacity-50 mt-2">
                                                {message.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                        {message.type === "user" && (
                                            <div className="bg-slate-800 p-2 rounded-lg h-fit">
                                                <User className="w-5 h-5 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-3">
                                        <div className="bg-orange-500/10 p-2 rounded-lg h-fit">
                                            <Bot className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div className="bg-slate-800 p-4 rounded-2xl">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="border-t border-slate-800 p-4">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                    className="flex gap-3"
                                >
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        placeholder="Ask anything about Sankalp..."
                                        className="flex-1 bg-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-orange-500 hover:bg-orange-600 p-3 rounded-xl transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* FAQ Tab */}
                {activeTab === "faq" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="space-y-4">
                            {["Payment", "Rules", "Technical", "Challenge"].map((category) => (
                                <div key={category}>
                                    <h3 className="text-lg font-semibold text-orange-400 mb-3">
                                        {category}
                                    </h3>
                                    <div className="space-y-2">
                                        {faqs
                                            .filter((faq) => faq.category === category)
                                            .map((faq, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() =>
                                                            setExpandedFAQ(
                                                                expandedFAQ === index ? null : index
                                                            )
                                                        }
                                                        className="w-full p-4 text-left hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                                                    >
                                                        <span className="font-medium">{faq.question}</span>
                                                        {expandedFAQ === index ? (
                                                            <ChevronUp className="w-5 h-5 text-slate-400" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </button>
                                                    <AnimatePresence>
                                                        {expandedFAQ === index && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="px-4 pb-4"
                                                            >
                                                                <p className="text-slate-400">{faq.answer}</p>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Email Tab */}
                {activeTab === "email" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                            <div className="mb-6 text-center">
                                <p className="text-slate-400 mb-2">Direct email:</p>
                                <div className="flex items-center justify-center gap-2">
                                    <code className="bg-slate-800 px-4 py-2 rounded-lg text-orange-400">
                                        support@sankalp.app
                                    </code>
                                    <button
                                        onClick={copyEmail}
                                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-slate-900 text-slate-500">
                                        Or use the form below
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={emailForm.name}
                                        onChange={(e) =>
                                            setEmailForm({ ...emailForm, name: e.target.value })
                                        }
                                        className="w-full bg-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={emailForm.email}
                                        onChange={(e) =>
                                            setEmailForm({ ...emailForm, email: e.target.value })
                                        }
                                        className="w-full bg-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={emailForm.subject}
                                        onChange={(e) =>
                                            setEmailForm({ ...emailForm, subject: e.target.value })
                                        }
                                        className="w-full bg-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={emailForm.message}
                                        onChange={(e) =>
                                            setEmailForm({ ...emailForm, message: e.target.value })
                                        }
                                        className="w-full bg-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={`w-full py-3 rounded-lg font-semibold transition-all ${emailSent
                                            ? "bg-green-500 text-white"
                                            : "bg-orange-500 hover:bg-orange-600 text-white"
                                        }`}
                                >
                                    {emailSent ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Check className="w-5 h-5" />
                                            Email Sent Successfully!
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Send className="w-5 h-5" />
                                            Send Email
                                        </span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default QueryPage;