import { createContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage synchronously to avoid flash
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('curae_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock logic for demo
    let userData = null;

    const doctorsLogins = {
      'luciana': { id: 'd6c6b3e3-3630-4713-9886-1c73bb98bc89', name: 'Luciana Renata Jiménez Aranzaens', role: 'ADMIN' },
      'carolina': { id: 'd3e529ea-9519-43f5-ba84-2fdcb8e826a1', name: 'Luciana Pacheco Hurtado', role: 'DOCTOR' },
      'barbara': { id: 'fe95314c-649e-4651-9816-14933288a994', name: 'Barbara Casapía Prado', role: 'DOCTOR' },
      'diego': { id: '8a08cd98-94bc-4cb0-bff5-2c4862ed78e8', name: 'Diego Casapía Prado', role: 'DOCTOR' },
      'stephany': { id: 'ee29e8f6-a481-400b-812b-4feaa9fa859b', name: 'Stephany Baldarrago Zevallos', role: 'DOCTOR' },
      'mariaelena': { id: 'd4509855-25ed-4a25-95e0-92ff3a396743', name: 'Maria Elena Prado Rivera', role: 'DOCTOR' },
      'sergio': { id: '0320a983-8909-433d-af0c-a76d0053c381', name: 'Sergio Huaylla Paredes', role: 'DOCTOR' }
    };

    const loginKey = email.toLowerCase().trim();
    if (doctorsLogins[loginKey] && password === `${loginKey}123`) {
      userData = { ...doctorsLogins[loginKey], email: `${loginKey}@curae.com` };
    }

    if (userData) {
      setUser(userData);
      localStorage.setItem('curae_user', JSON.stringify(userData));
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, message: 'Credenciales inválidas' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('curae_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
