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
import './CreateTrip.css';

// Loading Overlay Component
const LoadingOverlay = ({ isVisible, message, subMessage }) => {
  if (!isVisible) return null;
  
  return (
    <div className="loading-overlay">
      <div className="loading-modal">
        <div className="loading-content">
          <div className="loading-icon-container">
            <AiOutlineLoading3Quarters className="loading-icon" />
            <div className="loading-ring"></div>
          </div>
          <div className="loading-text">
            <h3 className="loading-title">{message || 'Processing...'}</h3>
            {subMessage && <p className="loading-subtitle">{subMessage}</p>}
          </div>
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot" style={{ animationDelay: '0.1s' }}></div>
            <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });

  const navigate = useNavigate();

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAuthInputChange = (field, value) => {
    setAuthData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    console.log(formData);
  }, [formData]);

  const login = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: (error) => {
      console.log(error);
      toast.error('Google login failed');
    }
  });

  const validateForm = () => {
    const errors = [];
    if (!formData?.location) errors.push('Please select a destination');
    if (!formData?.noOfDays || formData?.noOfDays === '') errors.push('Please specify trip duration');
    if (!formData?.budget) errors.push('Please select your budget');
    if (!formData?.traveler) errors.push('Please select who you\'re traveling with');
    
    const days = parseInt(formData?.noOfDays);
    if (isNaN(days) || days < 1 || days > 15) {
      errors.push('Trip duration must be between 1 and 15 days');
    }
    
    return errors;
  };

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
        name: userCredential.user.displayName || authData.name,
        picture: userCredential.user.photoURL || null
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      setOpenDialog(false);
      setAuthData({ email: '', password: '', name: '' });
      setTimeout(OnGenerateTrip, 1000);
      
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
      setOpenDialog(true);
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((error, index) => 
        setTimeout(() => toast.error(error), index * 500)
      );
      return;
    }

    setLoading(true);
    setLoadingMessage('Creating Your Dream Trip');
    setLoadingSubMessage('Our AI is crafting the perfect itinerary...');
    
    try {
      const FINAL_PROMPT = AI_PROMPT
        .replace('{location}', formData?.location?.label)
        .replace('{totalDays}', formData?.noOfDays)
        .replace('{traveler}', formData?.traveler)
        .replace('{budget}', formData?.budget)
        .replace('{totalDays}', formData?.noOfDays);
      
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      console.log("--", result?.response?.text());
      
      SaveAiTrip(result?.response?.text());
    } catch (error) {
      console.error('Error generating trip:', error);
      toast.error('Failed to generate trip');
      setLoading(false);
      setLoadingMessage('');
      setLoadingSubMessage('');
    }
  };

  const SaveAiTrip = async (TripData) => {
    setLoadingMessage('Saving Your Trip');
    setLoadingSubMessage('Almost there...');
    
    const user = JSON.parse(localStorage.getItem('user'));
    const docId = Date.now().toString();

    try {
      await setDoc(doc(db, "AITrips", docId), {
        userSelection: formData,
        tripData: JSON.parse(TripData),
        userEmail: user?.email,
        userId: user?.uid,
        id: docId,
        createdAt: new Date().toISOString()
      });
      
      setLoading(false);
      toast.success('🎉 Trip saved successfully!');
      navigate('/view-trip/' + docId);
    } catch (error) {
      console.error('Error saving trip:', error);
      toast.error('Failed to save trip');
      setLoading(false);
    }
  };

  const GetUserProfile = (tokenInfo) => {
    setLoading(true);
    setLoadingMessage('Signing You In');
    
    axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokenInfo?.access_token}`,
        Accept: 'application/json'
      }
    }).then((resp) => {
      console.log(resp);
      const user = {
        uid: resp.data.id,
        email: resp.data.email,
        name: resp.data.name,
        picture: resp.data.picture
      };
      localStorage.setItem('user', JSON.stringify(user));
      setOpenDialog(false);
      toast.success(`Welcome ${resp.data.name}!`);
      setTimeout(OnGenerateTrip, 1000);
    }).catch((error) => {
      console.error('Error:', error);
      toast.error('Failed to get user profile');
      setLoading(false);
    });
  };

  // Render Option Cards
  const renderOptionCards = (options, selectedValue, fieldName, cardType) => {
    return options.map((item, index) => (
      <div
        key={item.title || item.people}
        onClick={() => handleInputChange(fieldName, item.title || item.people)}
        className={`option-card option-card-hover option-card-${cardType} ${
          selectedValue === (item.title || item.people) ? 'option-card-selected' : 'option-card-unselected'
        }`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className={`${cardType === 'budget' ? 'icon-container' : 'icon-container-travelers'} ${
          selectedValue === (item.title || item.people) ? 'icon-container-selected' : 'icon-container-unselected'
        }`}>
          <span className={cardType === 'budget' ? "text-4xl" : "text-3xl"}>
            {item.icon}
          </span>
        </div>
        
        <div className={cardType === 'budget' ? "card-content" : "card-content-travelers"}>
          <h3 className="card-title">{item.title}</h3>
          <p className="card-description">{item.desc}</p>
        </div>

        {selectedValue === (item.title || item.people) && (
          <div className="selection-indicator">
            <div className="selection-badge">
              <svg className="selection-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="trip-container">
      <LoadingOverlay isVisible={loading} message={loadingMessage} subMessage={loadingSubMessage} />
      
      <div className="trip-content">
        {/* Header */}
        <header className="trip-header">
          <h1 className="trip-title">
            <span className="trip-title-gradient">Share your travel preferences</span>
            <span className="text-4xl ml-2">🗺️</span>
          </h1>
          <p className="trip-subtitle">Let us create your dream journey with our AI-powered planner ✈️</p>
        </header>

        {/* Hero Image */}
        <div className="trip-hero-image">
          <img src="/image.png" alt="Travel Planning" className="trip-image" />
        </div>

        {/* Main Form */}
        <main className="trip-main">
          {/* Destination */}
          <section>
            <h2 className="section-title">Select Destination</h2>
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              selectProps={{
                value: place,
                onChange: (value) => {
                  setPlace(value);
                  handleInputChange('location', value);
                },
                placeholder: "Where would you like to go?",
                className: "places-autocomplete",
                styles: {
                  control: (provided) => ({
                    ...provided,
                    padding: '8px',
                    borderRadius: '12px',
                    border: '2px solid #e0f2fe',
                    '&:hover': { border: '2px solid #0ea5e9' }
                  })
                }
              }}
            />
          </section>

          {/* Duration */}
          <section>
            <h2 className="section-title">Trip Duration (1-15 days)</h2>
            <Input
              type="number"
              min="1"
              max="15"
              value={formData.noOfDays}
              onChange={(e) => handleInputChange('noOfDays', e.target.value)}
              className="trip-input"
              placeholder="Enter number of days"
            />
            {formData.noOfDays && (
              <div className="mt-2 text-sm">
                {isNaN(parseInt(formData.noOfDays)) ? (
                  <span className="text-red-500">⚠️ Please enter a valid number</span>
                ) : parseInt(formData.noOfDays) < 1 || parseInt(formData.noOfDays) > 15 ? (
                  <span className="text-red-500">⚠️ Days must be between 1 and 15</span>
                ) : (
                  <span className="text-green-500">✅ {parseInt(formData.noOfDays)} day{parseInt(formData.noOfDays) > 1 ? 's' : ''} selected</span>
                )}
              </div>
            )}
          </section>

          {/* Budget */}
          <section>
            <h2 className="section-title-with-margin">Budget Preference</h2>
            <div className="budget-grid">
              {renderOptionCards(SelectBudgetOptions, formData?.budget, 'budget', 'budget')}
            </div>
          </section>

          {/* Travel Companions */}
          <section>
            <h2 className="section-title-with-margin">Travel Companions</h2>
            <div className="travelers-grid">
              {renderOptionCards(SelectTravelesList, formData?.traveler, 'traveler', 'travelers')}
            </div>
          </section>

          {/* Generate Button */}
          <div className="button-container">
            <Button
              disabled={loading}
              onClick={OnGenerateTrip}
              className={`generate-button ${loading ? "generate-button-disabled" : "generate-button-active"}`}
            >
              {loading ? (
                <div className="button-loading-content">
                  <AiOutlineLoading3Quarters className="button-loading-icon" />
                  Processing...
                </div>
              ) : '✨ Generate My Trip'}
            </Button>
          </div>
        </main>

        {/* Auth Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="dialog-content max-w-md">
            <DialogHeader>
              <div className="text-center mb-6">
                <img src="/logo.svg" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {isLogin ? 'Sign in to create your trip' : 'Join us to start planning'}
                </p>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={authData.name}
                    onChange={(e) => handleAuthInputChange('name', e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={authData.email}
                  onChange={(e) => handleAuthInputChange('email', e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={authData.password}
                  onChange={(e) => handleAuthInputChange('password', e.target.value)}
                  className="w-full"
                  minLength={6}
                />
              </div>

              <Button
                onClick={handleEmailAuth}
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white py-3 rounded-xl font-semibold"
              >
                {authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button
              onClick={login}
              disabled={authLoading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-3"
            >
              <FcGoogle className="text-xl" />
              Continue with Google
            </Button>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sky-500 hover:text-sky-600 font-semibold"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default CreateTrip;