"use client";

import Image from "next/image";
import FrogHop from "@/components/frogHop";
import SocialPanel from "@/components/SocialPanel";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/dist/Draggable";

export default function Home() {
  const cylinderRef = useRef(null);
  const triggerRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  const segments = [
    <div className="intro-section z-20" key="intro">
    <div className="intro-text">
      <h1 className="intro-title">Hi <span className="text-sm align-bottom italic bg-gray-700 font-normal">(drag me)</span></h1>
      <h1> I&apos;m <span className="text-yellow-500">Janys</span> (Jiayang) Li</h1>
      {/* <hr className="intro-divider" /> */}
      <p className="intro-subtitle text-sm font-normal">
        MS Data Science @ <span style={{ color: "#A51C30" }}>Harvard</span> <br />
        Stats &amp; Cogsci @ <span style={{ color: "#2774AE" }}>UCLA</span>
      </p>
      <p className="intro-description italic font-normal">- Inspecting data with <span className="text-pink-400">Data Science</span>,<br/>- building solutions with <span className="text-pink-400">AI</span>.</p>
    </div>
</div>,

<div>Coming Soon</div>,
<div>Coming Soon</div>,
<div>Coming Soon</div>,
    <div className="profile-image-container" key="profile">
    <div className="profile-image-wrapper">
      <Image 
        src="/profile_pic.jpeg" 
        alt="Janys Li" 
        width={256} 
        height={256} 
        className="profile-image"
      />
    </div>
  </div>,
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(Draggable);
      
      // Create a proxy object that we'll use with the Draggable
      const proxy = document.createElement("div");
      gsap.set(proxy, { x: 0 });
      
      // Initialize rotation value
      let currentRotation = rotation;
      
      // Create draggable functionality
      Draggable.create(proxy, {
        type: "x",
        trigger: triggerRef.current,
        onDrag: function() {
          // Calculate rotation based on drag distance (adjust sensitivity as needed)
          // Reduced sensitivity from 0.2 to 0.05 to make dragging slower
          currentRotation = rotation - (this.x * 0.1);
          
          // Apply rotation to the cylinder
          gsap.set(cylinderRef.current, { rotationY: currentRotation });
        },
        onDragEnd: function() {
          // Update the stored rotation state when drag ends
          setRotation(currentRotation);
        }
      });
      
      // Apply initial rotation
      gsap.set(cylinderRef.current, { rotationY: rotation });
    }
  }, [rotation]);

  return (
    <main>
      <div className="scene-wrapper" ref={triggerRef}>
        <div className="scene">
          <div className="cylinder" ref={cylinderRef}>
            {segments.map((component, index) => {
              const angle = (360 / segments.length) * index;
              const radius = 600; // Larger radius for inside view
              return (
                <div
                  key={index}
                  className="wall-segment"
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(-${radius}px)`, // Negative translateZ for inside view
                  }}
                >
                  {component}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Blue oval in background */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[40%] w-[150vw] h-[80vh] bg-[#1b4956] opacity-30 z-0"
        style={{ borderRadius: "50% / 25%" }}
      ></div>
      
      <div className="background-circle-container">
        <div className="background-circle"></div>
      </div>
      
      {/* Frog component with CSS to fix pointer events */}
      <div className="absolute inset-0 z-10 frog-container">
        <FrogHop />
      </div>

      {/* Social Media Panel */}
      <SocialPanel />

    </main>
  );
}
