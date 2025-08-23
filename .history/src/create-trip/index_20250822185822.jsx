import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AI_PROMPT, SelectBudgetOptions, SelectTravelesList } from '@/constants/options';
import { chatSession } from '@/service/AIModal';
import React, { useEffect, useState } from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import { toast } from 'sonner';
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/service/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function CreateTrip() {
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState({
    location: null,
    noOfDays: '',
    budget: '',
    traveler: ''
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Email auth states
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });

  const navigate = useNavigate();
  
  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleAuthInputChange = (field, value) => {
    setAuthData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    console.log(formData);
  }, [formData])

  const login = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: (error) => console.log(error)
  })

  // Email Authentication
  const handleEmailAuth = async () => {
    if (!authData.email || !authData.password) {
      toast.error('Please fill all fields');
      return;
    }

    setAuthLoading(true);
    try {
      let userCredential;
      
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, authData.email, authData.password);
        toast.success('Welcome back!');
      } else {
        if (!authData.name) {
          toast.error('Name is required for registration');
          setAuthLoading(false);
          return;
        }
        userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
        await updateProfile(userCredential.user, { displayName: authData.name });
        toast.success('Account created successfully!');
      }

      const user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || authData.name
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      setOpenDialog(false);
      OnGenerateTrip();
      
    } catch (error) {
      const errorCodes = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address'
      };
      toast.error(errorCodes[error.code] || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const OnGenerateTrip = async () => {
    const user = localStorage.getItem('user');

    if (!user) {
      setOpenDialog(true)
      return;
    }

    if (!formData?.location || !formData?.noOfDays || !formData?.budget || !formData?.traveler) {
      toast("Please fill all details")
      return;
    }
    
    setLoading(true);
    toast('Please wait... We are working on it...')
    const FINAL_PROMPT = AI_PROMPT
      .replace('{location}', formData?.location?.label)
      .replace('{totalDays}', formData?.noOfDays)
      .replace('{traveler}', formData?.traveler)
      .replace('{budget}', formData?.budget)
      .replace('{totalDays}', formData?.noOfDays)
    
    const result = await chatSession.sendMessage(FINAL_PROMPT);
    console.log("--", result?.response?.text());
    setLoading(false);
    SaveAiTrip(result?.response?.text())
  }

  const SaveAiTrip = async (TripData) => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user'));
    const docId = Date.now().toString()

    await setDoc(doc(db, "AITrips", docId), {
      userSelection: formData,
      tripData: JSON.parse(TripData),
      userEmail: user?.email,
      id: docId
    });
    setLoading(false);
    navigate('/view-trip/'+docId)
  }

  const GetUserProfile = (tokenInfo) => {
    axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokenInfo?.access_token}`,
        Accept: 'Application/json'
      }
    }).then((resp) => {
      console.log(resp);
      localStorage.setItem('user', JSON.stringify(resp.data));
      setOpenDialog(false);
      OnGenerateTrip();
    })
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
      {/* Header */}
      <div className='text-center py-10'>
        <h1 className='text-5xl font-bold mb-3'>
          <span className='bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
            Share your travel preferences
          </span>
          <span className='text-4xl ml-3'>🗺️</span>
        </h1>
        <p className='text-xl text-gray-600'>
          Let us create your dream journey with our AI-powered planner ✈️
        </p>
      </div>

      {/* Hero Image */}
      <div className='flex justify-center mb-10'>
        <img src="/travel-hero.png" alt="Travel" className='w-96 h-64 object-contain' />
      </div>

      {/* Form Container */}
      <div className='max-w-3xl mx-auto px-6 pb-20'>
        {/* Destination */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-blue-600 mb-3'>Select Destination</h2>
          <GooglePlacesAutocomplete
            apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
            selectProps={{
              place,
              onChange: (v) => { setPlace(v); handleInputChange('location', v) },
              placeholder: 'London, UK',
              styles: {
                control: (provided) => ({
                  ...provided,
                  padding: '6px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '16px',
                  boxShadow: 'none',
                  '&:hover': {
                    border: '1px solid #3b82f6'
                  }
                })
              }
            }}
          />
        </div>

        {/* Duration */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-blue-600 mb-3'>Trip Duration (1-15 days)</h2>
          <Input 
            placeholder='1' 
            type="number"
            min="1"
            max="15"
            value={formData.noOfDays}
            onChange={(e) => handleInputChange('noOfDays', e.target.value)}
            className='w-full p-3 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none'
          />
          {formData.noOfDays && (
            <p className='text-sm text-green-500 mt-1'>✓ {formData.noOfDays} day{formData.noOfDays > 1 ? 's' : ''} selected</p>
          )}
        </div>

        {/* Budget */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-blue-600 mb-4'>Budget Preference</h2>
          <div className='grid grid-cols-3 gap-4'>
            {SelectBudgetOptions.map((item) => (
              <div
                key={item.title}
                onClick={() => handleInputChange('budget', item.title)}
                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg
                  ${formData?.budget === item.title 
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                {formData?.budget === item.title && (
                  <div className='absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center'>
                    <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                )}
                <div className='text-center'>
                  <div className='text-3xl mb-3'>{item.icon}</div>
                  <h3 className='font-bold text-lg mb-1'>{item.title}</h3>
                  <p className='text-sm text-gray-600'>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Travel Companions */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-blue-600 mb-4'>Travel Companions</h2>
          <div className='grid grid-cols-2 gap-4'>
            {SelectTravelesList.map((item) => (
              <div
                key={item.people}
                onClick={() => handleInputChange('traveler', item.people)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center
                  ${formData?.traveler === item.people 
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                {formData?.traveler === item.people && (
                  <div className='absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center'>
                    <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                )}
                <div className='text-3xl mr-4'>{item.icon}</div>
                <div>
                  <h3 className='font-bold text-lg'>{item.title}</h3>
                  <p className='text-sm text-gray-600'>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className='flex justify-center'>
          <Button
            disabled={loading}
            onClick={OnGenerateTrip}
            className='px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg font-semibold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? (
              <>
                <AiOutlineLoading3Quarters className='mr-2 h-5 w-5 animate-spin' />
                Generating...
              </>
            ) : (
              <>✨ Generate My Trip</>
            )}
          </Button>
        </div>
      </div>

      {/* Auth Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-center text-2xl font-bold'>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </DialogTitle>
            <DialogDescription className='text-center text-gray-600'>
              {isLogin ? 'Sign in to plan your trip' : 'Join us to start your journey'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 mt-4'>
            {!isLogin && (
              <Input
                type="text"
                placeholder="Full Name"
                value={authData.name}
                onChange={(e) => handleAuthInputChange('name', e.target.value)}
                className='w-full p-3 rounded-lg'
              />
            )}
            
            <Input
              type="email"
              placeholder="Email"
              value={authData.email}
              onChange={(e) => handleAuthInputChange('email', e.target.value)}
              className='w-full p-3 rounded-lg'
            />
            
            <Input
              type="password"
              placeholder="Password"
              value={authData.password}
              onChange={(e) => handleAuthInputChange('password', e.target.value)}
              className='w-full p-3 rounded-lg'
            />

            <Button
              onClick={handleEmailAuth}
              disabled={authLoading}
              className='w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg'
            >
              {authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-white px-2 text-gray-500'>Or</span>
              </div>
            </div>

            <Button
              onClick={login}
              className='w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center gap-3'
            >
              <FcGoogle className='h-5 w-5' />
              Continue with Google
            </Button>

            <p className='text-center text-sm text-gray-600'>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className='text-blue-500 hover:underline font-semibold'
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateTrip