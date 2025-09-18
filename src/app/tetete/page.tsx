"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/dist/Draggable";


export default function TestPage() {
  const cylinderRef = useRef(null);
  const triggerRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  const segments = [
    <div className="segment">
      <h2>About Me</h2>
      <p>I'm a software engineer with a passion for building scalable and efficient systems.</p>
    </div>,
    <div className="segment">
      <h2>Experience</h2>
      <p>I've worked on a variety of projects, from small startups to large corporations.</p>
    </div>,
    <div className="segment">
      <h2>Skills</h2>
      <p>I'm proficient in a variety of programming languages and technologies.</p>
    </div>,
    <div className="segment"></div>
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
    <>
      <style jsx>{`
        .scene-wrapper {
          height: 100vh;
          background: #311;
          cursor: grab;
          width: 100%;
          overflow: hidden;
        }
        
        .scene-wrapper:active {
          cursor: grabbing;
        }

        .scene {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100vw;
          perspective: 1000px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .cylinder {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transform-origin: center center;
        }

        .wall-segment {
          position: absolute;
          width: 300px;
          height: 300px;
          left: 50%;
          top: 50%;
          margin-left: -150px;
          margin-top: -150px;
          background-size: cover;
          background-position: center;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          border-radius: 8px;
          backface-visibility: hidden;
          transform-style: preserve-3d;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }

        .segment {
          padding: 20px;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        h2 {
          margin-bottom: 15px;
          font-size: 1.8rem;
        }

        p {
          font-size: 1rem;
          font-weight: normal;
          line-height: 1.5;
        }
      `}</style>

      <div className="scene-wrapper" ref={triggerRef}>
        <div className="scene">
          <div className="cylinder" ref={cylinderRef}>
            {segments.map((component, index) => {
              const angle = (360 / segments.length) * index;
              const radius = 800; // Larger radius for inside view
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
    </>
  );
}