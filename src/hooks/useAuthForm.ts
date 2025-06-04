
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AuthFormState {
  email: string;
  password: string;
}

interface UseAuthFormProps {
  initialEmail?: string;
  initialPassword?: string;
}

export const useAuthForm = (props: UseAuthFormProps = {}) => {
  const [email, setEmail] = useState(props.initialEmail || '');
  const [password, setPassword] = useState(props.initialPassword || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleSignIn = useCallback(async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!email || !password) {
      const err = new Error("Email and password are required.");
      setError(err);
      toast({
        title: "Validation Error",
        description: err.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return { error: err };
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      toast({
        title: "Error signing in",
        description: signInError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }

    setIsLoading(false);
    return { error: signInError };
  }, [email, password, signIn, toast]);

  const handleSignUp = useCallback(async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!email || !password) {
      const err = new Error("Email and password are required.");
      setError(err);
      toast({
        title: "Validation Error",
        description: err.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return { error: err };
    }
    
    if (password.length < 6) {
      const err = new Error("Password must be at least 6 characters long.");
      setError(err);
      toast({ 
        title: "Validation Error", 
        description: err.message, 
        variant: "destructive" 
      });
      setIsLoading(false);
      return { error: err };
    }

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError);
      toast({
        title: "Error creating account",
        description: signUpError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    }

    setIsLoading(false);
    return { error: signUpError };
  }, [email, password, signUp, toast]);

  return {
    email,
    password,
    isLoading,
    error,
    setEmail,
    setPassword,
    handleEmailChange,
    handlePasswordChange,
    handleSignIn,
    handleSignUp,
    setIsLoading,
    setError,
  };
};
