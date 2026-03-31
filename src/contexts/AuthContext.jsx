import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Para el spinner del botón de login
  const [isInitializing, setIsInitializing] = useState(true); // Para la carga inicial de JWT

  // Escuchar a Supabase Auth por sesiones activas en el navegador
  useEffect(() => {
    const checkSession = async () => {
      let activeSession = null;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        activeSession = session;
      } catch (err) {
        console.error('Error verificando sesión inicial JWT:', err);
      }
      
      if (activeSession?.user) {
        setUser({
          id: activeSession.user.id,
          email: activeSession.user.email,
          role: activeSession.user.user_metadata?.role || 'DOCTOR',
          name: activeSession.user.user_metadata?.name || 'Doctor(a)',
        });
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    };

    checkSession();

    // Mantener la sesión sincronizada si abre otra pestaña o el token expira
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'DOCTOR',
            name: session.user.user_metadata?.name || 'Doctor(a)',
          });
        } else {
          setUser(null);
        }
        setIsInitializing(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // 🚨 TRUCO DE EXPERIENCIA DE USUARIO (UX):
      // Si el doctor escribe solo "luciana" (sin arroba), le añadimos "@curae.com" invisiblemente
      // para que Supabase, que exige obligatoriamente formato de correo, nos deje entrar.
      let loginEmail = email.trim().toLowerCase();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@curae.com`;
      }

      // 🚨 COMUNICACIÓN SEGURA CON SUPABASE
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      });

      if (error) {
        setLoading(false);
        // Traducir los errores comunes de Supabase Auth
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Correo o contraseña incorrectos.' };
        }
        return { success: false, message: error.message };
      }

      // El éxito es capturado arriba por onAuthStateChange() y asigna el token JWT
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, message: 'Ocurrió un error de red al iniciar sesión.' };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#0f766e', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #ccfbf1', borderTopColor: '#0f766e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h3 style={{ marginTop: '20px', fontWeight: '600' }}>Cifrando conexión segura...</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Validando Tokens JWT con Supabase</p>
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
