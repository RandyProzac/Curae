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
      'luciana': { id: '1', name: 'Luciana Renata Jiménez Aranzaens', role: 'ADMIN' },
      'carolina': { id: '2', name: 'Luciana Pacheco Hurtado', role: 'DOCTOR' },
      'barbara': { id: '3', name: 'Barbara Casapía Prado', role: 'DOCTOR' },
      'diego': { id: '4', name: 'Diego Casapía Prado', role: 'DOCTOR' },
      'stephany': { id: '5', name: 'Stephany Baldarrago Zevallos', role: 'DOCTOR' },
      'mariaelena': { id: '6', name: 'Maria Elena Prado Rivera', role: 'DOCTOR' },
      'sergio': { id: '7', name: 'Sergio Huaylla Paredes', role: 'DOCTOR' }
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
