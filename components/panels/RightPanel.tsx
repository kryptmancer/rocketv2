"use client"

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// Chat message type definition
type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

// Mock metrics data
const mockMetrics = {
  thrust: 2450, // N
  isp: 284, // s
  mass: 12.4, // kg
  altitude: 3250, // m
  velocity: 320, // m/s
  stability: 1.8, // calibers
  dragCoefficient: 0.32,
  apogee: 3850, // m
  burnTime: 2.8, // s
  recoveryTime: 180, // s
}

// Mock component data for highlighting in 3D view
const rocketComponents = [
  { id: 'nosecone', name: 'Nose Cone', status: 'optimal' },
  { id: 'airframe', name: 'Airframe', status: 'optimal' },
  { id: 'fins', name: 'Fins', status: 'warning' },
  { id: 'engine', name: 'Engine', status: 'optimal' },
  { id: 'parachute', name: 'Parachute System', status: 'optimal' },
  { id: 'electronics', name: 'Electronics Bay', status: 'critical' },
]

// Component settings data
const componentSettings = {
  nosecone: { length: 1.5, diameter: 0.5, material: 'Plastic' },
  airframe: { length: 4.0, diameter: 0.5, material: 'Aluminum' },
  fins: { count: 4, size: 0.8, sweep: 45 },
  engine: { thrust: 2450, isp: 284, burnTime: 2.8 },
  parachute: { size: 1.5, deployAltitude: 300, material: 'Nylon' },
  electronics: { batteryLife: 120, weight: 0.2, redundancy: 'Dual' }
};

// Suggested commands for AI chat
const suggestedCommands = [
  { id: '1', text: 'Optimize fin design' },
  { id: '2', text: 'Calculate descent rate' },
  { id: '3', text: 'Simulate launch conditions' },
  { id: '4', text: 'Engine recommendations' },
  { id: '5', text: 'Improve stability' },
];

type RightPanelProps = {
  onCollapse: () => void;
  isCollapsed: boolean;
  isMobile?: boolean;
  isSmallDesktop?: boolean;
}

