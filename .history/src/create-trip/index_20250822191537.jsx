import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AI_PROMPT, SelectBudgetOptions, SelectTravelesList } from '@/constants/options';
import { chatSession } from '@/service/AIModal';
import React, { useState } from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import { toast } from 'sonner';
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/service/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './CreateTrip.css';

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
            <h3 className="loading-title">{message}</h3>
            {subMessage && <p className="loading-subtitle">{subMessage}</p>}
          </div>
          <div className="loading-dots">
            {[0, 1, 2].map(i => <div key={i} className="loading-dot" style={{ animationDelay: `${i * 0.1}s` }}></div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

function CreateTrip() {
  const navigate = useNavigate();
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState({ location: null, noOfDays: '', budget: '', traveler: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });

  const handleInputChange = (name, value) => setFormData({ ...formData, [name]: value });
  const handleAuthInputChange = (field, value) => setAuthData(prev => ({ ...prev, [field]: value }));

  const login = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: () => toast.error('Google login failed')
  });

  const validateForm = () => {
    const errors = [];
    if (!formData?.location) errors.push('Please select a destination');
    if (!formData?.noOfDays) errors.push('Please specify trip duration');
    if (!formData?.budget) errors.push('Please select your budget');
    if (!formData?.traveler) errors.push('Please select travel companions');
    const days = parseInt(formData?.noOfDays);
    if (isNaN(days) || days < 1 || days > 15) errors.push('Trip duration must be between 1 and 15 days');
    return errors;
  };

  const handleEmailAuth = async () => {
    if (!authData.email || !authData.password) return toast.error('Please fill all fields');
    setAuthLoading(true);
    
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, authData.email, authData.password);
        toast.success('Welcome back!');
      } else {
        if (!authData.name) return toast.error('Name is required');
        userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
        await updateProfile(userCredential.user, { displayName: authData.name });
        toast.success('Account created!');
      }
      
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || authData.name
      }));
      setOpenDialog(false);
      setTimeout(OnGenerateTrip, 1000);
    } catch (error) {
      const errors = {
        'auth/user-not-found': 'No account found',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password too weak',
        'auth/invalid-email': 'Invalid email'
      };
      toast.error(errors[error.code] || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const OnGenerateTrip = async () => {
    if (!localStorage.getItem('user')) return setOpenDialog(true);
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((e, i) => setTimeout(() => toast.error(e), i * 500));
      return;
    }

    setLoading(true);
    setLoadingMessage('Creating Your Dream Trip');
    setLoadingSubMessage('Our AI is crafting the perfect itinerary...');
    
    try {
      const FINAL_PROMPT = AI_PROMPT
        .replace(/{location}/g, formData?.location?.label)
        .replace(/{totalDays}/g, formData?.noOfDays)
        .replace(/{traveler}/g, formData?.traveler)
        .replace(/{budget}/g, formData?.budget);
      
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      SaveAiTrip(result?.response?.text());
    } catch (error) {
      toast.error('Failed to generate trip');
      setLoading(false);
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
      toast.success('Trip saved successfully!');
      navigate('/view-trip/' + docId);
    } catch (error) {
      toast.error('Failed to save trip');
    } finally {
      setLoading(false);
    }
  };

  const GetUserProfile = (tokenInfo) => {
    setLoading(true);
    setLoadingMessage('Signing You In');
    
    axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {
      headers: { Authorization: `Bearer ${tokenInfo?.access_token}`, Accept: 'application/json' }
    }).then((resp) => {
      localStorage.setItem('user', JSON.stringify({
        uid: resp.data.id,
        email: resp.data.email,
        name: resp.data.name,
        picture: resp.data.picture
      }));
      setOpenDialog(false);
      toast.success(`Welcome ${resp.data.name}!`);
      setTimeout(OnGenerateTrip, 1000);
    }).catch(() => {
      toast.error('Failed to get profile');
      setLoading(false);
    });
  };

  const renderCards = (options, selected, field, type) => (
    options.map((item, i) => (
      <div
        key={item.title || item.people}
        onClick={() => handleInputChange(field, item.title || item.people)}
        className={`option-card option-card-hover option-card-${type} ${
          selected === (item.title || item.people) ? 'option-card-selected' : 'option-card-unselected'
        }`}
        style={{ animationDelay: `${i * 0.1}s` }}
      >
        <div className={`${type === 'budget' ? 'icon-container' : 'icon-container-travelers'} ${
          selected === (item.title || item.people) ? 'icon-container-selected' : 'icon-container-unselected'
        }`}>
          <span className={type === 'budget' ? "text-4xl" : "text-3xl"}>{item.icon}</span>
        </div>
        <div className={type === 'budget' ? "card-content" : "card-content-travelers"}>
          <h3 className="card-title">{item.title}</h3>
          <p className="card-description">{item.desc}</p>
        </div>
        {selected === (item.title || item.people) && (
          <div className="selection-indicator">
            <div className="selection-badge">
              <svg className="selection-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
    ))
  );

  return (
    <div className="trip-container">
      <LoadingOverlay isVisible={loading} message={loadingMessage} subMessage={loadingSubMessage} />
      
      <div className="trip-content">
        <header className="trip-header">
          <h1 className="trip-title">
            <span className="trip-title-gradient">Share your travel preferences</span> 🗺️
          </h1>
          <p className="trip-subtitle">Let us create your dream journey with our AI-powered planner ✈️</p>
        </header>

        <div className="trip-hero-image">
          <img src="/image.png" alt="Travel Planning" className="trip-image" />
        </div>

        <main className="trip-main">
          <section>
            <h2 className="section-title">Select Destination</h2>
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              selectProps={{
                value: place,
                onChange: (v) => { setPlace(v); handleInputChange('location', v); },
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

          <section>
            <h2 className="section-title">Trip Duration (1-15 days)</h2>
            <Input
              type="number" min="1" max="15"
              value={formData.noOfDays}
              onChange={(e) => handleInputChange('noOfDays', e.target.value)}
              className="trip-input"
              placeholder="Enter number of days"
            />
            {formData.noOfDays && (
              <p className="mt-2 text-sm text-green-500">
                {parseInt(formData.noOfDays) >= 1 && parseInt(formData.noOfDays) <= 15 
                  ? `✅ ${formData.noOfDays} day${formData.noOfDays > 1 ? 's' : ''} selected`
                  : <span className="text-red-500">⚠️ Days must be between 1 and 15</span>}
              </p>
            )}
          </section>

          <section>
            <h2 className="section-title-with-margin">Budget Preference</h2>
            <div className="budget-grid">
              {renderCards(SelectBudgetOptions, formData?.budget, 'budget', 'budget')}
            </div>
          </section>

          <section>
            <h2 className="section-title-with-margin">Travel Companions</h2>
            <div className="travelers-grid">
              {renderCards(SelectTravelesList, formData?.traveler, 'traveler', 'travelers')}
            </div>
          </section>

          <div className="button-container">
            <Button
              disabled={loading}
              onClick={OnGenerateTrip}
              className={`generate-button ${loading ? "generate-button-disabled" : "generate-button-active"}`}
            >
              {loading ? (
                <><AiOutlineLoading3Quarters className="button-loading-icon" /> Processing...</>
              ) : '✨ Generate My Trip'}
            </Button>
          </div>
        </main>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="dialog-content max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600">
                {isLogin ? 'Sign in to create your trip' : 'Join us to start planning'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!isLogin && (
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={authData.name}
                  onChange={(e) => handleAuthInputChange('name', e.target.value)}
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={authData.email}
                onChange={(e) => handleAuthInputChange('email', e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={authData.password}
                onChange={(e) => handleAuthInputChange('password', e.target.value)}
              />
              <Button
                onClick={handleEmailAuth}
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-3 rounded-xl"
              >
                {authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
              </div>
              
              <Button onClick={login} className="w-full bg-white border text-gray-700">
                <FcGoogle className="mr-2" /> Continue with Google
              </Button>
              
              <p className="text-center text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setIsLogin(!isLogin)} className="text-sky-500 font-semibold">
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