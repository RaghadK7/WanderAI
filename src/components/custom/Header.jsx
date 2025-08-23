import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import './Header.css' 

function Header() {
  const [user, setUser] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData && userData !== 'null') {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('user')
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('AITrip_')) {
          localStorage.removeItem(key)
        }
      })
      setUser(null)
      toast.success('Logged out successfully')
      setTimeout(() => window.location.href = '/', 1000)
    } catch (error) {
      localStorage.clear()
      setUser(null)
      window.location.href = '/'
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: () => toast.error('Google login failed.')
  })

  const GetUserProfile = (tokenInfo) => {
    setAuthLoading(true)
    fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokenInfo?.access_token}`,
        Accept: 'application/json'
      }
    })
    .then(response => response.json())
    .then((resp) => {
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
      setAuthData({ email: '', password: '', name: '' })
    })
    .catch(() => toast.error("Profile access denied"))
    .finally(() => setAuthLoading(false))
  }

  const handleAuthInputChange = (field, value) => {
    setAuthData(prev => ({ ...prev, [field]: value }))
  }

  const handleEmailAuth = async () => {
    if (!authData.email || !authData.password) {
      toast.error('Please fill all fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(authData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (authData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setAuthLoading(true)
    
    try {
      let userCredential
      
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, authData.email, authData.password)
        toast.success('Welcome back!')
      } else {
        if (!authData.name || authData.name.trim().length < 2) {
          toast.error('Please enter a valid name')
          setAuthLoading(false)
          return
        }
        
        userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password)
        await updateProfile(userCredential.user, {
          displayName: authData.name.trim()
        })
        toast.success('Account created successfully!')
      }

      const user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || authData.name.trim(),
        picture: userCredential.user.photoURL || null
      }
      
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      setOpenDialog(false)
      setAuthData({ email: '', password: '', name: '' })
      
    } catch (error) {
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'This email is already registered',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.'
      }
      
      toast.error(errorMessages[error.code] || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const getUserDisplayName = () => {
    if (!user) return ''
    return user.name || user.displayName || user.email?.split('@')[0] || 'User'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className='header-container'>
      <div className="sunbeams-effect">
        <div className="sunrise-outer"></div>
        <div className="sunrise-glow"></div>
      </div>
      
      <img 
        src="/logo.svg" 
        alt="WanderAI Logo" 
        className="header-logo" 
        onClick={() => window.location.href = '/'}
      />
      
      <div>
        {user ? (
          <div className="user-info">
            {user.picture ? (
              <img src={user.picture} alt={getUserDisplayName()} className="user-avatar" />
            ) : (
              <div className="user-avatar-initials">{getUserInitials()}</div>
            )}
            
            <span className="user-name">Welcome, {getUserDisplayName()}</span>
            
            <button 
              onClick={() => window.location.href = '/my-trips'}
              className="my-trips-btn"
            >
              My Trips
            </button>
            
            <button onClick={handleLogout} className="logout-btn">
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={() => setOpenDialog(true)} className="signin-btn">
            Sign In
          </button>
        )}
      </div>

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

          <div className="auth-form">
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

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={authData.email}
                onChange={(e) => handleAuthInputChange('email', e.target.value)}
              />
            </div>

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

            <button
              onClick={handleEmailAuth}
              disabled={authLoading}
              className="auth-submit-btn"
            >
              {authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
          </div>

          <button
            onClick={() => googleLogin()}
            disabled={authLoading}
            className="google-signin-button"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <div className="toggle-auth">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setAuthData({ email: '', password: '', name: '' })
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Header