// Chart component for displaying metrics visually
function MetricChart({ title, value, max, unit, color = '#A0A7B8' }: {
  title: string;
  value: number;
  max: number;
  unit: string;
  color?: string;
}) {
  const percentage = (value / max) * 100;
  
  // Determine color based on metric type
  const getColor = () => {
    if (title === 'Thrust') return 'from-cyan-400 to-blue-500';
    if (title === 'ISP') return 'from-indigo-400 to-purple-500';
    if (title === 'Stability') {
      if (value < 1.2) return 'from-yellow-400 to-orange-500';
      return 'from-green-400 to-emerald-500';
    }
    if (title === 'Drag Coefficient') return 'from-pink-400 to-rose-500';
    return 'from-gray-400 to-slate-500';
  };
  
  return (
    <div className="mb-2 sm:mb-3">
      <div className="flex justify-between mb-1 sm:mb-1.5">
        <span className="text-white/90 font-medium text-xs sm:text-sm metric-title">{title}</span>
        <span className="text-white font-mono text-sm sm:text-base metric-value">{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      <div className="h-1.5 sm:h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border-l-2 border-white/5">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${getColor()}`}
          style={{ 
            width: `${percentage}%`,
            boxShadow: '0 0 6px rgba(255,255,255,0.2)'
          }} 
        />
      </div>
    </div>
  );
}

// Component for displaying rocket parts with highlight capability and editing functionality
function ComponentItem({ 
  component, 
  onHighlight, 
  isHighlighted,
  editingComponent,
  onEdit,
  settings,
  onSettingChange
}: { 
  component: typeof rocketComponents[0], 
  onHighlight: (id: string | null) => void,
  isHighlighted: boolean,
  editingComponent: string | null,
  onEdit: (id: string | null) => void,
  settings: typeof componentSettings,
  onSettingChange: (component: string, setting: string, value: number | string) => void
}) {
  // Icons for each component type
  const getComponentIcon = (id: string) => {
    switch(id) {
      case 'nosecone':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        );
      case 'airframe':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        );
      case 'fins':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
            <path d="M11 11l-5 5"></path>
          </svg>
        );
      case 'engine':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
            <path d="M12 4v1M5 12H4M12 20v-1M20 12h-1M6.34 6.34l.7.7M6.34 17.66l.7-.7M17.66 6.34l-.7.7M17.66 17.66l-.7-.7"></path>
          </svg>
        );
      case 'parachute':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-10 8-14-4-7-8-7-8 3-8 7 8 14 8 14"></path>
          </svg>
        );
      case 'electronics':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v18"></path>
            <path d="M18 3v18"></path>
            <path d="M6 14h9"></path>
            <path d="M6 8h6"></path>
            <path d="M16 17h2"></path>
            <path d="M16 10h2"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l3-9 3 9h4l-6 6z"></path>
          </svg>
        );
    }
  };
  
  const statusColors = {
    optimal: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500'
  }
  
  const getGradientClass = (status: string) => {
    switch(status) {
      case 'optimal':
        return 'from-emerald-500/10 to-green-500/5';
      case 'warning':
        return 'from-amber-500/10 to-yellow-500/5';
      case 'critical':
        return 'from-red-500/10 to-rose-500/5';
      default:
        return 'from-gray-500/10 to-slate-500/5';
    }
  };

  const isEditing = editingComponent === component.id;
  
  return (
    <div>
      <motion.div 
        className={`py-1.5 px-2.5 rounded-lg flex items-center justify-between mb-1.5 cursor-pointer transition-all group ${
          isHighlighted 
            ? `bg-gradient-to-r ${getGradientClass(component.status)} backdrop-blur-sm border-l-[3px] border-l-white/30 shadow-md` 
            : `bg-black/5 hover:bg-gradient-to-r ${getGradientClass(component.status)} backdrop-blur-sm hover:border-l-[3px] hover:border-l-white/20`
        }`}
        onClick={() => onHighlight(isHighlighted ? null : component.id)}
        whileHover={{ scale: 1.03, x: 2 }}
        whileTap={{ scale: 0.92, opacity: 0.8 }}
        animate={{ 
          y: isHighlighted ? -2 : 0,
          x: isHighlighted ? 2 : 0,
          boxShadow: isHighlighted ? '0 4px 8px rgba(0,0,0,0.2)' : '0 0px 0px rgba(0,0,0,0)'
        }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 15
        }}
      >
        <div className="flex items-center">
          <div className={`mr-2 ${statusColors[component.status as keyof typeof statusColors]}`}>
            {getComponentIcon(component.id)}
          </div>
          <span className="text-base text-white/90 font-medium">{component.name}</span>
        </div>
        
        <motion.div 
          className="w-6 h-6 flex items-center justify-center bg-black/40 rounded-full group-hover:bg-cyan-500/20 transition-all border border-white/5 group-hover:border-white/20"
          whileHover={{ scale: 1.2, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: isEditing ? 1 : (component.status !== 'optimal' ? 0.6 : 0.3) }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the parent onClick
            onEdit(isEditing ? null : component.id);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </motion.div>
      </motion.div>
      
      {/* Component Settings Dashboard */}
      {isEditing && (
        <motion.div 
          className="mb-3 mt-1 rounded-lg bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3 space-y-3">
            {Object.entries(settings[component.id as keyof typeof settings]).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-white/80">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </label>
                  <span className="text-xs text-white/90 font-mono">
                    {typeof value === 'number' ? (value as number).toFixed(1) : value}
                    {key.includes('size') || key.includes('length') || key.includes('diameter') ? ' m' : ''}
                    {key.includes('thrust') ? ' N' : ''}
                    {key.includes('time') ? ' s' : ''}
                    {key.includes('weight') ? ' kg' : ''}
                    {key.includes('altitude') ? ' m' : ''}
                    {key === 'sweep' || key === 'count' ? '°' : ''}
                  </span>
                </div>
                {typeof value === 'number' ? (
                  <div className="relative w-full h-6 flex items-center">
                    <input
                      type="range"
                      min={key === 'count' ? 3 : 0.1}
                      max={key === 'count' ? 8 : (key === 'thrust' ? 5000 : (key === 'isp' ? 500 : (key === 'deployAltitude' ? 1000 : 5)))}
                      step={key === 'count' ? 1 : 0.1}
                      value={value as number}
                      onChange={(e) => {
                        onSettingChange(component.id, key, parseFloat(e.target.value));
                      }}
                      className="absolute w-full appearance-none bg-transparent cursor-pointer z-10"
                      style={{ 
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        height: '1.5rem'
                      }}
                    />
                    <div className="absolute top-1/2 transform -translate-y-1/2 left-1 right-1 flex justify-between">
                      {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
                        <div key={mark} className="w-0.5 h-1.5 bg-white/30"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select 
                    value={value as string}
                    onChange={(e) => {
                      onSettingChange(component.id, key, e.target.value);
                    }}
                    className="w-full bg-black/40 rounded-lg p-1.5 text-xs appearance-none bg-right bg-no-repeat pr-8 border border-white/10 focus:outline-none text-white/90"
                    style={{backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E')", backgroundSize: "16px", backgroundPosition: "right 4px center"}}
                  >
                    {key === 'material' && (
                      <>
                        <option>Plastic</option>
                        <option>Aluminum</option>
                        <option>Carbon Fiber</option>
                        <option>Steel</option>
                      </>
                    )}
                    {key === 'redundancy' && (
                      <>
                        <option>None</option>
                        <option>Dual</option>
                        <option>Triple</option>
                      </>
                    )}
                  </select>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function RightPanel({ onCollapse, isCollapsed, isMobile = false, isSmallDesktop = false }: RightPanelProps) {
  // Component highlighting state
  const [highlightedComponent, setHighlightedComponent] = useState<string | null>(null);
  // Component editing state - which component is currently being edited
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  // Component settings state
  const [settings, setSettings] = useState(componentSettings);
  
  // Handle editing component
  const handleEdit = (id: string | null) => {
    setEditingComponent(id);
  };
  
  // Handle settings change
  const handleSettingChange = (component: string, setting: string, value: number | string) => {
    setSettings(prev => ({
      ...prev,
      [component]: {
        ...prev[component as keyof typeof componentSettings],
        [setting]: value
      }
    }));
  };
  
  // Send highlighted component to parent/middle panel
  useEffect(() => {
    // Use CustomEvent to communicate with the 3D view
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('highlightComponent', { 
        detail: highlightedComponent 
      });
      window.dispatchEvent(event);
      
      console.log('Highlighting component:', highlightedComponent);
    }
  }, [highlightedComponent]);
  
  // Added this state to force client-side rendering for time display
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      message: 'Welcome to v2! I can help you design and optimize your rocket. What would you like to work on today?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Handle sending a chat message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      message: inputValue,
      timestamp: new Date(),
    };
    
    setMessages([...messages, userMessage]);
    setInputValue('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        message: `I'll help you with "${inputValue}". Based on your current rocket design, I recommend adjusting the fin shape for better stability during ascent.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  // Format time in a consistent way for both server and client
  const formatTime = (date: Date) => {
    if (!isClient) {
      return ""; // Don't render the time on the server
    }
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // Use 24-hour format consistently
    });
  };

  return (
    <div className="h-full flex flex-col bg-transparent backdrop-blur-sm border-l border-white/5">
      {/* Main content container with unified layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Components and Metrics section - Always visible */}
        <div className={`overflow-y-auto ${isSmallDesktop ? 'px-5 py-4' : 'px-3 py-3'} ${isMobile ? 'h-2/5' : 'h-[50%]'} bg-transparent backdrop-blur-sm`}>
          {/* Enhanced Components Section */}
          <div className={`${isSmallDesktop ? 'mb-5' : 'mb-3'}`}>
            <h2 className="text-xs font-medium mb-2 flex items-center text-white/90">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 opacity-80">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              Rocket Components
              {/* Add collapse button to the right side of the section heading for mobile */}
              {isMobile && (
                <button 
                  onClick={onCollapse}
                  className="ml-auto w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
                  aria-label="Back to main view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </button>
              )}
            </h2>
            <div className="space-y-1">
              {rocketComponents.map(component => (
                <ComponentItem 
                  key={component.id} 
                  component={component} 
                  onHighlight={setHighlightedComponent}
                  isHighlighted={highlightedComponent === component.id}
                  editingComponent={editingComponent}
                  onEdit={handleEdit}
                  settings={settings}
                  onSettingChange={handleSettingChange}
                />
              ))}
            </div>
          </div>
          
          {/* Key performance metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <motion.div 
              className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-lg p-1.5 sm:p-2 text-center backdrop-blur-sm border border-white/5"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97, opacity: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <p className="text-xs text-cyan-300/90 font-medium">Thrust</p>
              <p className="text-sm sm:text-base font-mono text-white font-medium">{mockMetrics.thrust} <span className="text-xs">N</span></p>
            </motion.div>
            <motion.div 
              className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-lg p-1.5 sm:p-2 text-center backdrop-blur-sm border border-white/5"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97, opacity: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <p className="text-xs text-emerald-300/90 font-medium">Apogee</p>
              <p className="text-sm sm:text-base font-mono text-white font-medium">{mockMetrics.apogee} <span className="text-xs">m</span></p>
            </motion.div>
          </div>
          
          {/* Performance charts - only shown in desktop view or on request */}
          {!isMobile && (
            <div className="bg-gradient-to-br from-black/5 to-slate-800/5 rounded-lg p-2 sm:p-3 backdrop-blur-sm min-h-[120px] sm:min-h-[140px] border border-white/5">
              <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-white/90">Performance</h3>
              
              <MetricChart 
                title="Thrust" 
                value={mockMetrics.thrust} 
                max={3000} 
                unit="N" 
                color="rgba(255, 255, 255, 0.8)" 
              />
              
              <MetricChart 
                title="ISP" 
                value={mockMetrics.isp} 
                max={300} 
                unit="s" 
                color="rgba(255, 255, 255, 0.8)" 
              />
              
              <MetricChart 
                title="Stability" 
                value={mockMetrics.stability} 
                max={3} 
                unit="cal" 
                color={mockMetrics.stability < 1.2 ? "rgb(245, 158, 11)" : "rgba(255, 255, 255, 0.8)"} 
              />
            </div>
          )}
        </div>

        {/* Custom aesthetic divider with neon glow */}
        <div className={`relative flex items-center justify-center ${isSmallDesktop ? 'py-3 mx-5' : 'py-2 mx-4'}`}>
          <div className="w-full h-[0.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
          <div className="absolute h-[2px] w-[70%] blur-[3px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        </div>
        
        {/* Chat section - Always visible */}
        <div className={`flex-1 flex flex-col ${isMobile ? 'h-3/5' : 'h-[50%]'} bg-transparent backdrop-blur-sm`}>
          {/* Messages area */}
          <div ref={chatContainerRef} className={`flex-1 overflow-y-auto ${isSmallDesktop ? 'p-4' : 'p-2.5'} space-y-2.5`}>
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-tr-none backdrop-blur-sm border border-white/10' 
                      : 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-tl-none backdrop-blur-sm border border-white/10'
                  }`}
                >
                  <p className="text-xs text-white">{msg.message}</p>
                  {isClient && (
                    <p className="text-[10px] mt-1 text-white/60">
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Chat input with integrated suggestions */}
          <div className={`${isSmallDesktop ? 'p-4' : 'p-2.5'} bg-transparent backdrop-blur-sm`}>
            {/* Commands row with individual borders */}
            <div className="flex overflow-x-auto pb-2 space-x-1.5">
              {suggestedCommands.map(cmd => (
                <motion.button
                  key={cmd.id}
                  className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] text-white/80 border-l-2 border-indigo-500/20 hover:border-purple-500/30 transition-all flex-shrink-0 backdrop-blur-sm"
                  onClick={() => setInputValue(cmd.text)}
                  whileHover={{ scale: 1.05, x: 1, y: -1 }}
                  whileTap={{ scale: 0.92, opacity: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  {cmd.text}
                </motion.button>
              ))}
            </div>
            
            {/* Input field */}
            <div className="flex bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full backdrop-blur-sm overflow-hidden mt-1 border border-white/10 hover:border-white/20 transition-colors">
              <input
                type="text"
                className="flex-1 bg-transparent px-3 py-2 text-xs focus:outline-none text-white/90 placeholder-white/40"
                placeholder="Ask the AI assistant..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
              />
              <motion.button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-all text-white/90 hover:text-white mx-1 my-0.5 hover:shadow-sm"
                onClick={handleSendMessage}
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 10 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}