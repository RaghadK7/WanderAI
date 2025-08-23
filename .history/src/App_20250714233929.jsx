import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './index.css'
import { Button } from './components/ui/button'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Import components
import Hero from './components/custom/Hero'
import Header from './components/custom/Header'
import SVGAnimation from './components/custom/SVGAnimation'
import Footer from './components/custom/Footer'
import TermsOfService from './components/custom/TermsOfService'
import PrivacyPolicy from './components/custom/PrivacyPolicy'

// الصفحة الرئيسية كمكون منفصل
const HomePage = () => {
  return (
    <>
      <Header />
      <Hero />
      <SVGAnimation />
      <Footer />
    </>
  )
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* الصفحة الرئيسية */}
          <Route path="/" element={<HomePage />} />
          
          {/* صفحة شروط الاستخدام */}
          <Route path="/terms" element={<TermsOfService />} />
          
          {/* صفحة سياسة الخصوصية */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App