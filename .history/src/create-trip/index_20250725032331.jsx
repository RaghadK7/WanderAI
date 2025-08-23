// CreateTrip.jsx (Refactored Entry Point)
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { SelectBudgetOptions, SelectTravelesList } from '@/constants/options';
import { db, auth } from '@/service/firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

import LoadingOverlay from "./LoadingOverlay";
import AuthDialog from './AuthDialog';
import OptionCard from './OptionCard';
import { generateTravelPlan, saveTrip, fetchGoogleProfile } from './service/tripService';
import './CreateTrip.css';

function CreateTrip() {
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });

  const handleInputChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));
  const handleAuthInputChange = (field, value) => setAuthData(prev => ({ ...prev, [field]: value }));

  const validateForm = () => {
    const errors = [];
    if (!formData?.location) errors.push('Please select a destination');
    if (!formData?.noOfDays) errors.push('Please specify trip duration');
    if (!formData?.budget) errors.push('Please select your budget');
    if (!formData?.traveler) errors.push('Please select who you\'re traveling with');
    const days = parseInt(formData?.noOfDays);
    if (days < 1 || days > 15) errors.push('Trip duration must be between 1 and 15 days');
    return errors;
  };

  const OnGenerateTrip = async () => {
    const user = localStorage.getItem('user');
    if (!user) return setOpenDialog(true);

    const errors = validateForm();
    if (errors.length) return errors.forEach((err, i) => setTimeout(() => toast.error(err), i * 500));

    setLoading(true);
    setLoadingMessage('Creating Your Dream Trip');
    setLoadingSubMessage('Our AI is crafting the perfect itinerary...');

    try {
      const result = await generateTravelPlan(
        formData?.location?.label,
        parseInt(formData?.noOfDays),
        formData?.traveler,
        formData?.budget
      );

      const generatedDays = result?.itinerary?.length;
      if (!generatedDays) return toast.error('No itinerary generated');

      toast.success(`🎉 ${generatedDays}-day itinerary created!`);
      setTimeout(() => saveTrip(formData, result), 1000);

    } catch (error) {
      toast.error('Trip generation failed');
    } finally {
      setLoading(false);
      setLoadingMessage('');
      setLoadingSubMessage('');
    }
  };

  const handleGoogleLoginSuccess = async (tokenInfo) => {
    setLoading(true);
    setLoadingMessage('Signing You In');

    try {
      const user = await fetchGoogleProfile(tokenInfo);
      toast.success(`Welcome ${user.name}!`);
      localStorage.setItem('user', JSON.stringify(user));
      setOpenDialog(false);
      setTimeout(OnGenerateTrip, 1000);
    } catch {
      toast.error("Profile access denied");
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!authData.email || !authData.password || (!isLogin && !authData.name)) {
      toast.error('Please fill all required fields');
      return;
    }

    setAuthLoading(true);
    try {
      let userCredential;

      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, authData.email, authData.password);
        toast.success('Welcome back!');
      } else {
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
      const messages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address'
      };
      toast.error(messages[error.code] || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="trip-container">
      <LoadingOverlay isVisible={loading} message={loadingMessage} subMessage={loadingSubMessage} />

      <div className="trip-content">
        <header className="trip-header">
          <h1 className="trip-title">
            <span className="trip-title-gradient">Share your travel preferences</span>
            <span className="text-4xl ml-2">🗺️</span>
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
                onChange: (value) => {
                  setPlace(value);
                  handleInputChange('location', value);
                },
                placeholder: "Where would you like to go?",
                className: "places-autocomplete",
              }}
            />
          </section>

          <section>
            <h2 className="section-title">Trip Duration (1-15 days)</h2>
            <Input
              type="number"
              min="1"
              max="15"
              onChange={(e) => handleInputChange('noOfDays', e.target.value)}
              className="trip-input"
              placeholder="Enter number of days"
            />
          </section>

          <section>
            <h2 className="section-title-with-margin">Budget Preference</h2>
            <div className="budget-grid">
              {SelectBudgetOptions.map((item, i) => (
                <OptionCard key={i} item={item} selected={formData?.budget} fieldName="budget" onChange={handleInputChange} type="budget" />
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title-with-margin">Travel Companions</h2>
            <div className="travelers-grid">
              {SelectTravelesList.map((item, i) => (
                <OptionCard key={i} item={item} selected={formData?.traveler} fieldName="traveler" onChange={handleInputChange} type="travelers" />
              ))}
            </div>
          </section>

          <div className="button-container">
            <Button disabled={loading} onClick={OnGenerateTrip} className={`generate-button ${loading ? "generate-button-disabled" : "generate-button-active"}`}>
              {loading ? (
                <div className="button-loading-content">
                  <AiOutlineLoading3Quarters className="button-loading-icon" /> Processing...
                </div>
              ) : '✨ Generate My Trip'}
            </Button>
          </div>
        </main>

        <AuthDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          isLogin={isLogin}
          setIsLogin={setIsLogin}
          authData={authData}
          onInputChange={handleAuthInputChange}
          onEmailAuth={handleEmailAuth}
          onGoogleLoginSuccess={handleGoogleLoginSuccess}
          authLoading={authLoading}
        />
      </div>
    </div>
  );
}

export default CreateTrip;
