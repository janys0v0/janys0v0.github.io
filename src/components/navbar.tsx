'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';

interface ClonedItemDetails {
  text: string;
  color: string;
  top: number; // To store vertical position
}

// Define animation states
type AnimationPhase = 'idle' | 'sliding-in' | 'fading-out';

const MIN_HOLD_DURATION_MS = 1000; // Minimum 1 second hold from start of slide-in
const SLIDE_IN_DURATION_MS = 500;
const FADE_OUT_DURATION_MS = 500;

// Add constants for minimum spacing
const MIN_LEAF_SPACING = 250; // Minimum pixels between leaf centers
const MIN_SCREEN_WIDTH = 120; // Reference width for ideal spacing

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [shakingLink, setShakingLink] = useState<string | null>(null);
  const [clonedItemDetails, setClonedItemDetails] = useState<ClonedItemDetails | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null); // Track target URL
  const [slideInStartTime, setSlideInStartTime] = useState<number | null>(null); // Track start time

  // Refs for each link to get position
  const linkRefs = {
    '/': useRef<HTMLAnchorElement>(null),
    '/projects': useRef<HTMLAnchorElement>(null),
    '/lamb': useRef<HTMLAnchorElement>(null),
    '/interests': useRef<HTMLAnchorElement>(null),
  };

  // Wrap triggerFadeOut in useCallback
  const triggerFadeOut = useCallback(() => {
    setAnimationPhase('fading-out');
    // Reset fully after fade-out animation
    setTimeout(() => {
      setAnimationPhase('idle');
      setClonedItemDetails(null);
      setNavigatingTo(null);
      setSlideInStartTime(null);
    }, FADE_OUT_DURATION_MS);
  }, []); // No dependencies needed for setters

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (animationPhase !== 'idle' || shakingLink) return;

    if (href === pathname) {
      setShakingLink(href);
      setTimeout(() => setShakingLink(null), 500);
    } else {
      const currentLinkRef = linkRefs[href as keyof typeof linkRefs]?.current;
      if (currentLinkRef) {
        const rect = currentLinkRef.getBoundingClientRect(); // Get viewport-relative coordinates
        setClonedItemDetails({
          text: currentLinkRef.innerText,
          color: currentLinkRef.style.getPropertyValue('--hover-color'),
          top: rect.top, // Use rect.top for viewport-relative Y coordinate
        });
      }
      setNavigatingTo(href);
      setSlideInStartTime(Date.now()); // Record start time
      setAnimationPhase('sliding-in');

      // After slide-in animation, navigate
      setTimeout(() => {
        router.push(href);
      }, SLIDE_IN_DURATION_MS);
    }
  };

  // Effect to handle fade-out after navigation and minimum hold time
  useEffect(() => {
    if (
      animationPhase === 'sliding-in' &&
      navigatingTo === pathname &&
      slideInStartTime !== null
    ) {
      const timeElapsed = Date.now() - slideInStartTime;

      if (timeElapsed >= MIN_HOLD_DURATION_MS) {
        // Minimum hold met, fade out immediately
        triggerFadeOut();
      } else {
        // Minimum hold not met, schedule fade out
        const delay = MIN_HOLD_DURATION_MS - timeElapsed;
        setTimeout(triggerFadeOut, delay);
      }
    }
  }, [pathname, animationPhase, navigatingTo, slideInStartTime, triggerFadeOut]); // Include all dependencies

  const linkClassName = (href: string) => 
    `arrow-box flex items-center justify-left glow-text text-lg font-bold uppercase ${shakingLink === href ? 'shake' : ''}`; 

  const getAnimationClass = () => {
    if (animationPhase === 'sliding-in') return 'sliding-in';
    if (animationPhase === 'fading-out') return 'fading-out';
    return '';
  };

  return (
    <>
      
      <nav className="fixed right-0 top-0 h-full flex flex-col justify-center items-end space-y-6 z-50 pr-0">
        <Link 
          ref={linkRefs['/']} // Assign ref
          href="/"
          onClick={(e) => handleClick(e, '/')}
          className={linkClassName('/')} 
          style={{ '--hover-color': '#8ff' } as React.CSSProperties}
        >
          Home
        </Link>
        {/* <Link 
          ref={linkRefs['/projects']} // Assign ref
          href="/projects" 
          onClick={(e) => handleClick(e, '/projects')}
          className={linkClassName('/projects')} 
          style={{ '--hover-color': '#ee8' } as React.CSSProperties}
        >
          Projects
        </Link> */}
        {/* <Link 
          ref={linkRefs['/learn']} // Assign ref
          href="/learn" 
          onClick={(e) => handleClick(e, '/learn')}
          className={linkClassName('/learn')} 
          style={{ '--hover-color': '#f8f' } as React.CSSProperties}
        >
          Learn
        </Link> */}
        <Link 
          ref={linkRefs['/interests']} // Assign ref
          href="/interests" 
          onClick={(e) => handleClick(e, '/interests')}
          className={linkClassName('/interests')} 
          style={{ '--hover-color': '#caf' } as React.CSSProperties}
        >
          Interests
        </Link>
        <Link 
          ref={linkRefs['/lamb']} // Assign ref
          href="/lamb" 
          onClick={(e) => handleClick(e, '/lamb')}
          className={linkClassName('/lamb')} 
          style={{ '--hover-color': '#f8f' } as React.CSSProperties}
        >
          Meet the Lamb
        </Link>
      </nav>
      
      {/* Page Transition Overlay */}
      <div 
        className={`page-transition-overlay ${getAnimationClass()}`}
      />

      {/* Clone Element */}
      {clonedItemDetails && animationPhase !== 'idle' && (
        <div
          className={`page-transition-clone arrow-box flex items-center justify-left glow-text text-lg font-bold uppercase ${getAnimationClass()}`}
          style={{
            '--color': clonedItemDetails.color,
            '--hover-color': clonedItemDetails.color,
            top: `${clonedItemDetails.top}px`,
          } as React.CSSProperties}
        >
          {clonedItemDetails.text}
        </div>
      )}
    </>
  );
}
