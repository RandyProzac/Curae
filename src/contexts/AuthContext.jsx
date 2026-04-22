import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const buildProfile = (authUser) => {
    if (!authUser) return null;
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || 'Doctor(a)',
      role: authUser.user_metadata?.role || 'DOCTOR',
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? buildProfile(session.user) : null);
      setIsInitializing(false);
    }).catch(() => {
      setUser(null);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ? buildProfile(session.user) : null);
        setIsInitializing(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      let loginEmail = email.trim().toLowerCase();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@curae.com`;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      });

      setLoading(false);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Usuario o contraseña incorrectos.' };
        }
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch {
      setLoading(false);
      return { success: false, message: 'Error de red al iniciar sesión.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#0f766e', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #ccfbf1', borderTopColor: '#0f766e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '16px' }}>Cargando...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      isAdmin: user?.role === 'ADMIN',
      canModifyPrices: user?.role === 'ADMIN' && ['diego@curae.com', 'luciana@curae.com', 'asistencia@curae.com'].includes(user?.email?.toLowerCase()),
      canViewGlobalFinance: ['diego@curae.com', 'luciana@curae.com', 'asistencia@curae.com', 'mariaelena@curae.com'].includes(user?.email?.toLowerCase()) || user?.name?.toLowerCase().includes('maria elena') || user?.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
