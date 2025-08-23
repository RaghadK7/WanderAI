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
import './CreateTrip.css'; // Import CSS file for card styles

function CreateTrip() {
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState([]);
  const [openDailog, setOpenDailog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New states for email auth
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

  // Email Authentication Handler
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
      setOpenDailog(false);
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
      setOpenDailog(true)
      return;
    }

    if (formData?.noOfDays > 5 && !formData?.location || !formData?.budget || !formData?.traveler) {
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
    axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?acess_token=${tokenInfo?.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokenInfo?.access_token}`,
        Accept: 'Application/json'
      }
    }).then((resp) => {
      console.log(resp);
      localStorage.setItem('user', JSON.stringify(resp.data));
      setOpenDailog(false);
      OnGenerateTrip();
    })
  }

  return (
    <div className='sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5 mt-10'>
      <h2 className='font-bold text-3xl'>Tell us your travel preferences 🏕️🌴</h2>
      <p className='mt-3 text-gray-500 text-xl'>Just provide some basic information, and our trip planner will generate a customized itinerary based on your preferences.</p>

      <div className='mt-20 flex flex-col gap-10'>
        <div>
          <h2 className='text-xl my-3 font-medium'>What is destination of choice?</h2>
          <GooglePlacesAutocomplete
            apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
            selectProps={{
              place,
              onChange: (v) => { setPlace(v); handleInputChange('location', v) }
            }}
          />
        </div>

        <div>
          <h2 className='text-xl my-3 font-medium'>How many days are you planning your trip?</h2>
          <Input placeholder={'Ex.3'} type="number"
            onChange={(e) => handleInputChange('noOfDays', e.target.value)}
          />
        </div>

        <div>
          <h2 className='text-xl my-3 font-medium'>What is Your Budget?</h2>
          <div className='grid grid-cols-3 gap-5 mt-5'>
            {SelectBudgetOptions.map((item, index) => (
              <div key={index}
                onClick={() => handleInputChange('budget', item.title)}
                className={`option-card option-card-hover option-card-budget ${
                  formData?.budget == item.title ? 'option-card-selected' : 'option-card-unselected'
                }`}>
                <div className={`icon-container ${
                  formData?.budget == item.title ? 'icon-container-selected' : 'icon-container-unselected'
                }`}>
                  <span className='text-4xl'>{item.icon}</span>
                </div>
                <div className='card-content'>
                  <h3 className='card-title'>{item.title}</h3>
                  <p className='card-description'>{item.desc}</p>
                </div>
                {formData?.budget == item.title && (
                  <div className='selection-indicator'>
                    <div className='selection-badge'>
                      <svg className='selection-icon' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className='text-xl my-3 font-medium'>Who do you plan on traveling with on your next adventure?</h2>
          <div className='grid grid-cols-3 gap-5 mt-5'>
            {SelectTravelesList.map((item, index) => (
              <div key={index}
                onClick={() => handleInputChange('traveler', item.people)}
                className={`option-card option-card-hover option-card-travelers ${
                  formData?.traveler == item.people ? 'option-card-selected' : 'option-card-unselected'
                }`}>
                <div className={`icon-container-travelers ${
                  formData?.traveler == item.people ? 'icon-container-selected' : 'icon-container-unselected'
                }`}>
                  <span className='text-3xl'>{item.icon}</span>
                </div>
                <div className='card-content-travelers'>
                  <h3 className='card-title'>{item.title}</h3>
                  <p className='card-description'>{item.desc}</p>
                </div>
                {formData?.traveler == item.people && (
                  <div className='selection-indicator'>
                    <div className='selection-badge'>
                      <svg className='selection-icon' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='my-10 justify-end flex'>
        <Button
          disabled={loading}
          onClick={OnGenerateTrip}>
          {loading ?
            <AiOutlineLoading3Quarters className='h-7 w-7 animate-spin' /> : 'Generate Trip'
          }
        </Button>
      </div>

      <Dialog open={openDailog}>
        <DialogContent>
          <DialogHeader>
            <DialogDescription>
              <img src="/logo.svg" />
              <h2 className='font-bold text-lg mt-7'>
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p>{isLogin ? 'Sign in to create your trip' : 'Join us to start planning'}</p>

              {/* Email Auth Form */}
              <div className='mt-5 space-y-4'>
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
                  className="w-full">
                  {authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>

                <div className='text-center text-sm text-gray-500'>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className='text-blue-500 hover:underline'>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </div>

                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <span className='w-full border-t' />
                  </div>
                  <div className='relative flex justify-center text-xs uppercase'>
                    <span className='bg-white px-2 text-gray-500'>Or</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={login}
                className="w-full mt-5 flex gap-4 items-center">
                <FcGoogle className='h-7 w-7' />
                Sign In With Google
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateTrip