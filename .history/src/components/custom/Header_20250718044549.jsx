import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { FcGoogle } from "react-icons/fc"
import { useGoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'

function Header() {
  const [user, setUser] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)

  useEffect(() => {
    // قراءة المستخدم من localStorage
    const userData = localStorage.getItem('user')
    
    if (userData && userData !== 'null') {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        console.log('User logged in:', parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/' // العودة للصفحة الرئيسية
  }

  // Google Login Setup
  const login = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: () => toast.error('Google login failed.')
  })

  // Gets user info from Google after login
  const GetUserProfile = (tokenInfo) => {
    fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokenInfo?.access_token}`,
        Accept: 'application/json'
      }
    })
    .then(response => response.json())
    .then((resp) => {
      toast.success(`Welcome ${resp.name}!`)
      localStorage.setItem('user', JSON.stringify(resp)) // Save user info
      setUser(resp) // Update state immediately
      setOpenDialog(false) // Close login popup
    })
    .catch(() => {
      toast.error("Profile access denied")
    })
  }

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

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #667eea;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .user-name {
          font-weight: 700;
          color: #1f2937;
          font-size: 16px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          letter-spacing: 0.3px;
        }

        .logout-btn {
          background: linear-gradient(135deg, #87CEEB 0%, #5DADE2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(135, 206, 235, 0.4);
          text-transform: none;
          letter-spacing: 0.3px;
          min-width: 120px;
        }

        .logout-btn:hover {
          background: linear-gradient(135deg, #7FC8E8 0%, #4A9FDC 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(135, 206, 235, 0.6);
        }

        .signin-btn {
          background: linear-gradient(135deg, #87CEEB 0%, #5DADE2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(135, 206, 235, 0.4);
          text-transform: none;
          letter-spacing: 0.3px;
          min-width: 120px;
        }

        .my-trips-btn {
          background: linear-gradient(135deg, #87CEEB 0%, #5DADE2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(135, 206, 235, 0.4);
          text-transform: none;
          letter-spacing: 0.3px;
          min-width: 120px;
        }

        .my-trips-btn:hover {
          background: linear-gradient(135deg, #7FC8E8 0%, #4A9FDC 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(135, 206, 235, 0.6);
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

          .user-name {
            display: none;
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
        
        <img 
          src="/logo.svg" 
          alt="WanderAI Logo" 
          className="header-logo" 
          onClick={() => window.location.href = '/'}
          style={{ cursor: 'pointer' }}
        />
        
        <div>
          {user ? (
            <div className="user-info">
              <img 
                src={user.picture || '/default-avatar.png'} 
                alt={user.name} 
                className="user-avatar"
              />
              <span className="user-name">Welcome, {user.name}</span>
              
              <button 
                onClick={() => window.location.href = '/my-trips'}
                className="my-trips-btn"
              >
                My Trips
              </button>
              
              <button 
                onClick={handleLogout}
                className="logout-btn"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setOpenDialog(true)}
              className="signin-btn"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Login Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="dialog-content">
            <DialogHeader>
              <div className="dialog-header-content">
                <img src="/logo.svg" alt="Logo" className="dialog-logo" />
                <div className="dialog-text">
                  <h2 className="dialog-title">Sign In With Google</h2>
                  <p className="dialog-description">
                    Sign in to access your travel plans and create new trips
                  </p>
                </div>
                <Button onClick={() => login()} className="google-signin-button">
                  <FcGoogle className="google-icon" />
                  <span>Sign in with Google</span>
                </Button>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

export default Header