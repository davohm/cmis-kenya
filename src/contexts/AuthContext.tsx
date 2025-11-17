import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase, UserRole } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  tenant_id?: string;
  roles: Array<{
    role: UserRole;
    tenant_id: string;
    tenant_name?: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      
      // Load user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, phone, tenant_id')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Error loading user data:', userError);
        console.error('Error details:', JSON.stringify(userError, null, 2));
        throw userError;
      }

      if (!userData) {
        console.warn('User not found in users table, creating basic profile');
        // User doesn't exist in users table, create basic profile
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          setProfile({
            id: authUser.user.id,
            email: authUser.user.email || '',
            full_name: authUser.user.user_metadata?.full_name || 'User',
            roles: []
          });
        }
        setLoading(false);
        return;
      }

      console.log('User data loaded successfully:', userData.email);

      // Load user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, tenant_id, tenants(name)')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
        console.error('Roles error details:', JSON.stringify(rolesError, null, 2));
      }

      // Build profile with roles
      const roles = rolesData?.map(r => ({
        role: r.role as UserRole,
        tenant_id: r.tenant_id,
        tenant_name: (r.tenants as any)?.name
      })) || [];

      console.log('Roles loaded:', roles.length, 'role(s)');

      setProfile({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        tenant_id: userData.tenant_id,
        roles
      });

      console.log('Profile set successfully');
    } catch (error) {
      console.error('Critical error loading profile:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Fallback: set basic profile from auth user
      try {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          console.log('Using fallback profile for:', authUser.user.email);
          setProfile({
            id: authUser.user.id,
            email: authUser.user.email || '',
            full_name: authUser.user.user_metadata?.full_name || 'User',
            roles: []
          });
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      // Use National HQ as default tenant for new signups
      const { data: defaultTenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('county_code', '000')
        .maybeSingle();

      if (tenantError || !defaultTenant) {
        console.error('Error fetching default tenant:', tenantError);
        throw new Error('Failed to assign default county');
      }

      const { error: userError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        tenant_id: defaultTenant.id
      });

      if (userError) throw userError;

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        tenant_id: defaultTenant.id,
        role: 'CITIZEN',
        is_active: true
      });

      if (roleError) throw roleError;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = useCallback((role: UserRole): boolean => {
    return profile?.roles.some(r => r.role === role) ?? false;
  }, [profile?.roles]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
