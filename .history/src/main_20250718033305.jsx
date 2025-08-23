import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import CreateTrip from './create-trip/index.jsx';
import ViewTrip from './view-trip/[tripId]';
import TermsOfService from './components/custom/TermsOfService';
import PrivacyPolicy from './components/custom/PrivacyPolicy';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Header from './components/custom/Header';
import Footer from './components/custom/Footer';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MyTrips from './my-trips/index.jsx';

// Layout component that includes Header and Footer
const Layout = () => {
  return (
    <>
      <Header />
      <Toaster richColors position="top-center" />
      <Outlet />
      <Footer />
    </>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <App /> },
      { path: '/create-trip', element: <CreateTrip /> },
      { path: '/view-trip/:tripId', element: <ViewTrip /> },
      { path: '/terms', element: <TermsOfService /> },
      { path: '/privacy', element: <PrivacyPolicy /> },
      { path: '/my-trips', element: <MyTrips /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </React.StrictMode>
);