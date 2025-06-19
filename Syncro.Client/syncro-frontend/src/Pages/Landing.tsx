import React from 'react';
import HeaderComponent from '../Components/LandingPage/HeaderComponent';
import BodyComponent from '../Components/LandingPage/BodyComponent';
import '../Styles/Landing.css';


const Landing = () => {
  return (
      <div className="landing-page">
        <HeaderComponent />
        <BodyComponent />
      </div>
  )
}

export default Landing