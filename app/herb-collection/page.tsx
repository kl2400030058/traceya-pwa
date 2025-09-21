"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Plus,
  Shield,
  Clock,
  FileText,
  Database,
  ChevronRight,
  ChevronLeft,
  Settings,
  Home,
  User,
  Search,
  Sun,
  Moon,
  Upload,
  Award,
  Zap,
  Leaf,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Mock data for charts
const activityData = [
  { name: "Mon", collections: 4, proofs: 2 },
  { name: "Tue", collections: 3, proofs: 1 },
  { name: "Wed", collections: 7, proofs: 5 },
  { name: "Thu", collections: 5, proofs: 3 },
  { name: "Fri", collections: 8, proofs: 6 },
  { name: "Sat", collections: 12, proofs: 8 },
  { name: "Sun", collections: 10, proofs: 7 },
];

const pieData = [
  { name: "Verified", value: 68 },
  { name: "Pending", value: 22 },
  { name: "Failed", value: 10 },
];

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

// Particle component for background effects
const Particle = ({ className }: { className?: string }) => {
  const size = Math.random() * 10 + 5;
  const initialX = Math.random() * 100;
  const initialY = Math.random() * 100;
  const duration = Math.random() * 20 + 10;
  const delay = Math.random() * 5;

  return (
    <motion.div
      className={`absolute rounded-full bg-white/10 ${className}`}
      style={{
        width: size,
        height: size,
        top: `${initialY}%`,
        left: `${initialX}%`,
      }}
      animate={{
        y: [0, -100, 0],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
};

// Particle background component
const ParticleBackground = () => {
  const [particleCount, setParticleCount] = useState(20);
  
  // Reduce particle count on smaller screens
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setParticleCount(width < 768 ? 10 : 20);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div 
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none" 
      aria-hidden="true"
    >
      {Array.from({ length: particleCount }).map((_, i) => (
        <Particle key={i} />
      ))}
    </div>
  );
};

// Animated counter component with smooth easing and bounce effect
const Counter = ({ 
  from = 0, 
  to, 
  duration = 2,
  className = ""
}: { 
  from?: number; 
  to: number; 
  duration?: number;
  className?: string;
}) => {
  const [count, setCount] = useState(from);
  const nodeRef = useRef(null);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    // Easing function for smooth counting with slight bounce at the end
    const easeOutBack = (x: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Apply easing function for smoother animation
      const easedProgress = progress < 0.9 
        ? progress / 0.9 
        : 1 + easeOutBack((progress - 0.9) * 10) * 0.05;
      
      setCount(Math.floor(easedProgress * (to - from) + from));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);

    return () => cancelAnimationFrame(animationFrame);
  }, [from, to, duration]);

  return <span className={className} ref={nodeRef} aria-live="polite">{count}</span>;
};

// Status card component
const StatusCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  progress, 
  trend,
  delay = 0
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  color: string; 
  progress: number;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ 
        scale: 1.03, 
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))"
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl backdrop-blur-lg p-4 ${color} border border-white/10`}
      role="region"
      aria-label={`${title} status card`}
      tabIndex={0}
      style={{ willChange: "transform, opacity" }}
    >
      <div className="absolute top-0 right-0 p-2">
        <motion.div
          animate={{ rotate: trend === "up" ? [0, 10, 0] : trend === "down" ? [0, -10, 0] : 0 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" }}
        >
          <Icon className="w-6 h-6 text-white/80" aria-hidden="true" />
        </motion.div>
      </div>
      <h3 className="text-sm font-medium text-white/80">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <Counter 
          to={value} 
          className="text-2xl font-bold text-white" 
          duration={2.5}
        />
        {trend && (
          <span 
            className={`ml-2 text-xs ${
              trend === "up" ? "text-green-400" : 
              trend === "down" ? "text-red-400" : 
              "text-gray-400"
            }`}
            aria-label={trend === "up" ? "Increasing trend" : trend === "down" ? "Decreasing trend" : "Stable trend"}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} 
            {trend === "up" ? "+12%" : trend === "down" ? "-5%" : "0%"}
          </span>
        )}
      </div>
      <div 
        className="mt-3 w-full h-1.5 bg-white/20 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div 
          className="h-full bg-white/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: 1.5, 
            delay: delay + 0.3,
            ease: "easeOut"
          }}
        />
      </div>
      {/* Add subtle reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
};

// Action button component
const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick,
  color = "bg-gradient-to-r from-indigo-500 to-purple-600",
  delay = 0
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
  color?: string;
  delay?: number;
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${color} text-white font-medium shadow-lg`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </motion.button>
  );
};

