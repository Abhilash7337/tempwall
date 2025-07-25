import React from 'react';
import DraggableImage from './DraggableImage';

const WallCanvas = ({
  wallRef,
  wallColor,
  wallWidth,
  wallHeight,
  wallImage,
  images,
  imageStates,
  selectedIdx,
  setSelectedIdx,
  setActiveTab,
  setImageStates,
  isViewOnly = false
}) => {
  // Fix backend returning localhost URLs in production for wallImage
  let fixedWallImage = wallImage;
  if (fixedWallImage && fixedWallImage.includes('localhost')) {
    fixedWallImage = fixedWallImage.replace('http://localhost:5001', import.meta.env.VITE_API_BASE_URL);
  }
  return (
    <main 
      className="canvas-area min-h-screen flex items-center justify-center relative overflow-hidden" 
      style={{ 
        marginLeft: '360px', // Space for floating sidebar
        padding: '2rem',
        minHeight: 'calc(100vh - 80px)', // Account for header
        paddingTop: '1rem',
        background: 'transparent' // Let the main page animations show through
      }}
      onClick={(e) => {
        // Unselect when clicking on the canvas area background (but not on the wall itself)
        // Only allow selection changes in edit mode
        if (!isViewOnly && (e.target === e.currentTarget || e.target.classList.contains('canvas-background'))) {
          setSelectedIdx(null);
        }
      }}
    >        {/* Optimized Animated Background */}
        <div 
          className="canvas-background absolute inset-0 opacity-15 z-0"
          onClick={(e) => {
            if (!isViewOnly) {
              setSelectedIdx(null);
            }
          }}
        >
        {/* Primary Floating Orbs - Reduced quantity */}
        <div className="absolute top-16 left-12 w-32 h-32 bg-gradient-to-br from-orange-300/25 to-orange-600/35 rounded-full blur-xl animate-float-slow backdrop-blur-sm shadow-xl"></div>
        <div className="absolute top-40 right-24 w-24 h-24 bg-gradient-to-br from-orange-200/30 to-orange-400/25 rounded-full blur-lg animate-float-medium backdrop-blur-sm shadow-lg"></div>
        <div className="absolute bottom-32 left-20 w-36 h-36 bg-gradient-to-br from-orange-600/20 to-orange-800/30 rounded-full blur-2xl animate-float-fast backdrop-blur-sm shadow-xl"></div>
        <div className="absolute top-1/2 right-16 w-28 h-28 bg-gradient-to-br from-orange-300/35 to-orange-500/20 rounded-full blur-xl animate-float-slow backdrop-blur-sm shadow-lg"></div>
        
        {/* Animated Geometric Shapes - Reduced */}
        <div className="absolute top-20 right-1/4 w-16 h-16 bg-gradient-to-br from-orange-400/35 to-orange-600/25 transform rotate-45 animate-spin-slow backdrop-blur-sm shadow-md" style={{ borderRadius: '20%' }}></div>
        <div className="absolute bottom-24 left-1/4 w-12 h-12 bg-gradient-to-br from-orange-200/30 to-orange-400/20 transform rotate-12 animate-bounce-slow backdrop-blur-sm shadow-sm" style={{ borderRadius: '30%' }}></div>
        
        {/* Simplified Grid Pattern */}
        <div className="absolute inset-0 opacity-10 z-0" style={{
          backgroundImage: `linear-gradient(rgba(249, 115, 22, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(249, 115, 22, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'grid-slide 20s ease-in-out infinite'
        }}></div>
        
        {/* Simplified Wave Effect */}
        <div className="absolute top-1/2 left-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 opacity-6 z-0">
          <div className="w-full h-full rounded-full border border-orange-400/25 animate-ping"></div>
          <div className="absolute inset-8 rounded-full border border-orange-600/15 animate-ping delay-2000"></div>
        </div>
      </div>
      
      {/* Simplified Canvas Shadow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1">
        <div 
          className="absolute rounded-3xl blur-2xl animate-glow-pulse-slow"
          style={{
            width: wallWidth + 100,
            height: wallHeight + 100,
            background: `radial-gradient(ellipse, 
              rgba(249, 115, 22, 0.08) 0%, 
              rgba(234, 88, 12, 0.04) 40%, 
              transparent 70%)`
          }}
        ></div>
      </div>
      
      <div
        ref={wallRef}
        className="relative bg-cover bg-center bg-no-repeat overflow-hidden rounded-2xl shadow-2xl backdrop-blur-sm z-10"
        style={{
          backgroundColor: wallColor,
          width: wallWidth,
          height: wallHeight,
          backgroundImage: fixedWallImage ? `url(${fixedWallImage})` : undefined,
          position: 'relative',
          flexShrink: 0,
          boxShadow: `
            0 25px 50px -12px rgba(234, 88, 12, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3)
          `
        }}
        onClick={(e) => {
          if (!isViewOnly && e.target === e.currentTarget) {
            setSelectedIdx(null);
          }
        }}
      >
        {images.map((src, idx) => (
          <DraggableImage
            key={`${idx}-${src.substring(0, 20)}`}
            src={src}
            idx={idx}
            imageState={imageStates[idx]}
            setImageStates={setImageStates}
            wallWidth={wallWidth}
            wallHeight={wallHeight}
            isSelected={selectedIdx === idx}
            setSelectedIdx={(index) => {
              if (!isViewOnly) {
                setSelectedIdx(index);
              }
            }}
            isViewOnly={isViewOnly}
          />
        ))}
      </div>
    </main>
  );
};

export default WallCanvas;