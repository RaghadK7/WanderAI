import { useState } from 'react'
import reactLogo from './assets/react.svg'  
import viteLogo from '/vite.svg'
import './index.css'
import { Button } from './components/ui/button' 
import Hero from './components/custom/Hero'
import Header from './components/custom/Header';
import SVGAnimation from './components/custom/SVGAnimation';
import Footer from './components/custom/Footer';



function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
      {/*Hero */}
      
      <Hero/>
      <SVGAnimation />
    </>
  )
}


export default App