// Carousel card component
const CarouselCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color,
  buttonText,
  buttonAction
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  color: string;
  buttonText: string;
  buttonAction: () => void;
}) => {
  return (
    <div className={`h-full rounded-xl p-6 ${color} backdrop-blur-md border border-white/10 flex flex-col`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/10 rounded-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/80 mb-6 flex-grow">{description}</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={buttonAction}
        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
      >
        {buttonText}
      </motion.button>
    </div>
  );
};

// Badge component for gamification
const Badge = ({ 
  name, 
  icon: Icon, 
  level, 
  unlocked 
}: { 
  name: string; 
  icon: React.ElementType; 
  level: number; 
  unlocked: boolean 
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative flex flex-col items-center p-3 rounded-lg ${
        unlocked 
          ? "bg-gradient-to-br from-amber-400 to-amber-600" 
          : "bg-gray-700/50"
      }`}
    >
      <div className={`p-3 rounded-full mb-2 ${
        unlocked ? "bg-white/20" : "bg-gray-600/30"
      }`}>
        <Icon className={`w-6 h-6 ${unlocked ? "text-white" : "text-gray-400"}`} />
      </div>
      <span className={`text-xs font-medium ${unlocked ? "text-white" : "text-gray-400"}`}>
        {name}
      </span>
      <span className={`text-xs ${unlocked ? "text-white/80" : "text-gray-500"}`}>
        Level {level}
      </span>
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
      )}
    </motion.div>
  );
};

// Lock icon for badges
const Lock = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

// Notification panel component
const NotificationPanel = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void 
}) => {
  const notifications = [
    { 
      id: 1, 
      title: "New ZK Proof Generated", 
      message: "Your proof for collection #1234 was successfully generated.", 
      time: "2 min ago", 
      read: false,
      icon: Shield
    },
    { 
      id: 2, 
      title: "IPFS Upload Complete", 
      message: "Your collection data was successfully uploaded to IPFS.", 
      time: "1 hour ago", 
      read: false,
      icon: Database
    },
    { 
      id: 3, 
      title: "Verification Successful", 
      message: "Your collection #1230 was verified by the network.", 
      time: "3 hours ago", 
      read: true,
      icon: Check
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed top-0 right-0 h-full w-80 bg-gray-900/95 backdrop-blur-lg border-l border-white/10 z-50 shadow-2xl"
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[calc(100vh-64px)]">
            {notifications.length === 0 ? (
              <p className="text-white/70 text-center py-8">No notifications</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg ${
                      notification.read ? "bg-gray-800/50" : "bg-gray-800/80 border-l-2 border-indigo-500"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <notification.icon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{notification.title}</h3>
                        <p className="text-xs text-white/70 mt-1">{notification.message}</p>
                        <p className="text-xs text-white/50 mt-2">{notification.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// AI Recommendation component
const AIRecommendation = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 backdrop-blur-md rounded-xl p-4 border border-white/10"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-violet-500/30 rounded-lg mt-1">
          <Zap className="w-5 h-5 text-violet-300" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white flex items-center">
            AI Recommendation
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-violet-500/30 rounded text-violet-200">
              New
            </span>
          </h3>
          <p className="text-xs text-white/70 mt-1">
            Based on your recent activity, we recommend generating ZK proofs for your last 3 collections to improve verification rate.
          </p>
          <div className="mt-3 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-violet-500/30 hover:bg-violet-500/40 rounded text-xs text-white font-medium"
            >
              Apply Recommendation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs text-white/80"
            >
              Dismiss
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// File upload area component
const FileUploadArea = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6"
    >
      <h3 className="text-sm font-medium text-white/90 mb-2">Upload to IPFS</h3>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          isDragging
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-white/20 hover:border-white/40 bg-white/5"
        }`}
      >
        <Upload className="w-8 h-8 text-white/60 mx-auto mb-2" />
        <p className="text-sm text-white/80 mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-xs text-white/50">
          Supported formats: JPG, PNG, PDF, JSON (Max 10MB)
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <motion.label
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          htmlFor="file-upload"
          className="mt-4 inline-block px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg text-sm text-white font-medium cursor-pointer"
        >
          Select Files
        </motion.label>
      </div>

      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 bg-white/5 rounded-lg p-3"
        >
          <h4 className="text-sm font-medium text-white/90 mb-2">Selected Files ({files.length})</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-xs bg-white/10 rounded p-2">
                <span className="text-white/80 truncate max-w-[200px]">{file.name}</span>
                <span className="text-white/50">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 rounded text-xs text-white font-medium"
            >
              Upload to IPFS
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Theme switcher component
const ThemeSwitcher = ({ 
  isDarkMode, 
  toggleTheme 
}: { 
  isDarkMode: boolean; 
  toggleTheme: () => void 
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2 rounded-full bg-white/10 hover:bg-white/20"
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-yellow-300" />
      ) : (
        <Moon className="w-5 h-5 text-blue-300" />
      )}
    </motion.button>
  );
};

