import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchCurrentUser } from '../Services/MainFormService';
import { useCsrf } from '../Contexts/CsrfProvider';
interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();
    const { baseUrl } = useCsrf();
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userId = await fetchCurrentUser(baseUrl);

                if (userId) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.log('Auth check failed:', error);
                setIsAuthenticated(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, []);

    if (isChecking) {
        return <div className="messages-decrypting-overlay">
            <div className="messages-decrypting-spinner"></div>
            <div className="messages-decrypting-text">Загрузка...</div>
        </div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
};

export default ProtectedRoute;