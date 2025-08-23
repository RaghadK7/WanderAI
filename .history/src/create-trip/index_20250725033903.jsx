import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { SelectBudgetOptions, SelectTravelesList } from '@/constants/options';
import { generateTravelPlan } from '@/service/AIModal';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { useGoogleLogin } from '@react-oauth/google';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/service/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { toast } from 'sonner';
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import './CreateTrip.css';

// Simple loading component
const Loading = ({ show, message }) => {
  if (!show) return null;
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <AiOutlineLoading3Quarters className="loading-spinner" />
        <p>{message}</p>
      </div>
    </div>
  );
};

function CreateTrip() {
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState({});
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateAuth = (key, value) => {
    setAuthData(prev => ({ ...prev, [key]: value }));
  };

  // Check if form is valid
  const isFormValid = () => {
    const { location, noOfDays, budget, traveler } = formData;
    const days = parseInt(noOfDays);
    return location && noOfDays && budget && traveler && days >= 1 && days <= 15;
  };

  // Save trip data
  const saveTrip = async (tripData) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const docId = Date.now().toString();
    const tripDoc = {
      userEmail: user.email,
      userId: user.uid,
      userSelection: formData,
      tripData: tripData,
      id: docId,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'AITrips', docId), tripDoc);
      localStorage.setItem('AITrip_' + docId, JSON.stringify(tripDoc));
      toast.success('Trip saved!');
      setTimeout(() => window.location.href = `/view-trip/${docId}`, 1500);
    } catch (error) {
      toast.error('Save failed');
    }
  };

  // Generate trip with AI
  const generateTrip = async () => {
    if (!localStorage.getItem('user')) {
      setShowAuth(true);
      return;
    }

    if (!isFormValid()) {
      toast.error('Please fill all fields correctly');
      return;
    }

    setLoading(true);
    setLoadingMsg('Creating your trip...');

    try {
      const result = await generateTravelPlan(
        formData.location.label,
        parseInt(formData.noOfDays),
        formData.traveler,
        formData.budget
      );

      if (result?.itinerary) {
        toast.success('Trip created successfully!');
        await saveTrip(result);
      } else {
        toast.error('Failed to generate trip');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Google login
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setLoading(true);
      setLoadingMsg('Signing in...');

      try {
        const userResponse = await fetch(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${response.access_token}`,
          { headers: { Authorization: `Bearer ${response.access_token}` } }
        );
        const userData = await userResponse.json();

        const user = {
          uid: userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture
        };

        localStorage.setItem('user', JSON.stringify(user));
        toast.success(`Welcome ${userData.name}!`);
        setShowAuth(false);
        setTimeout(generateTrip, 1000);
      } catch (error) {
        toast.error('Login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Google login failed')
  });

  // Email/password authentication
  const handleEmailAuth = async () => {
    if (!authData.email || !authData.password) {
      toast.error('Please fill all fields');
      return;
    }

    if (!isLogin && !authData.name) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);

    try {
      let userCredential;

      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, authData.email, authData.password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
        await updateProfile(userCredential.user, { displayName: authData.name });
      }

      const user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || authData.name,
        picture: userCredential.user.photoURL
      };

      localStorage.setItem('user', JSON.stringify(user));
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      setShowAuth(false);
      setAuthData({ email: '', password: '', name: '' });
      setTimeout(generateTrip, 1000);
    } catch (error) {
      const errorMessages = {
        'auth/user-not-found': 'User not found',
        'auth/wrong-password': 'Wrong password',
        'auth/email-already-in-use': 'Email already exists',
        'auth/weak-password': 'Password too weak',
        'auth/invalid-email': 'Invalid email'
      };
      toast.error(errorMessages[error.code] || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Render option cards
  const renderOptions = (options, selected, field) => {
    return options.map((item, index) => (
      <div
        key={item.title || item.people}
        className={`option-card ${selected === (item.title || item.people) ? 'selected' : ''}`}
        onClick={() => updateForm(field, item.title || item.people)}
      >
        <div className="option-icon">{item.icon}</div>
        <div className="option-content">
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
        </div>
      </div>
    ));
  };

  return (
    <div className="trip-container">
      <Loading show={loading} message={loadingMsg} />

      <div className="trip-content">
        <header className="trip-header">
          <h1>Share your travel preferences 🗺️</h1>
          <p>Let us create your dream journey with AI ✈️</p>
        </header>

        <div className="hero-image">
          <img src="/image.png" alt="Travel Planning" />
        </div>

        <main className="trip-form">
          {/* Destination */}
          <section className="form-section">
            <h2>Select Destination</h2>
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              selectProps={{
                value: place,
                onChange: (value) => {
                  setPlace(value);
                  updateForm('location', value);
                },
                placeholder: "Where would you like to go?",
                className: "places-input"
              }}
            />
          </section>

          {/* Duration */}
          <section className="form-section">
            <h2>Trip Duration (1-15 days)</h2>
            <Input
              type="number"
              min="1"
              max="15"
              placeholder="Enter number of days"
              onChange={(e) => updateForm('noOfDays', e.target.value)}
              className="duration-input"
            />
          </section>

          {/* Budget */}
          <section className="form-section">
            <h2>Budget Preference</h2>
            <div className="options-grid">
              {renderOptions(SelectBudgetOptions, formData.budget, 'budget')}
            </div>
          </section>

          {/* Travelers */}
          <section className="form-section">
            <h2>Travel Companions</h2>
            <div className="options-grid">
              {renderOptions(SelectTravelesList, formData.traveler, 'traveler')}
            </div>
          </section>

          {/* Generate Button */}
          <div className="generate-section">
            <Button
              onClick={generateTrip}
              disabled={loading}
              className="generate-btn"
            >
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters className="btn-spinner" />
                  Processing...
                </>
              ) : (
                '✨ Generate My Trip'
              )}
            </Button>
          </div>
        </main>

        {/* Auth Dialog */}
        <Dialog open={showAuth} onOpenChange={setShowAuth}>
          <DialogContent className="auth-dialog">
            <DialogHeader>
              <div className="auth-header">
                <img src="/logo.svg" alt="Logo" className="auth-logo" />
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p>{isLogin ? 'Sign in to create your trip' : 'Join us to start planning'}</p>
              </div>
            </DialogHeader>

            <div className="auth-form">
              {!isLogin && (
                <div className="form-field">
                  <label>Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={authData.name}
                    onChange={(e) => updateAuth('name', e.target.value)}
                  />
                </div>
              )}

              <div className="form-field">
                <label>Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={authData.email}
                  onChange={(e) => updateAuth('email', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={authData.password}
                  onChange={(e) => updateAuth('password', e.target.value)}
                  minLength={6}
                />
              </div>

              <Button onClick={handleEmailAuth} className="auth-submit-btn">
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <Button onClick={googleLogin} className="google-btn">
                <FcGoogle />
                Continue with Google
              </Button>

              <div className="auth-toggle">
                <p>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default CreateTrip;