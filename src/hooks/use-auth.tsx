import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: any | null;
  session: any | null;
  userProfile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to load profile data with localStorage integration
  const loadProfileData = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (profile) {
        // Check localStorage for local avatar URL
        const localProfile = localStorage.getItem('userProfile');
        const userSpecificProfile = localStorage.getItem(`userProfile_${userId}`);
        
        if (userSpecificProfile) {
          try {
            const localData = JSON.parse(userSpecificProfile);
            if (localData.avatar_url && localData.avatar_url.startsWith('blob:')) {
              profile.avatar_url = localData.avatar_url;
            }
            // Merge other local data if needed
            Object.keys(localData).forEach(key => {
              if (localData[key] && key !== 'avatar_url') {
                profile[key] = localData[key];
              }
            });
          } catch (error) {
            console.error('Error parsing user-specific profile:', error);
          }
        } else if (localProfile) {
          try {
            const localData = JSON.parse(localProfile);
            if (localData.avatar_url && localData.avatar_url.startsWith('blob:')) {
              profile.avatar_url = localData.avatar_url;
            }
          } catch (error) {
            console.error('Error parsing general profile:', error);
          }
        }
        
        setUserProfile(profile);
        return profile;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    return null;
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfileData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(async () => {
            await loadProfileData(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Load profile data if user exists
      if (session?.user) {
        await loadProfileData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}