import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        // Handle specific auth errors
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Credenciales inválidas', type: 'invalid_credentials' } };
        }
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          return { error: { message: 'Por favor confirma tu email antes de iniciar sesión', type: 'email_not_confirmed', email } };
        }
        if (error.message.includes('too many requests')) {
          return { error: { message: 'Demasiados intentos. Intenta más tarde', type: 'rate_limit' } };
        }
        return { error: { message: error.message, type: 'unknown' } };
      }
      
      return { error: null };
    } catch (err) {
      console.error('SignIn error:', err);
      return { error: { message: 'Error al iniciar sesión' } };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });
      
      if (error) {
        // Handle specific signup errors
        if (error.message.includes('already registered')) {
          return { error: { message: 'El correo ya está registrado' } };
        }
        if (error.message.includes('Password should be')) {
          return { error: { message: 'La contraseña debe tener al menos 6 caracteres' } };
        }
        return { error: { message: error.message } };
      }
      
      return { error: null };
    } catch (err) {
      console.error('SignUp error:', err);
      return { error: { message: 'Error al registrar usuario' } };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        return { error: { message: 'Error al reenviar confirmación: ' + error.message } };
      }
      
      return { error: null };
    } catch (err) {
      console.error('Resend confirmation error:', err);
      return { error: { message: 'Error al reenviar confirmación' } };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    resendConfirmation,
    logout
  };
};

export { AuthContext };