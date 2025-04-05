import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types/user';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface UseProtectedRouteOptions {
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export const useProtectedRoute = (options: UseProtectedRouteOptions = {}) => {
  const { requiredRoles = [], redirectTo = '/login' } = options;
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
      if (!isAuthenticated) {
        toast.error('Vous devez être connecté pour accéder à cette page');
        navigate(redirectTo);
        return;
      }

      // Si des rôles sont requis et que l'utilisateur n'a pas le rôle nécessaire
      if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
        toast.error('Vous n\'avez pas les permissions nécessaires pour accéder à cette page');
        navigate('/');
      }
    }
  }, [isAuthenticated, user, isLoading, navigate, redirectTo, requiredRoles]);

  return { isAuthenticated, user, isLoading };
}; 