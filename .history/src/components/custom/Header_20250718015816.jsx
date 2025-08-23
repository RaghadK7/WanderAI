import React, { useEffect } from 'react'
import { Button } from '../ui/button'

function Header() {

  const users= localStorage.getItem('users') 

  useEffect(() => {
    console.log(user)
  },[])
  return (
    <>
      <style jsx>{`
        .header-container {
          position: relative;
          background: white;
          overflow: hidden;
          z-index: 1;
        }

        .sunbeams-effect {
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          pointer-events: none;
          z-index: -1;
        }

        .sunrise-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 0, 0.9) 0%,
            rgba(255, 250, 50, 0.7) 25%,
            rgba(255, 245, 100, 0.5) 50%,
            rgba(255, 240, 150, 0.3) 75%,
            transparent 100%
          );
          transform: translate(-50%, -50%);
          border-radius: 50%;
          animation: sunriseGlow 6s ease-in-out infinite;
        }

        @keyframes sunriseGlow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.9;
            box-shadow: 
              0 0 50px rgba(255, 255, 0, 0.8),
              0 0 100px rgba(255, 250, 50, 0.6),
              0 0 150px rgba(255, 245, 100, 0.4),
              0 0 200px rgba(255, 240, 150, 0.2);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 1;
            box-shadow: 
              0 0 70px rgba(255, 255, 0, 1),
              0 0 140px rgba(255, 250, 50, 0.8),
              0 0 210px rgba(255, 245, 100, 0.6),
              0 0 280px rgba(255, 240, 150, 0.4);
          }
        }

        .sunrise-outer {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 350px;
          height: 350px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 0, 0.4) 0%,
            rgba(255, 250, 50, 0.3) 30%,
            rgba(255, 245, 100, 0.2) 60%,
            rgba(255, 240, 150, 0.1) 80%,
            transparent 100%
          );
          transform: translate(-50%, -50%);
          border-radius: 50%;
          animation: outerGlow 8s ease-in-out infinite;
        }

        @keyframes outerGlow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.8;
          }
        }

        .header-logo {
          position: relative;
          z-index: 10;
        }

        .header-container > div:last-child {
          position: relative;
          z-index: 10;
          margin-right: 20px;
        }

        .header-container button {
          position: relative;
          z-index: 10;
        }

        @media (max-width: 768px) {
          .sunbeams-effect {
            width: 200px;
            height: 200px;
            top: -60px;
            right: -60px;
          }
          
          .sunrise-glow {
            width: 150px;
            height: 150px;
          }
          
          .sunrise-outer {
            width: 200px;
            height: 200px;
          }
        }

        @media (max-width: 480px) {
          .sunbeams-effect {
            width: 150px;
            height: 150px;
            top: -40px;
            right: -40px;
          }
          
          .sunrise-glow {
            width: 100px;
            height: 100px;
          }
          
          .sunrise-outer {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>

      <div className='header-container p-2 shadow-sm flex justify-between items-center px-5'>
        {/* sun effect*/}
        <div className="sunbeams-effect">
          <div className="sunrise-outer"></div>
          <div className="sunrise-glow"></div>
        </div>
        
        <img src="/logo.svg" alt="WanderAI Logo" className="header-logo" />
        
        <div>
          <button>Sign In</button>
        </div>
      </div>
    </>
  )
}

export default Header