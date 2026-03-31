import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Leer el perfil completo del doctor desde la tabla pública
  const loadDoctorProfile = async (authUser) => {
    if (!authUser) return null;

    try {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id, name')
        .eq('id', authUser.id)
        .maybeSingle();

      return {
        id: authUser.id,
        email: authUser.email,
        name: doctor?.name || authUser.user_metadata?.name || 'Doctor(a)',
        role: authUser.user_metadata?.role || 'DOCTOR',
      };
    } catch {
      // Fallback: usar solo los metadatos del JWT si la tabla falla
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || 'Doctor(a)',
        role: authUser.user_metadata?.role || 'DOCTOR',
      };
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          const profile = await loadDoctorProfile(session?.user || null);
          setUser(profile);
        }
      } catch (err) {
        console.error('Error verificando sesión:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await loadDoctorProfile(session.user);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
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

      if (error) {
        setLoading(false);
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Usuario o contraseña incorrectos.' };
        }
        return { success: false, message: error.message };
      }

      setLoading(false);
      return { success: true };
    } catch {
      setLoading(false);
      return { success: false, message: 'Error de red al iniciar sesión.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (e) {
      console.error(e);
    }
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
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
