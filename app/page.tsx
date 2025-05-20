"use client"

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa'

// Dynamically import panels to reduce initial load time
const LeftPanel = dynamic(() => import('@/components/panels/LeftPanel'))
const MiddlePanel = dynamic(() => import('@/components/panels/MiddlePanel'))
const RightPanel = dynamic(() => import('@/components/panels/RightPanel'))

export default function RocketSim() {
  // Panel sizing state (default widths in percentages)
  const [leftPanelWidth, setLeftPanelWidth] = useState(20)
  const [rightPanelWidth, setRightPanelWidth] = useState(25)
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isSmallDesktop, setIsSmallDesktop] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMobilePanel, setActiveMobilePanel] = useState<'left' | 'right' | null>(null)
  
  // Panel collapse state
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)

  // Calculate actual panel widths based on collapse state
  const actualLeftWidth = isLeftPanelCollapsed ? 0 : leftPanelWidth;
  const actualRightWidth = isRightPanelCollapsed ? 0 : rightPanelWidth;
  const middlePanelWidth = 100 - (isMobile ? 0 : (actualLeftWidth + actualRightWidth));
  
  // Check viewport size and orientation on mount and resize
  useEffect(() => {
    const checkSizeAndOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const newIsPortrait = height > width;
      
      setIsMobile(width < 768); // Mobile breakpoint
      setIsTablet(width >= 768 && width < 1024); // Tablet breakpoint adjusted from 1280px to 1024px
      setIsSmallDesktop(width >= 768 && width < 900); // Small desktop/large tablet range for additional spacing
      setIsPortrait(newIsPortrait);
      
      // Set panel states based on device and orientation
      if (width < 768) {
        // Mobile - always collapse panels by default
        setIsLeftPanelCollapsed(true);
        setIsRightPanelCollapsed(true);
        setActiveMobilePanel(null);
      } else if (width >= 768 && width < 1024) {
        // Smaller tablets - collapse both panels
        setIsLeftPanelCollapsed(true);
        setIsRightPanelCollapsed(true);
      } else {
        // Larger tablets and desktop - show both panels
        setIsLeftPanelCollapsed(false);
        setIsRightPanelCollapsed(false);
      }
    }
    
    // Initial check
    checkSizeAndOrientation();
    
    // Listen for window resize
    window.addEventListener('resize', checkSizeAndOrientation);
    return () => window.removeEventListener('resize', checkSizeAndOrientation);
  }, []);
  
  // Handle resize of panels
  const handleLeftDividerDrag = (delta: number) => {
    const newLeftWidth = Math.max(10, Math.min(30, leftPanelWidth + delta))
    setLeftPanelWidth(newLeftWidth)
  }
  
  const handleRightDividerDrag = (delta: number) => {
    const newRightWidth = Math.max(20, Math.min(30, rightPanelWidth - delta))
    setRightPanelWidth(newRightWidth)
  }
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey) {
      switch(e.key) {
        case '1':
          setIsLeftPanelCollapsed(false)
          break
        case '2':
          // Ensure middle panel is visible
          setIsLeftPanelCollapsed(false)
          setIsRightPanelCollapsed(false)
          break
        case '3':
          setIsRightPanelCollapsed(false)
          break
        default:
          break
      }
    }
  }
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
    if (menuOpen) {
      setActiveMobilePanel(null)
    }
  }
  
  // Select which panel to show on mobile
  const showMobilePanel = (panel: 'left' | 'right' | null) => {
    setActiveMobilePanel(panel)
    setMenuOpen(false)
  }

  return (
    <main 
      className="flex h-screen w-screen overflow-hidden relative"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Left Panel - File & Settings (conditionally displayed) */}
      {(!isMobile || activeMobilePanel === 'left') && (
        <motion.div
          className="h-full glass-panel-deep z-30"
          initial={{ width: isMobile ? '80%' : `${actualLeftWidth}%` }}
          animate={{ 
            width: isMobile 
              ? '80%' 
              : `${actualLeftWidth}%`,
            opacity: (isMobile || !isLeftPanelCollapsed) ? 1 : 0,
            x: isMobile && activeMobilePanel === 'left' ? 0 : (isMobile ? '-100%' : 0)
          }}
          transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}
          style={{ position: isMobile ? 'absolute' : 'relative', inset: isMobile ? 0 : 'auto' }}
        >
          <LeftPanel 
            onCollapse={() => isMobile ? showMobilePanel(null) : setIsLeftPanelCollapsed(!isLeftPanelCollapsed)} 
            isCollapsed={isLeftPanelCollapsed}
            isMobile={isMobile}
            isSmallDesktop={isSmallDesktop}
          />
        </motion.div>
      )}

      {/* Close Button for Left Panel (ONLY visible when panel is open in mobile) */}
      {isMobile && activeMobilePanel === 'left' && (
        <motion.button
          className="z-50 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center spring-btn"
          style={{ 
            position: 'absolute', 
            top: 'calc(50% - 12px)',
            right: '8px', 
            transform: 'translateY(-50%)', 
            background: 'rgba(0,0,0,0.3)', 
            backdropFilter: 'blur(8px)', 
            borderRadius: '9999px', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            transformOrigin: 'center center'
          }}
          onClick={() => showMobilePanel(null)}
          aria-label="Back to 3D View"
          whileTap={{ opacity: 0.7 }}
          transition={{ duration: 0.15 }}
        >
          <FaAngleDoubleLeft size={16} color="#FFFFFF" />
        </motion.button>
      )}
      
      {/* Left Panel Toggle Button - DESKTOP ONLY */}
      {!isMobile && (
        <motion.button
          className="z-40 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center spring-btn"
          style={{ 
            position: 'absolute', 
            top: '50%',
            left: `calc(${actualLeftWidth}% + 12px)`, 
            transform: 'translateY(-50%)', 
            background: 'rgba(0,0,0,0.3)', 
            backdropFilter: 'blur(8px)', 
            borderRadius: '9999px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', 
            opacity: 0.9,
            transformOrigin: 'center center'
          }}
          animate={{ 
            left: `calc(${actualLeftWidth}% + 12px)`,
          }}
          transition={{ duration: 0.25 }}
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          aria-label={isLeftPanelCollapsed ? 'Open File Explorer' : 'Close File Explorer'}
          whileTap={{ opacity: 0.7 }}
        >
          {isLeftPanelCollapsed ? (
            <FaAngleDoubleRight size={20} color="#FFFFFF" style={{ opacity: 0.9 }} />
          ) : (
            <FaAngleDoubleLeft size={20} color="#FFFFFF" style={{ opacity: 0.9 }} />
          )}
        </motion.button>
      )}
      
      {/* Mobile Left Panel Toggle - ONLY when no panel is active */}
      {isMobile && activeMobilePanel === null && (
        <motion.button
          className="z-40 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center spring-btn"
          style={{ 
            position: 'absolute', 
            top: 'calc(50% - 12px)',
            left: '8px', 
            transform: 'translateY(-50%)', 
            background: 'rgba(0,0,0,0.3)', 
            backdropFilter: 'blur(8px)', 
            borderRadius: '9999px', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)', 
            opacity: 0.9,
            transformOrigin: 'center center'
          }}
          onClick={() => showMobilePanel('left')}
          aria-label="Open File Explorer"
          whileTap={{ opacity: 0.7 }}
          transition={{ duration: 0.15 }}
        >
          <FaAngleDoubleRight size={16} color="#FFFFFF" style={{ opacity: 0.9 }} />
        </motion.button>
      )}
      
      {/* Middle Panel - 3D Visualization (always visible) */}
      <motion.div
        className="h-full glass-panel relative flex-1"
        initial={{ width: isMobile ? '100%' : `${middlePanelWidth}%` }}
        animate={{ 
          width: isMobile && activeMobilePanel !== null ? '20%' : (isMobile ? '100%' : `${middlePanelWidth}%`),
          filter: isMobile && activeMobilePanel !== null ? 'blur(5px) brightness(0.7)' : 'none'
        }}
        transition={{ duration: 0.25 }}
        style={{ zIndex: activeMobilePanel ? 20 : (isMobile ? 20 : 30), display: 'flex', alignItems: 'center', position: 'relative' }}
      >
        <MiddlePanel isMobile={isMobile} />
      </motion.div>

      {/* Mobile Right Panel Toggle - ONLY when no panel is active */}
      {isMobile && activeMobilePanel === null && (
        <motion.button
          className="z-40 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center spring-btn"
          style={{ 
            position: 'absolute', 
            top: 'calc(50% - 12px)',
            right: '8px', 
            transform: 'translateY(-50%)', 
            background: 'rgba(0,0,0,0.3)', 
            backdropFilter: 'blur(8px)', 
            borderRadius: '9999px', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)', 
            opacity: 0.9,
            transformOrigin: 'center center'
          }}
          onClick={() => showMobilePanel('right')}
          aria-label="Open Rocket Components"
          whileTap={{ opacity: 0.7 }}
          transition={{ duration: 0.15 }}
        >
          <FaAngleDoubleLeft size={16} color="#FFFFFF" style={{ opacity: 0.9 }} />
        </motion.button>
      )}
      
      {/* Right Panel Toggle Button - DESKTOP ONLY */}
      {!isMobile && (
        <motion.button
          className="z-40 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center spring-btn"
          style={{ 
            position: 'absolute', 
            top: '50%',
            right: `calc(${actualRightWidth}% + 12px)`, 
            transform: 'translateY(-50%)', 
            background: 'rgba(0,0,0,0.3)', 
            backdropFilter: 'blur(8px)', 
            borderRadius: '9999px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', 
            opacity: 0.9,
            transformOrigin: 'center center'
          }}
          animate={{ 
            right: `calc(${actualRightWidth}% + 12px)`,
          }}
          transition={{ duration: 0.25 }}
          onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          aria-label={isRightPanelCollapsed ? 'Open Rocket Components' : 'Close Rocket Components'}
          whileTap={{ opacity: 0.7 }}
        >
          {isRightPanelCollapsed ? (
            <FaAngleDoubleLeft size={20} color="#FFFFFF" style={{ opacity: 0.9 }} />
          ) : (
            <FaAngleDoubleRight size={20} color="#FFFFFF" style={{ opacity: 0.9 }} />
          )}
        </motion.button>
      )}
      
      {/* Close Button for Right Panel (ONLY visible when panel is open in mobile) */}
      {isMobile && activeMobilePanel === 'right' && (
        <motion.button
          className="z-50 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center spring-btn"
          style={{ 
            position: 'absolute', 
            top: 'calc(50% - 12px)',
            left: '8px', 
            transform: 'translateY(-50%)', 
            background: 'rgba(0,0,0,0.3)', 
            backdropFilter: 'blur(8px)', 
            borderRadius: '9999px', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            transformOrigin: 'center center'
          }}
          onClick={() => showMobilePanel(null)}
          aria-label="Back to 3D View"
          whileTap={{ opacity: 0.7 }}
          transition={{ duration: 0.15 }}
        >
          <FaAngleDoubleRight size={16} color="#FFFFFF" />
        </motion.button>
      )}
      
      {/* Right Panel - Components & Chat (conditionally displayed) */}
      {(!isMobile || activeMobilePanel === 'right') && (
        <motion.div
          className="h-full glass-right-panel z-30"
          initial={{ width: isMobile ? '80%' : `${actualRightWidth}%` }}
          animate={{ 
            width: isMobile ? '80%' : `${actualRightWidth}%`,
            opacity: (isMobile || !isRightPanelCollapsed) ? 1 : 0,
            x: isMobile && activeMobilePanel === 'right' ? 0 : (isMobile ? '100%' : 0)
          }}
          transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}
          style={{ 
            position: isMobile ? 'absolute' : 'relative', 
            right: 0, 
            top: 0,
          }}
        >
          <RightPanel 
            onCollapse={() => isMobile ? showMobilePanel(null) : setIsRightPanelCollapsed(!isRightPanelCollapsed)} 
            isCollapsed={isRightPanelCollapsed}
            isMobile={isMobile}
            isSmallDesktop={isSmallDesktop}
          />
        </motion.div>
      )}
    </main>
  )
} 