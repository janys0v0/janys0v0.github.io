"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// Combine position and content data
interface LeafData {
  relX: number;
  relY: number;
  title: string;
  text: string;
  year: string;
}

// Keep existing leaves and add more to the right
const leafData: LeafData[] = [
  { relX: 0.05, relY: 0.5, title: "Where Next?", text: "???" , year: "2025"},
  { relX: 0.05, relY: 0.4, title: "Harvard", text: "MS Data Science" , year: "2025~"},
  { relX: 0.10, relY: 0.4, title: "Cathay Pacific ✈️", text: "Data Analytics and AI Automation" , year: "2025"},
  { relX: 0.15, relY: 0.5, title: "Develop for Good 🍃", text: "Product Management & User Research" , year: "2025"},
  { relX: 0.20, relY: 0.4, title: "Ekimetrics", text: "AI Development & Market Analytics Consulting" , year: "2024"},
  { relX: 0.45, relY: 0.5, title: "ACME Lab @ UCLA", text: "Research in psychological symptoms & emotional flexibilty" , year: "2022~2024"},
  { relX: 0.65, relY: 0.4, title: "Nova, Tech for Good", text: "Frontend Development & UX Design" , year: "2022~2025"},
  { relX: 0.85, relY: 0.5, title: "Ozcan Lab", text: "Research in Computer Vision for Medical Imaging" , year: "2023"},
  { relX: 1.05, relY: 0.4, title: "Ipsos", text: "User Experience Research Consulting" , year: "2022"},
  { relX: 1.25, relY: 0.5, title: "UCLA", text: "Statistics & Data Science; Cognitive Science" , year: "2021~2025"},
  { relX: 1.45, relY: 0.4, title: "Cranbrook Schools", text: "Frozen in the icy lakes ❄️" , year: "2019"},
  { relX: 1.65, relY: 0.5, title: "Virginia Episcopal School", text: "Tennis player, Sweeper of red autumn leaves 🍁" , year: "2018"},
  { relX: 1.85, relY: 0.4, title: "Shenzhen", text: "Born and grew up to 15 🎹" , year: "Long Ago..."}
];

const FROG_OFFSET_Y = -30;
const LEAF_HEIGHT = 60; // Approx height for positioning box below
const LEAF_WIDTH = 80; // Width of the leaf image
const TEXT_BOX_WIDTH = 200; // Approx width for centering
const SCROLL_MARGIN = 0.2; // Start scrolling when within 20% of the edge

interface CalculatedPosition {
  x: number;
  y: number;
}

interface CalculatedTextBoxPosition {
  left: number;
  top: number;
}

