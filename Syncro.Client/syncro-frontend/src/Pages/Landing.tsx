import '../Styles/Landing.css';

import HeaderComponent from '../Components/LandingPage/HeaderComponent';
import BodyComponent from '../Components/LandingPage/BodyComponent';
import { AnimatePresence, motion } from 'framer-motion';


const Landing = () => {
  return (
    <AnimatePresence>
      <motion.div
          className="landing-page animation-flow"
          key="page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <HeaderComponent />
        <BodyComponent />
      </motion.div>
    </AnimatePresence>
  )
}

export default Landing