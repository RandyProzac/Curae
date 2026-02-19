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

    if (email === 'admin@curae.com' && password === 'admin123') {
      userData = { id: '1', name: 'Administrador Principal', email, role: 'ADMIN' };
    } else if (email === 'doctor@curae.com' && password === 'doctor123') {
      userData = { id: '2', name: 'Dr. Roberto Mendoza', email, role: 'DOCTOR' };
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