export default function FrogHop() {
  const [step, setStep] = useState(0);
  const [isHopping, setIsHopping] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const controls = useAnimationControls();

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [calculatedLeafPositions, setCalculatedLeafPositions] = useState<CalculatedPosition[]>([]);
  const [calculatedTextBoxPositions, setCalculatedTextBoxPositions] = useState<CalculatedTextBoxPosition[]>([]); // State for box positions
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // State for scroll position
  const [scrollPosition, setScrollPosition] = useState(0);
  // Content width is larger than viewport to allow scrolling
  const contentWidth = containerSize.width * (Math.max(...leafData.map(data => data.relX)) + 0.2);

  // State for intro animation completion
  const [introAnimationComplete, setIntroAnimationComplete] = useState(false);
  
  // State for wait message
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const waitMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to calculate absolute positions
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      // Calculate how many leaves we need to position
      const leafCount = leafData.length;
      
      // Calculate the interval based on available width and number of leaves
      // This ensures all leaves fit in the available width with equal spacing
      const calculatedInterval = (containerSize.width - 200) / (leafCount - 1);
      
      // Use either the calculated interval or our minimum, whichever is larger
      const actualInterval = Math.max(calculatedInterval, 200); // Minimum 150px between leaves
      
      const newLeafPositions = leafData.map((data, index) => ({
        x: 100 + (index * actualInterval),
        y: (data.relY * containerSize.height) + (containerSize.height * 0.1)
      }));
      setCalculatedLeafPositions(newLeafPositions);

      // Text box positions remain the same
      const newTextBoxPositions = newLeafPositions.map(leafPos => ({
        left: (leafPos.x + (LEAF_WIDTH / 2)) - (TEXT_BOX_WIDTH / 2),
        top: leafPos.y + LEAF_HEIGHT + 10
      }));
      setCalculatedTextBoxPositions(newTextBoxPositions);
    }
  }, [containerSize]);

  // Effect to measure container size on mount and resize
  useEffect(() => {
    const measureContainer = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    measureContainer(); // Initial measure

    // Optional: Add resize listener for dynamic adjustments
    // Using ResizeObserver is more performant but complex
    window.addEventListener('resize', measureContainer);
    return () => window.removeEventListener('resize', measureContainer);

  }, []); // Run only once on mount to set up measurement

  // Function to check if scrolling is needed and adjust scroll position
  const updateScrollPosition = useCallback((targetX: number) => {
    if (!scrollContainerRef.current || containerSize.width === 0) return;
    
    const containerWidth = containerSize.width;
    
    // Center the frog in the viewport
    const desiredScrollPosition = targetX - (containerWidth / 2);
    
    // Apply bounds to prevent scrolling beyond content limits
    const boundedScrollPosition = Math.max(
      0, // Don't scroll past the beginning
      Math.min(
        desiredScrollPosition,
        contentWidth - containerWidth // Don't scroll past the end
      )
    );
    
    // Update scroll position to center the frog
    setScrollPosition(boundedScrollPosition);
    
  }, [containerSize.width, contentWidth]);

  const animateHop = useCallback(async (targetIndex: number) => {
    if (isHopping || calculatedLeafPositions.length === 0) return;
    setIsHopping(true);

    const currentPos = {
      x: calculatedLeafPositions[step].x,
      y: calculatedLeafPositions[step].y + FROG_OFFSET_Y
    };
    const nextPos = {
      x: calculatedLeafPositions[targetIndex].x,
      y: calculatedLeafPositions[targetIndex].y + FROG_OFFSET_Y
    };

    // Check if scrolling is needed and update scroll position
    updateScrollPosition(nextPos.x);

    const duration = 0.8;
    const frames = 30;

    const dx = nextPos.x - currentPos.x;
    const dy = currentPos.y - nextPos.y; 
    const vx = dx / duration;
    const gravity = 1600;

    const baseVyInitial = -600; 
    const heightBoostFactor = 1.5; 
    const vyInitial = baseVyInitial - (dy > 0 ? dy * heightBoostFactor : 0);

    const shouldFlip = dx < 0;
    setIsFlipped(shouldFlip);

    const xPoints = [];
    const yPoints = [];

    for (let i = 0; i < frames; i++) {
      const t = (i / (frames - 1)) * duration;
      const x = currentPos.x + vx * t;
      const y = currentPos.y + vyInitial * t + 0.5 * gravity * t * t;
      xPoints.push(x);
      yPoints.push(y);
    }

    if (frames > 0) {
      xPoints[frames - 1] = nextPos.x;
      yPoints[frames - 1] = nextPos.y;
    }

    await controls.set({ 
      x: currentPos.x, 
      y: currentPos.y,
      scaleX: shouldFlip ? -1 : 1 
    });

    await controls.start({
      x: xPoints,
      y: yPoints,
      transition: {
        duration,
        ease: "linear",
        times: Array.from({ length: frames }, (_, i) => i / (frames - 1))
      }
    });

    controls.set({
      x: nextPos.x,
      y: nextPos.y,
      scaleX: shouldFlip ? -1 : 1 
    });

    setStep(targetIndex); 

    setIsHopping(false); 
  }, [step, calculatedLeafPositions, controls, isHopping, updateScrollPosition]);

  const handleLeafClick = (targetIndex: number) => {
    // Check if intro animation is still running or if currently hopping
    if (!introAnimationComplete || isHopping) {
      // Only show message if not already showing
      if (!showWaitMessage) {
        setShowWaitMessage(true);
        // Auto-hide after animation completes (1s)
        waitMessageTimeoutRef.current = setTimeout(() => setShowWaitMessage(false), 1000);
      }
      return;
    }
    
    // Only proceed if positions are available and target is different
    if (targetIndex !== step && calculatedLeafPositions.length > 0) { 
      animateHop(targetIndex);
    }
  };

  // Effect for initial animation sequence
  useEffect(() => {
    // Only run if positions are calculated and intro hasn't run
    if (calculatedLeafPositions.length > 0 && !introAnimationComplete) {
      
      const runIntroAnimation = async () => {
        // Mark animation as started to prevent multiple runs
        setIntroAnimationComplete(true);
        setIsHopping(true);
        
        // Get the index of the rightmost leaf (from the initially visible set)
        const initialIndex = 6; // This is the 5th leaf (the original rightmost leaf)
        
        // Position the frog off-screen to the right
        const offScreenX = containerSize.width + 100; // 100px beyond the right edge
        const rightmostLeafY = calculatedLeafPositions[initialIndex].y;
        
        // Place frog off-screen
        controls.set({
          x: offScreenX,
          y: rightmostLeafY + FROG_OFFSET_Y,
          scaleX: -1 // Face left
        });
        
        // Wait a moment before starting
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // First jump: from off-screen to rightmost leaf
        {
          const currentPos = {
            x: offScreenX,
            y: rightmostLeafY + FROG_OFFSET_Y
          };
          
          const nextPos = {
            x: calculatedLeafPositions[initialIndex].x,
            y: calculatedLeafPositions[initialIndex].y + FROG_OFFSET_Y
          };

          const duration = 1.0; // Slightly longer for first jump
          const frames = 30;

          const dx = nextPos.x - currentPos.x;
          const dy = nextPos.y - currentPos.y;
          const vx = dx / duration;
          
          // Generate parabolic motion
          const xPoints = [];
          const yPoints = [];

          // Create points along the path
          for (let j = 0; j < frames; j++) {
            const t = (j / (frames - 1)) * duration;
            const x = currentPos.x + vx * t;
            
            // Calculate parabolic arc with fixed height
            const progress = t / duration;
            // Parabola that peaks at 0.5 and ends at 0
            const jumpHeight = -300 * (4 * progress * (1 - progress)); 
            
            // Linear interpolation for base position + arc
            const baseY = currentPos.y + (dy * progress);
            const y = baseY + jumpHeight;
            
            xPoints.push(x);
            yPoints.push(y);
          }

          if (frames > 0) {
            // Make sure final position is exact
            xPoints[frames - 1] = nextPos.x;
            yPoints[frames - 1] = nextPos.y;
          }

          // Jump in from off-screen
          await controls.start({
            x: xPoints,
            y: yPoints,
            transition: {
              duration,
              ease: "linear",
              times: Array.from({ length: frames }, (_, idx) => idx / (frames - 1))
            }
          });

          // Update position and state
          controls.set({
            x: nextPos.x,
            y: nextPos.y,
            scaleX: -1
          });
          
          // Update step state to match current position
          setStep(initialIndex);
        }
        
        // Short pause after landing on rightmost leaf
        await new Promise(resolve => setTimeout(resolve, 400));

        // Continue with the rest of the hops from right to left
        for (let i = initialIndex - 1; i >= 0; i--) {
          console.log("Hopping to leaf at index:", i);
          
          // Use direct animation logic instead of animateHop function
          // to avoid animation state conflicts
          const currentPos = {
            x: calculatedLeafPositions[i + 1].x,
            y: calculatedLeafPositions[i + 1].y + FROG_OFFSET_Y
          };
          
          const nextPos = {
            x: calculatedLeafPositions[i].x,
            y: calculatedLeafPositions[i].y + FROG_OFFSET_Y
          };

          // Check if scrolling is needed for this hop
          updateScrollPosition(nextPos.x);

          const duration = 0.8;
          const frames = 30;

          const dx = nextPos.x - currentPos.x;
          const dy = currentPos.y - nextPos.y;
          const vx = dx / duration;
          const gravity = 1600;

          const baseVyInitial = -600;
          const heightBoostFactor = 1.5;
          const vyInitial = baseVyInitial - (dy > 0 ? dy * heightBoostFactor : 0);

          // Always flipping left for intro animation
          const shouldFlip = true;
          setIsFlipped(shouldFlip);

          const xPoints = [];
          const yPoints = [];

          for (let j = 0; j < frames; j++) {
            const t = (j / (frames - 1)) * duration;
            const x = currentPos.x + vx * t;
            const y = currentPos.y + vyInitial * t + 0.5 * gravity * t * t;
            xPoints.push(x);
            yPoints.push(y);
          }

          if (frames > 0) {
            xPoints[frames - 1] = nextPos.x;
            yPoints[frames - 1] = nextPos.y;
          }

          // Start the hop animation
          await controls.start({
            x: xPoints,
            y: yPoints,
            transition: {
              duration,
              ease: "linear",
              times: Array.from({ length: frames }, (_, idx) => idx / (frames - 1))
            }
          });

          // Set the final position
          controls.set({
            x: nextPos.x,
            y: nextPos.y,
            scaleX: -1
          });

          // Update step state to match current position
          setStep(i);
        }
        
        // Mark intro animation as complete
        setIsHopping(false);
      };

      runIntroAnimation();
    }
  }, [calculatedLeafPositions, introAnimationComplete, controls, containerSize, updateScrollPosition]);

  // Effect to smoothly animate scroll changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.transform = `translateX(-${scrollPosition}px)`;
      scrollContainerRef.current.style.transition = 'transform 0.5s ease-out';
    }
  }, [scrollPosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (waitMessageTimeoutRef.current) {
        clearTimeout(waitMessageTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden"
    >
      {/* Scrollable container */}
      <div 
        ref={scrollContainerRef} 
        className="absolute top-0 left-0 h-full" 
        style={{ width: `${contentWidth}px` }}
      >
        {/* Render Leaves */}
        {calculatedLeafPositions.map((pos, i) => (
          <div 
            key={`leaf-${i}`}
            className="absolute cursor-pointer z-10" // Ensure leaves are clickable above boxes
            style={{ left: pos.x, top: pos.y }}
            onClick={() => handleLeafClick(i)} 
          >
            <Image
              src="/leaf.png"
              alt={`leaf-${i}`}
              width={80}
              height={60}
            />
          </div>
        ))}

        {/* Render Text Boxes */}
        {calculatedTextBoxPositions.map((pos, i) => (
          <div
            key={`text-${i}`}
            className={`text-box absolute p-10 pl-12 text-white w-[200px] min-h-[100px] overflow-y-auto transition-all duration-500 cursor-pointer ${i === step ? 'illuminated' : 'opacity-50 floating-animation'}`}
            style={{ 
              left: pos.left, 
              top: pos.top,
              backgroundImage: "url('/waterfall.png')",
              backgroundSize: '100% 100%', // Stretch vertically to fit content
              backgroundPosition: 'center',
              backgroundBlendMode: 'soft-light',
              height: 'auto', // Allow height to adjust based on content
              minHeight: '200px', // Minimum height
            }}
            onClick={() => handleLeafClick(i)}
          >
            <p className="font-mono text-xs mb-1 whitespace-normal break-words text-shadow py-0">{leafData[i].year}</p>
            <h4 className="font-bold text-sm mb-1 whitespace-normal break-words text-shadow pt-2">{leafData[i].title}</h4>
            <p className="text-xs whitespace-normal break-words overflow-hidden text-shadow">{leafData[i].text}</p>
          </div>
        ))}

        {/* Render Frog with high z-index */}
        <motion.div
          className="absolute z-[100]" // Very high z-index
          style={{ pointerEvents: 'none' }} 
          animate={controls}
        >
          <div className="frog-glow">
            <Image 
              src="/frog.png" 
              alt="frog" 
              width={80} 
              height={80} 
              priority  // Ensures the image loads with high priority
            />
          </div>
        </motion.div>
      </div>
      
      {/* Wait Message */}
      {showWaitMessage && (
        <div className="wait-message">
          Please wait until the frog finishes hopping!
        </div>
      )}
     </div>
  );
}