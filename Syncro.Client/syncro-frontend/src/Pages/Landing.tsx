import '../Styles/Landing.css';

import HeaderComponent from '../Components/LandingPage/HeaderComponent';
import BodyComponent from '../Components/LandingPage/BodyComponent';


const Landing = () => {
  return (
    <div className="landing-page animation-flow">
      <HeaderComponent />
      <BodyComponent />
    </div>
  )
}

export default Landing