// User level component
const UserLevel = ({ level, progress }: { level: number; progress: number }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
          {level}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-gray-900"
        />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/80">Level {level}</span>
          <span className="text-white/60">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full mt-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
          />
        </div>
      </div>
    </div>
  );
};

// Custom loading animation
const LoadingAnimation = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-16 h-16"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-l-2 border-indigo-500"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-1 rounded-full border-t-2 border-r-2 border-emerald-500"
        />
        <motion.div
          animate={{ scale: [1, 0.8, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Leaf className="w-6 h-6 text-emerald-400" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// Main dashboard component
// Skip to content link component
const SkipToContent = () => {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-black focus:text-white focus:rounded-md"
    >
      Skip to main content
    </a>
  );
};

// Lazy load heavy components
const LazyParticleBackground = React.lazy(() => Promise.resolve({ default: ParticleBackground }));
const LazyCharts = React.lazy(() => Promise.resolve({ 
  default: ({ children }: { children: React.ReactNode }) => <>{children}</> 
}));

export default function HerbCollectionDashboard() {
  // Add error boundary state for fallback UI
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Import Lucide icons directly in the component scope to ensure they're defined
  const { RefreshCw } = require("lucide-react");
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  const [activeTab, setActiveTab] = useState("home");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userTheme, setUserTheme] = useState<"default" | "nature" | "ocean" | "sunset">("default");

  // Mock data for status cards
  const statusData = [
    { title: "Synced Collections", value: 128, icon: RefreshCw, color: "bg-gradient-to-br from-emerald-500/30 to-teal-600/30", progress: 100, trend: "up" as const },
    { title: "Pending Verification", value: 12, icon: Clock, color: "bg-gradient-to-br from-amber-500/30 to-orange-600/30", progress: 35, trend: "down" as const },
    { title: "ZK Proofs Generated", value: 96, icon: Shield, color: "bg-gradient-to-br from-indigo-500/30 to-purple-600/30", progress: 75, trend: "up" as const },
    { title: "IPFS Files Stored", value: 64, icon: Database, color: "bg-gradient-to-br from-blue-500/30 to-cyan-600/30", progress: 50, trend: "neutral" as const },
  ];

  // Mock data for carousel
  const carouselData = [
    {
      title: "ZK Proof Demo",
      description: "Generate zero-knowledge proofs for your herb collections to ensure privacy while proving authenticity.",
      icon: Shield,
      color: "bg-gradient-to-br from-indigo-500/20 to-purple-600/20",
      buttonText: "Try Demo",
      buttonAction: () => console.log("ZK Proof Demo clicked"),
    },
    {
      title: "IPFS Upload",
      description: "Store your collection data permanently on IPFS decentralized storage network with content addressing.",
      icon: Database,
      color: "bg-gradient-to-br from-blue-500/20 to-cyan-600/20",
      buttonText: "Upload Files",
      buttonAction: () => console.log("IPFS Upload clicked"),
    },
    {
      title: "Verification Portal",
      description: "Verify the authenticity of herb collections using our decentralized verification system.",
      icon: Check,
      color: "bg-gradient-to-br from-emerald-500/20 to-teal-600/20",
      buttonText: "Verify Collection",
      buttonAction: () => console.log("Verification Portal clicked"),
    },
  ];

  // Mock data for badges
  const badgesData = [
    { name: "Collector", icon: Leaf, level: 3, unlocked: true },
    { name: "Verifier", icon: Shield, level: 2, unlocked: true },
    { name: "Explorer", icon: Search, level: 1, unlocked: true },
    { name: "Master", icon: Award, level: 5, unlocked: false },
  ];

  // Theme colors
  const themeColors = {
    default: {
      primary: "from-indigo-500 to-purple-600",
      secondary: "from-emerald-500 to-teal-600",
      accent: "from-amber-500 to-orange-600",
    },
    nature: {
      primary: "from-emerald-500 to-green-600",
      secondary: "from-lime-500 to-emerald-600",
      accent: "from-amber-500 to-yellow-600",
    },
    ocean: {
      primary: "from-blue-500 to-cyan-600",
      secondary: "from-indigo-500 to-blue-600",
      accent: "from-teal-500 to-cyan-600",
    },
    sunset: {
      primary: "from-red-500 to-orange-600",
      secondary: "from-pink-500 to-rose-600",
      accent: "from-amber-500 to-yellow-600",
    },
  };

  // Get current theme colors
  const currentTheme = themeColors[userTheme];

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Toggle notification panel
  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen(!isNotificationPanelOpen);
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  // Change theme
  const changeTheme = (theme: "default" | "nature" | "ocean" | "sunset") => {
    setUserTheme(theme);
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Simulate online status check
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);

    return () => {
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
    };
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselData.length]);

  // Show onboarding for first-time users
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem("hasSeenOnboarding", "true");
    }
  }, []);

  // Translations
  const translations = {
    en: {
      dashboard: "Herb Collection Dashboard",
      synced: "Synced Collections",
      pending: "Pending Verification",
      proofs: "ZK Proofs Generated",
      ipfs: "IPFS Files Stored",
      capture: "Capture New Collection",
      generate: "Generate ZK Proof",
      activity: "Recent Activity",
      badges: "Your Badges",
      settings: "Settings",
    },
    hi: {
      dashboard: "जड़ी-बूटी संग्रह डैशबोर्ड",
      synced: "सिंक किए गए संग्रह",
      pending: "लंबित सत्यापन",
      proofs: "ZK प्रूफ जनरेट किए गए",
      ipfs: "IPFS फ़ाइलें संग्रहीत",
      capture: "नया संग्रह कैप्चर करें",
      generate: "ZK प्रूफ जनरेट करें",
      activity: "हाल की गतिविधि",
      badges: "आपके बैज",
      settings: "सेटिंग्स",
    },
  };

  // Get current translations
  const t = translations[language];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-100"} transition-colors duration-300`}>
      {/* Particle background */}
      <ParticleBackground />

      {/* Notification panel */}
      <NotificationPanel 
        isOpen={isNotificationPanelOpen} 
        onClose={() => setIsNotificationPanelOpen(false)} 
      />

      {/* Onboarding tooltips */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md mx-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">Welcome to Herb Collection Dashboard!</h2>
              <p className="text-white/80 mb-6">
                This dashboard helps you manage your herb collections with privacy and security using zero-knowledge proofs and IPFS storage.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/30 rounded-lg">
                    <Shield className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Generate ZK Proofs</h3>
                    <p className="text-xs text-white/70">Prove authenticity while maintaining privacy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/30 rounded-lg">
                    <Database className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Store on IPFS</h3>
                    <p className="text-xs text-white/70">Decentralized and permanent storage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/30 rounded-lg">
                    <Award className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Earn Badges</h3>
                    <p className="text-xs text-white/70">Track your progress and achievements</p>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowOnboarding(false)}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white font-medium"
              >
                Get Started
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-lg bg-gradient-to-r from-gray-900/80 to-gray-800/80 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg"
              >
                <Leaf className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold text-white">{t.dashboard}</h1>
              {isOnline ? (
                <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  Online
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  Offline
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher isDarkMode={isDarkMode} toggleTheme={toggleDarkMode} />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleLanguage}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white font-medium"
              >
                {language === "en" ? "EN" : "हिं"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleNotificationPanel}
                className="relative p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>
              <UserLevel level={3} progress={65} />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusData.map((status, index) => (
            <StatusCard
              key={index}
              title={status.title}
              value={status.value}
              icon={status.icon}
              color={status.color}
              progress={status.progress}
              trend={status.trend}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionButton
            icon={Plus}
            label={t.capture}
            onClick={() => console.log("Capture new collection")}
            color="bg-gradient-to-r from-emerald-500 to-teal-600"
            delay={0.3}
          />
          <ActionButton
            icon={Shield}
            label={t.generate}
            onClick={() => console.log("Generate ZK proof")}
            color="bg-gradient-to-r from-indigo-500 to-purple-600"
            delay={0.4}
          />
        </div>

        {/* AI Recommendation */}
        <AIRecommendation />

        {/* Carousel */}
        <div className="mt-6 relative">
          <h3 className="text-sm font-medium text-white/90 mb-3">Featured</h3>
          <div className="relative overflow-hidden rounded-xl h-48">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                <CarouselCard {...carouselData[currentSlide]} />
              </motion.div>
            </AnimatePresence>
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + carouselData.length) % carouselData.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselData.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {carouselData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full ${
                    currentSlide === index ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Two column layout for charts and file upload */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charts section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
          >
            <h3 className="text-sm font-medium text-white/90 mb-4">Activity Analytics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1f2937", 
                      borderColor: "#374151",
                      color: "#f9fafb" 
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="collections" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="proofs" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1f2937", 
                      borderColor: "#374151",
                      color: "#f9fafb" 
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* File upload and badges */}
          <div className="space-y-6">
            <FileUploadArea />
            
            {/* Badges section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
            >
              <h3 className="text-sm font-medium text-white/90 mb-4">{t.badges}</h3>
              <div className="grid grid-cols-4 gap-3">
                {badgesData.map((badge, index) => (
                  <Badge
                    key={index}
                    name={badge.name}
                    icon={badge.icon}
                    level={badge.level}
                    unlocked={badge.unlocked}
                  />
                ))}
              </div>
            </motion.div>

            {/* Theme selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
            >
              <h3 className="text-sm font-medium text-white/90 mb-4">Personalization</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(themeColors).map(([theme, _]) => (
                  <motion.button
                    key={theme}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => changeTheme(theme as any)}
                    className={`p-3 rounded-lg ${
                      userTheme === theme 
                        ? "ring-2 ring-white" 
                        : "ring-1 ring-white/20"
                    } ${
                      theme === "default" 
                        ? "bg-gradient-to-r from-indigo-500/50 to-purple-600/50" 
                        : theme === "nature"
                        ? "bg-gradient-to-r from-emerald-500/50 to-green-600/50"
                        : theme === "ocean"
                        ? "bg-gradient-to-r from-blue-500/50 to-cyan-600/50"
                        : "bg-gradient-to-r from-red-500/50 to-orange-600/50"
                    }`}
                  >
                    <span className="text-xs font-medium text-white capitalize">
                      {theme}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-gray-900/90 backdrop-blur-lg border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {[
              { id: "home", icon: Home, label: "Home" },
              { id: "search", icon: Search, label: "Search" },
              { id: "user", icon: User, label: "Profile" },
              { id: "settings", icon: Settings, label: "Settings" },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center p-2 ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs mt-1">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 w-6 h-1 bg-indigo-500 rounded-t-full"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}