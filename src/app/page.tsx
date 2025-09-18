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
  const rotationRef = useRef(0);

  const segments = [
    <div className="intro-section z-20 max-w-[40%] mx-auto px-[30%] border-l-20 border-transparent pl-60" key="intro">
    <div className="intro-text">
      <h1 className="intro-title">Hi <span className="text-sm align-bottom italic font-normal">drag me 👉 </span></h1>
      <h1> I&apos;m <span className="text-yellow-500">Janys</span> (Jiayang) Li</h1>
      {/* <hr className="intro-divider" /> */}
      <p className="intro-subtitle text-sm font-normal">
        MS Data Science @ <span style={{ color: "#FF7237", fontWeight: "bold" }}>Harvard</span> <br />
        Stats &amp; Cogsci @ <span style={{ color: "#7EC8F3", fontWeight: "bold" }}>UCLA</span>
      </p>
      <p className="intro-description italic font-normal">- Inspecting questions with <span className="text-pink-400">Data Science</span>,<br/>
      - building solutions with <span className="text-pink-400">AI</span>,<br/>
      - Understanding human behavior with <span className="text-pink-400">Psychology</span>.</p>
    </div>
</div>,

<div>
  <h1>🔧 My Skillset</h1>
  <p className = "intro-subtitle text-sm font-normal">
    - <span className="text-pink-400">Programming: </span>Python, R, SQL, C++, HTML, CSS, React <br/>
    - <span className="text-purple-400">Data Processing & Visualization: </span>Excel, Databricks, Tableau, Power BI <br/>
    - <span className="text-green-400">Machine Learning: </span>PyTorch, TensorFlow <br/>
    - <span className="text-blue-400">User Experience: </span>Figma, A/B Testing
    </p>
</div>,
<div>
<h1>❓ Where to find me</h1>
  <p className = "intro-subtitle text-sm font-normal">
    - <span className="text-yellow-400">Email: </span>janysli@g.harvard.edu<br/>
    - <span className="text-cyan-400">Location: </span>Boston, MA <br/>
    - <span className="text-emerald-400">If you can't find me, I'm probably: </span>🏂 On mountains or 🧗‍♀️ on walls<br/>
    </p>
</div>,
<div>
<h1 className="text-2xl">This site was built with...</h1>
  <p className = "intro-subtitle text-sm font-normal">
    - Interactive website with <span className="text-orange-400">Cursor</span>!<br/>
    - Beautiful styling with <span className="text-blue-400">Tailwind CSS</span>!<br/>
    - Smooth animations with <span className="text-red-400">GSAP</span>!<br/>
    </p>
    <div className="tech-logos-container">
      <img src="https://cdn.freelogovectors.net/wp-content/uploads/2025/06/cursor-logo-freelogovectors.net_.png" alt="Cursor Logo" className="tech-logo" />
      <img src="https://cdn.worldvectorlogo.com/logos/tailwind-css-1.svg" alt="Tailwind CSS Logo" className="tech-logo" />
      <img src="https://miro.medium.com/1*CPF3XWLLwtr43AU37kQwrA.jpeg" alt="GSAP Logo" className="tech-logo" />
      <img src="https://www.freelogovectors.net/wp-content/uploads/2023/09/next-js-logo-freelogovectors.net_.png" alt="Next.js Logo" className="tech-logo" />
      <img src="https://www.freelogovectors.net/wp-content/uploads/2023/02/react-logo-freelogovectors.net_.png" alt="React Logo" className="tech-logo" />
      <img src="https://global.discourse-cdn.com/sitepoint/original/3X/b/5/b59a78e2ed76c705f3c0dcb300f3f222aefdcd99.png" alt="TypeScript Logo" className="tech-logo" />
    </div>
</div>,
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
      
      // Create draggable functionality
      const draggableInstance = Draggable.create(proxy, {
        type: "x",
        trigger: triggerRef.current,
        onDrag: function() {
          // Calculate rotation based on drag distance from the starting position
          // Use the initial rotation as the base and add the drag delta
          const dragDelta = this.x;
          const currentRotation = rotationRef.current - (dragDelta * 0.1);
          
          // Apply rotation to the cylinder
          gsap.set(cylinderRef.current, { rotationY: currentRotation });
        },
        onDragEnd: function() {
          // Update the stored rotation state when drag ends
          const dragDelta = this.x;
          const currentRotation = rotationRef.current - (dragDelta * 0.1);
          setRotation(currentRotation);
          rotationRef.current = currentRotation;
          
          // Reset the proxy position for the next drag
          gsap.set(proxy, { x: 0 });
        }
      });
      
      // Apply initial rotation
      gsap.set(cylinderRef.current, { rotationY: rotation });
      
      // Cleanup function to kill the draggable instance
      return () => {
        if (draggableInstance && draggableInstance[0]) {
          draggableInstance[0].kill();
        }
      };
    }
  }, []); // Remove rotation from dependencies to prevent recreation

  // Separate effect to handle rotation updates
  useEffect(() => {
    if (cylinderRef.current) {
      gsap.set(cylinderRef.current, { rotationY: rotation });
      rotationRef.current = rotation;
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
