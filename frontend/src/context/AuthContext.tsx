import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, LoginData, RegisterData, AuthResponse } from '../types/user';
import { authService, userService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  verifyOTP: (token: string, userId: string) => Promise<AuthResponse>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ajoutez cette interface pour MongoDB User
interface MongoDBUser extends Omit<User, 'id'> {
  _id: string;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await userService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await authService.login(data);
      if (!response.requireOTP) {
        // Assurer que l'ID est correctement mappé
        const mongoUser = response.user as unknown as MongoDBUser;
        if (mongoUser._id && !response.user.id) {
          (response.user as any).id = mongoUser._id;
        }
        setUser(response.user);
        setIsAuthenticated(true);
      }
      return response;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await authService.register(data);
      // Ne pas authentifier automatiquement l'utilisateur après l'inscription
      // Supprimer le token du localStorage
      localStorage.removeItem('token');
      return response;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = (): void => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Fonction de vérification OTP
  const verifyOTP = async (token: string, userId: string): Promise<AuthResponse> => {
    try {
      const response = await authService.verifyOTP(token, userId);
      // Assurer que l'ID est correctement mappé
      const mongoUser = response.user as unknown as MongoDBUser;
      if (mongoUser._id && !response.user.id) {
        (response.user as any).id = mongoUser._id;
      }
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Erreur de vérification OTP:', error);
      throw error;
    }
  };

  // Mettre à jour les informations utilisateur
  const updateUser = (updatedUser: User): void => {
    // Assurer que l'ID est correctement mappé
    const mongoUser = updatedUser as unknown as MongoDBUser & { id?: string };
    if (mongoUser._id && !mongoUser.id) {
      (updatedUser as any).id = mongoUser._id;
    }
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        verifyOTP,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}; 