/**
 * Header Component - Navigation and Authentication
 * 
 * Features:
 * - Supports both Google and Email/Password authentication
 * - Responsive design with beautiful animations
 * - User profile display with avatar/initials
 * - Enhanced logout functionality
 */

import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button';
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { FcGoogle } from "react-icons/fc"
import { useGoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth'
import { auth } from '@/service/firebaseConfig'

/**
 * Main Header Component
 */
function Header() {
  // User and UI state
  const [user, setUser] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  
  // Authentication state
  const [isLogin, setIsLogin] = useState(true) // Toggle between login/register
  const [authLoading, setAuthLoading] = useState(false)
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: ''
  })

  /**
   * Check user authentication status on component mount
   * Works for both Google and Email/Password authentication
   */
  useEffect(() => {
    const userData = localStorage.getItem('user')
    
    if (userData && userData !== 'null') {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        console.log('User logged in:', parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        // Clean up corrupted data
        localStorage.removeItem('user')
      }
    }
  }, [])

  /**
   * Enhanced logout function
   * Handles both Google and Email/Password users
   * Clears all user data and redirects to home
   */
  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth (handles email/password users)
      await signOut(auth)
      
      // Clear user data from localStorage
      localStorage.removeItem('user')
      
      // Clear any cached trip data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('AITrip_')) {
          localStorage.removeItem(key)
        }
      })
      
      // Update component state
      setUser(null)
      
      // Show success message
      toast.success('Logged out successfully')
      
      // Redirect to home page
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
      
    } catch (error) {
      console.error('Logout error:', error)
      
      // Force logout even if Firebase signOut fails
      localStorage.clear()
      setUser(null)
      window.location.href = '/'
    }
  }

  /**
   * Google Login Configuration
   * Uses react-oauth/google library
   */
  const googleLogin = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: () => toast.error('Google login failed.')
  })

  /**
   * Handles Google authentication process
   * Fetches user profile and stores data
   */
  const GetUserProfile = (tokenInfo) => {
    setAuthLoading(true)
    
    // Fetch user profile from Google API
    fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokenInfo?.access_token}`,
        Accept: 'application/json'
      }
    })
    .then(response => response.json())
    .then((resp) => {
      // Create standardized user object
      const user = {
        uid: resp.id,
        email: resp.email,
        name: resp.name,
        picture: resp.picture
      }
      
      toast.success(`Welcome ${resp.name}!`)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      setOpenDialog(false)
      
      // Reset auth form
      setAuthData({ email: '', password: '', name: '' })
    })
    .catch(() => {
      toast.error("Profile access denied")
    })
    .finally(() => {
      setAuthLoading(false)
    })
  }

  /**
   * Updates authentication form data
   */
  const handleAuthInputChange = (field, value) => {
    setAuthData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  /**
   * Handles Email/Password Authentication
   * Supports both login and registration
   */
  const handleEmailAuth = async () => {
    // Basic validation
    if (!authData.email || !authData.password) {
      toast.error('Please fill all fields')
      return
    }

    setAuthLoading(true)
    try {
      let userCredential
      
      if (isLogin) {
        // Sign in with existing account
        userCredential = await signInWithEmailAndPassword(auth, authData.email, authData.password)
        toast.success('Welcome back!')
      } else {
        // Create new account
        if (!authData.name) {
          toast.error('Name is required for registration')
          setAuthLoading(false)
          return
        }
        
        // Create Firebase user account
        userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password)
        
        // Update user profile with display name
        await updateProfile(userCredential.user, {
          displayName: authData.name
        })
        
        toast.success('Account created successfully!')
      }

      // Create standardized user object
      const user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || authData.name,
        picture: userCredential.user.photoURL || null
      }
      
      // Save user data and update state
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      setOpenDialog(false)
      
      // Reset auth form
      setAuthData({ email: '', password: '', name: '' })
      
    } catch (error) {
      // Handle Firebase authentication errors
      let errorMessage = 'Authentication failed'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email'
          break
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password'
          break
        case 'auth/email-already-in-use':
          errorMessage = 'Email already registered'
          break
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address'
          break
      }
      
      toast.error(errorMessage)
    } finally {
      setAuthLoading(false)
    }
  }

  /**
   * Gets user display name with fallbacks
   */
  const getUserDisplayName = () => {
    if (!user) return ''
    if (user.name) return user.name
    if (user.displayName) return user.displayName
    return user.email?.split('@')[0] || 'User'
  }

  /**
   * Gets user initials for avatar
   */
  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

        .user-avatar-initials {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
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

        /* Authentication Dialog Styles */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: 20px 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .auth-submit-btn {
          background: linear-gradient(135deg, #87CEEB 0%, #5DADE2 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(135, 206, 235, 0.4);
          width: 100%;
        }

        .auth-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #7FC8E8 0%, #4A9FDC 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(135, 206, 235, 0.6);
        }

        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .google-signin-button {
          background: white;
          border: 2px solid #e5e7eb;
          color: #374151;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
        }

        .google-signin-button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .toggle-auth {
          text-align: center;
          margin-top: 20px;
          color: #6b7280;
        }

        .toggle-auth button {
          color: #87CEEB;
          background: none;
          border: none;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }

        .dialog-content {
          max-width: 400px;
          padding: 32px;
          border-radius: 20px;
        }

        .dialog-title {
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .dialog-description {
          text-align: center;
          color: #6b7280;
          margin-bottom: 24px;
        }

        /* Responsive Design */
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
        {/* Animated Sun Effect */}
        <div className="sunbeams-effect">
          <div className="sunrise-outer"></div>
          <div className="sunrise-glow"></div>
        </div>
        
        {/* Logo */}
        <img 
          src="/logo.svg" 
          alt="WanderAI Logo" 
          className="header-logo" 
          onClick={() => window.location.href = '/'}
          style={{ cursor: 'pointer' }}
        />
        
        {/* User Section */}
        <div>
          {user ? (
            <div className="user-info">
              {/* User Avatar */}
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={getUserDisplayName()} 
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-initials">
                  {getUserInitials()}
                </div>
              )}
              
              {/* Welcome Message */}
              <span className="user-name">Welcome, {getUserDisplayName()}</span>
              
              {/* My Trips Button */}
              <button 
                onClick={() => window.location.href = '/my-trips'}
                className="my-trips-btn"
              >
                My Trips
              </button>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="logout-btn"
              >
                Sign Out
              </button>
            </div>
          ) : (
            // Sign In Button for non-authenticated users
            <button 
              onClick={() => setOpenDialog(true)}
              className="signin-btn"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Enhanced Authentication Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="dialog-content">
            <DialogHeader>
              <div>
                <h2 className="dialog-title">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="dialog-description">
                  {isLogin ? 'Sign in to access your trips' : 'Join us to start planning'}
                </p>
              </div>
            </DialogHeader>

            {/* Email/Password Authentication Form */}
            <div className="auth-form">
              
              {/* Name Field - Only for registration */}
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={authData.name}
                    onChange={(e) => handleAuthInputChange('name', e.target.value)}
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={authData.email}
                  onChange={(e) => handleAuthInputChange('email', e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={authData.password}
                  onChange={(e) => handleAuthInputChange('password', e.target.value)}
                  minLength={6}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleEmailAuth}
                disabled={authLoading}
                className="auth-submit-btn"
              >
                {authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={() => googleLogin()}
              disabled={authLoading}
              className="google-signin-button"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>

            {/* Toggle Between Login/Register */}
            <div className="toggle-auth">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  // Reset form when switching modes
                  setAuthData({ email: '', password: '', name: '' })
                }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

export default Header