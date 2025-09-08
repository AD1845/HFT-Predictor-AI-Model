import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '@/integrations/supabase/client';
import { LogIn, LogOut, User, Shield } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: 'Welcome Back',
          description: 'Successfully logged in to your trading account.',
        });
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? 'Sign Up Failed' : 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been securely logged out.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trading-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-5 h-5 text-trading-blue" />
          <h3 className="text-lg font-semibold text-trading-text">
            {isSignUp ? 'Create Trading Account' : 'Login to Trade'}
          </h3>
        </div>

        <div className="mb-4 p-4 bg-trading-bg/50 rounded-lg border border-trading-border/50">
          <p className="text-sm text-trading-muted">
            <strong>Security Notice:</strong> Authentication is required to protect your trading data. 
            Your trades are secured and only visible to you.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-trading-text">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="bg-trading-bg border-trading-border"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-trading-text">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
              required
              className="bg-trading-bg border-trading-border"
              minLength={6}
            />
            {isSignUp && (
              <p className="text-xs text-trading-muted">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={authLoading || !email || !password}
            className="w-full bg-trading-blue hover:bg-trading-blue/80"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {authLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-trading-blue hover:text-trading-blue/80 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-4 p-3 bg-trading-bg/50 rounded-lg">
          <div className="text-xs text-trading-muted">
            <div className="flex items-center space-x-1 mb-1">
              <Shield className="w-3 h-3" />
              <span>Demo Credentials (for testing):</span>
            </div>
            <p>Email: demo@trading.com</p>
            <p>Password: demo123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-trading-bg/50 rounded-lg border border-trading-border/50">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-trading-green" />
          <span className="text-sm text-trading-text">
            Logged in as: {user.email}
          </span>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <LogOut className="w-3 h-3 mr-1" />
          Sign Out
        </Button>
      </div>
      {children}
    </div>
  );
};

export default AuthWrapper;