import axios from 'axios';
import { AuthResponse, LoginData, RegisterData, User } from '../types/user';

// Interface pour les objets MongoDB
interface MongoDBUser extends Omit<User, 'id'> {
  _id: string;
}

const API_URL = 'http://localhost:5001/api';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Permettre l'envoi des cookies avec les requêtes cross-origin
});

// Intercepteur pour ajouter le token JWT aux requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('token');
  },

  verifyOTP: async (token: string, userId: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-login-otp', { token, userId });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  setupOTP: async (): Promise<{ secret: string; qrCode: string }> => {
    const response = await api.post('/auth/setup-otp');
    return response.data;
  },

  verifyAndEnableOTP: async (token: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/verify-otp', { token });
    return response.data;
  },

  disableOTP: async (token: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/disable-otp', { token });
    return response.data;
  },
};

// Services utilisateurs
export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<{ user: MongoDBUser }>('/users/me');
    
    // Log l'objet reçu du serveur
    console.log("Réponse de /users/me:", response.data);
    
    // Transformer l'objet MongoDB en objet User pour le frontend
    const user = response.data.user;
    
    // S'assurer que l'ID est correctement mappé
    if (user._id && !(user as any).id) {
      (user as any).id = user._id;
    }
    
    return user as any as User;
  },

  getEtudiantDetails: async (id: string): Promise<User> => {
    const response = await api.get<{ user: MongoDBUser }>(`/users/etudiants/${id}`);
    const user = response.data.user;
    
    // S'assurer que l'ID est correctement mappé
    if (user._id && !(user as any).id) {
      (user as any).id = user._id;
    }
    
    return user as any as User;
  },

  getAllEtudiants: async (): Promise<User[]> => {
    const response = await api.get<{ etudiants: MongoDBUser[] }>('/users/etudiants');
    
    // Transformer tous les objets MongoDB en objets User pour le frontend
    const etudiants = response.data.etudiants.map(etudiant => {
      if (etudiant._id && !(etudiant as any).id) {
        (etudiant as any).id = etudiant._id;
      }
      return etudiant as any as User;
    });
    
    return etudiants;
  },

  getAllIntervenants: async (otp: string): Promise<User[]> => {
    const response = await api.post<{ intervenants: MongoDBUser[] }>('/users/intervenants/verify-otp', { 
      token: otp
    });
    
    // Transformer tous les objets MongoDB en objets User pour le frontend
    const intervenants = response.data.intervenants.map(intervenant => {
      if (intervenant._id && !(intervenant as any).id) {
        (intervenant as any).id = intervenant._id;
      }
      return intervenant as any as User;
    });
    
    return intervenants;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    console.log(`Mise à jour de l'utilisateur avec l'id: ${id}`, data);
    const response = await api.put<{ user: MongoDBUser }>(`/users/${id}`, data);
    console.log("Réponse de updateUser:", response.data);
    
    // Transformer l'objet MongoDB en objet User pour le frontend
    const user = response.data.user;
    
    // S'assurer que l'ID est correctement mappé
    if (user._id && !(user as any).id) {
      (user as any).id = user._id;
    }
    
    return user as any as User;
  },
  
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

export default api; 