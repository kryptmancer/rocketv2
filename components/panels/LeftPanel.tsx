"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'

// File tree type definitions
type FileNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
}

// Mock file structure data
const mockFileStructure: FileNode[] = [
  {
    id: '1',
    name: 'Projects',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: '1-1',
        name: 'My Rocket',
        type: 'folder',
        isOpen: true,
        children: [
          { id: '1-1-1', name: 'Engines.json', type: 'file' },
          { id: '1-1-2', name: 'Airframe.json', type: 'file' },
          { id: '1-1-3', name: 'Payload.json', type: 'file' },
        ]
      },
      {
        id: '1-2',
        name: 'Templates',
        type: 'folder',
        children: [
          { id: '1-2-1', name: 'Basic Rocket.json', type: 'file' },
          { id: '1-2-2', name: 'Advanced Rocket.json', type: 'file' },
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Settings',
    type: 'folder',
    children: [
      { id: '2-1', name: 'User Profile.json', type: 'file' },
      { id: '2-2', name: 'Preferences.json', type: 'file' },
    ]
  }
];

// Settings categories
const settingsCategories = [
  { id: 'appearance', name: 'Appearance', icon: '🎨' },
  { id: 'performance', name: 'Performance', icon: '⚡' },
  { id: 'controls', name: 'Controls', icon: '🎮' },
  { id: 'units', name: 'Units', icon: '📏' },
  { id: 'collaboration', name: 'Collaboration', icon: '👥' },
];

type LeftPanelProps = {
  onCollapse: () => void;
  isCollapsed: boolean;
  isMobile?: boolean;
  isSmallDesktop?: boolean;
}

export default function LeftPanel({ onCollapse, isCollapsed, isMobile = false, isSmallDesktop = false }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'settings'>('files');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedSetting, setSelectedSetting] = useState('appearance');

  // Toggle folder open/close
  const toggleFolder = (id: string, files: FileNode[]): FileNode[] => {
    return files.map(file => {
      if (file.id === id) {
        return { ...file, isOpen: !file.isOpen };
      }
      if (file.children) {
        return { ...file, children: toggleFolder(id, file.children) };
      }
      return file;
    });
  };

  // Recursive component to render file tree
  const FileTree = ({ files }: { files: FileNode[] }) => {
    return (
      <ul className="pl-3">
        {files.map(file => (
          <li key={file.id} className="my-1">
            <div 
              className={`flex items-center rounded px-2 py-1.5 text-small hover:bg-white hover:bg-opacity-10 cursor-pointer transition-colors holo-float ${
                selectedFile === file.id ? 'bg-white bg-opacity-15 neon-border-active' : ''
              }`}
              onClick={() => {
                if (file.type === 'folder') {
                  toggleFolder(file.id, mockFileStructure);
                } else {
                  setSelectedFile(file.id);
                }
              }}
            >
              {file.type === 'folder' ? (
                <span className="mr-2 opacity-90 text-neon-blue">{file.isOpen ? '📂' : '📁'}</span>
              ) : (
                <span className="mr-2 opacity-90 text-blue-300">📄</span>
              )}
              <span className={`${file.type === 'folder' ? 'font-medium' : ''}`}>{file.name}</span>
            </div>
            
            {file.type === 'folder' && file.isOpen && file.children && (
              <FileTree files={file.children} />
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={"h-full flex flex-col spaceship-door-panel spaceship-door-glow"}>
      {/* Panel content with fixed headers and scrollable content */}
      <div className={`flex-1 flex flex-col overflow-hidden p-3 ${isSmallDesktop ? 'p-5' : 'md:p-4'}`}>
        {/* Recent Files section with fixed header */}
        <div className="mb-5">
          <h2 className="text-section-header font-mono font-medium text-white/90 mb-3 flex items-center sticky top-0 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
            Recent Files
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {[1, 2].map(i => (
              <motion.div 
                key={i} 
                className="bg-black/30 p-3 rounded-xl shadow-md hover:bg-white/5 transition-all backdrop-blur-md"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-small font-medium text-white">Rocket Design {i}</p>
                    <p className="text-xs text-white/70">Modified 2h ago</p>
                  </div>
                  <div className="w-9 h-9 bg-black/40 rounded-full flex items-center justify-center border border-white/10">
                    <span>🚀</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* File Explorer with fixed header and scrollable content */}
        <div className="mb-5 flex flex-col flex-1 overflow-hidden">
          <h2 className="text-base font-medium text-white/90 mb-3 flex items-center sticky top-0 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-80">
              <path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"></path>
            </svg>
            File Explorer
          </h2>
          <motion.div 
            className="bg-black/20 rounded-xl shadow-md backdrop-blur-md overflow-hidden flex-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-full overflow-y-auto p-3">
              <FileTree files={mockFileStructure} />
            </div>
          </motion.div>
        </div>

        {/* Settings section below file explorer, only if active */}
        {activeTab === 'settings' && (
          <div className="mt-6">
            <h2 className="text-base font-medium text-white/90 mb-3 flex items-center sticky top-0 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-80">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
              </svg>
              Settings
            </h2>
            <div className="flex mb-4 overflow-x-auto pb-2 -mx-1 px-1">
              {settingsCategories.map(category => (
                <motion.button
                  key={category.id}
                  className={`p-3 mr-2 rounded-xl flex flex-col items-center min-w-[70px] ${
                    selectedSetting === category.id ? 
                    'bg-white/10 border border-white/20' : 
                    'bg-black/30 hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedSetting(category.id)}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="block text-lg mb-1">{category.icon}</span>
                  <span className="block text-xs">{category.name}</span>
                </motion.button>
              ))}
            </div>
            <motion.div 
              className="bg-black/20 rounded-xl p-4 backdrop-blur-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-base font-medium mb-4 text-white/90 flex items-center">
                {settingsCategories.find(c => c.id === selectedSetting)?.icon}
                <span className="ml-2">{settingsCategories.find(c => c.id === selectedSetting)?.name} Settings</span>
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm mb-2 text-white/80">Theme</label>
                  <select className="w-full bg-black/40 rounded-xl p-2.5 text-sm appearance-none bg-right bg-no-repeat pr-10 border border-white/10 focus:outline-none text-white/90" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E')", backgroundSize: "20px", backgroundPosition: "right 8px center"}}>
                    <option>Default Dark</option>
                    <option>Blue Neon</option>
                    <option>Green Matrix</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/80">UI Density</label>
                  <div className="flex">
                    <button className="flex-1 bg-black/40 rounded-l-xl py-2.5 text-sm bg-white/10 border border-white/20 hover:bg-white/15 transition-all">Compact</button>
                    <button className="flex-1 bg-black/40 rounded-r-xl py-2.5 text-sm border border-white/10 hover:bg-white/10 transition-all">Spacious</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/80 flex justify-between">
                    <span>Effect Intensity</span>
                    <span className="text-white/70">75%</span>
                  </label>
                  <div className="relative w-full h-6 flex items-center px-1">
                    <input 
                      type="range" 
                      className="absolute w-full appearance-none bg-transparent cursor-pointer z-10" 
                      min="0" 
                      max="100" 
                      defaultValue="75" 
                      style={{ 
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        height: '1.5rem'
                      }}
                    />
                    <div className="absolute top-1/2 transform -translate-y-1/2 left-1 right-1 flex justify-between">
                      {[0, 25, 50, 75, 100].map((mark) => (
                        <div key={mark} className="w-0.5 h-1.5 bg-white/30"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Panel footer */}
      <div className="p-3 border-t border-white/10 flex justify-between items-center bg-black/30 backdrop-blur-md">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 mr-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span className="text-small text-white/90">UserName</span>
        </div>
        <motion.button 
          className="px-4 py-1.5 rounded-full text-small bg-black/40 border border-white/10 hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {activeTab === 'files' ? 'New File' : 'Save'}
        </motion.button>
      </div>
    </div>
  )
} 