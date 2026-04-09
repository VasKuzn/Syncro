import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCsrf } from '../Contexts/CsrfProvider';
import { checkAuth } from '../Services/AuthService';
import HeaderComponent from '../Components/LandingPage/HeaderComponent';
import BodyComponent from '../Components/LandingPage/BodyComponent';
import { AnimatePresence, motion } from 'framer-motion';
import '../Styles/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { baseUrl } = useCsrf();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const isAuthenticated = await checkAuth(baseUrl);
      if (isAuthenticated) {
        navigate('/main', { replace: true });
      }
      setIsChecking(false);
    };
    verify();
  }, [baseUrl, navigate]);

  if (isChecking) {
    return null;
  }

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
  );
};

export default Landing;