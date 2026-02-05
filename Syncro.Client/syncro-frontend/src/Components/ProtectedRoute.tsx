import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchCurrentUser } from '../Services/MainFormService'; // Ваша функция проверки пользователя

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Пытаемся получить текущего пользователя через ваш API
                const userId = await fetchCurrentUser();
                
                if (userId) {
                    // Если получили ID пользователя - авторизован
                    setIsAuthenticated(true);
                } else {
                    // Если не получили - не авторизован
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
        return <div>Loading...</div>; 
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
};

export default ProtectedRoute;