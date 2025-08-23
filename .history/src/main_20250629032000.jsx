import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import CreateTrip from './create-trip/index.jsx';
import ViewTrip from './view-trip/[tripId]';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Header from './components/custom/Header';  
import Footer from './components/custom/Footer';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google'; 

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/create-trip', element: <CreateTrip /> },
  { path: '/view-trip/:tripId', element: <ViewTrip /> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <Header />
      <Toaster richColors position="top-center" />
      <RouterProvider router={router} />
      <Footer />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
