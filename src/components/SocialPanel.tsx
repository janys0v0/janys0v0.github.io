"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SocialIconProps {
  href: string;
  iconUrl: string;
  tooltip: string;
  onClick?: () => void;
}

function SocialIcon({ href, iconUrl, tooltip, onClick }: SocialIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative">
      <button
        className="social-icon"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <img 
          src={iconUrl} 
          alt={tooltip}
          className="w-5 h-5 filter brightness-0 invert"
        />
      </button>
      
      {showTooltip && (
        <div className="social-tooltip">
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default function SocialPanel() {
  const [showPortfolio, setShowPortfolio] = useState(false);
  const router = useRouter();

  const handlePortfolioClick = () => {
    setShowPortfolio(true);
  };

  const closePortfolio = () => {
    setShowPortfolio(false);
  };

  const handleIndochinaClick = () => {
    router.push('/portfolio/indochina-starfish');
  };

  return (
    <>
      {/* Social Media Panel */}
      <div className="social-panel">
        <div className="social-panel-container">
          <div className="flex items-center space-x-4">
            <SocialIcon
              href="https://linkedin.com/in/janys-li"
              iconUrl="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg"
              tooltip="LinkedIn"
            />
            <SocialIcon
              href="https://github.com/janys0v0"
              iconUrl="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg"
              tooltip="GitHub"
            />
            <SocialIcon
              href="#"
              iconUrl="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/portfolio.svg"
              tooltip="Portfolio"
              onClick={handlePortfolioClick}
            />
          </div>
        </div>
      </div>

      {/* Portfolio Popup Modal */}
      {showPortfolio && (
        <div 
          className="portfolio-modal"
          onClick={closePortfolio}
        >
          <div 
            className="portfolio-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePortfolio}
              className="portfolio-close"
            >
              ✕
            </button>
            
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Selected Projects</h3>
              <p className="text-gray-300 text-sm">
                Product Management & User Research
              </p>
            </div>

            {/* Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Project 1 */}
              <div className="project-card">
                <div className="project-image-container">
                  <img 
                    src="/ISF photo.png" 
                    alt="Project 1" 
                    className="project-image"
                  />
                </div>
                <div className="project-info">
                  <h4 className="project-title">Develop for Good</h4>
                  <p className="project-subtitle">
                    Centralized Data Management System for <span className="text-pink-400">Indochina Starfish Foundation</span>
                  </p>
                  <button 
                    className="project-button bg-blue-600 hover:bg-blue-700"
                    onClick={handleIndochinaClick}
                  >
                    Learn More
                  </button>
                </div>
              </div>

              {/* Project 2 */}
              <div className="project-card">
                <div className="project-image-container">
                  <img 
                    src="/emo_compass.png" 
                    alt="Project 2" 
                    className="project-image"
                  />
                </div>
                <div className="project-info">
                  <h4 className="project-title">ACME Lab @ UCLA</h4>
                  <p className="project-subtitle">Mobile App for tracking <span className="text-pink-400">emotional flexibility</span></p>
                  <button 
                    className="project-button"
                    onClick={(e) => e.preventDefault()}
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
