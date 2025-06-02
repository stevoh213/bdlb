import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast'; // Corrected path

export interface AuthFormState {
  email: string;
  password: string;
  // confirmPassword?: string; // For future use if confirm password field is added
}

interface UseAuthFormProps {
  initialEmail?: string;
  initialPassword?: string;
  // onSignInSuccess?: () => void; // Optional callbacks for success/error
  // onSignUpSuccess?: () => void;
  // onError?: (error: any) => void;
}

export const useAuthForm = (props: UseAuthFormProps = {}) => {
  const [email, setEmail] = useState(props.initialEmail || '');
  const [password, setPassword] = useState(props.initialPassword || '');
  // const [confirmPassword, setConfirmPassword] = useState(''); // For future use
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

  // const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  //   setConfirmPassword(e.target.value);
  // }, []);

  const handleSignIn = useCallback(async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation (can be expanded)
    if (!email || !password) {
      const err = new Error("Email and password are required.");
      setError(err);
      toast({
        title: "Validation Error",
        description: err.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return { error: err, data: null };
    }

    const { error: signInError, data } = await signIn(email, password);

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
      // props.onSignInSuccess?.(); // Call optional callback
    }

    setIsLoading(false);
    return { error: signInError, data };
  }, [email, password, signIn, toast]);

  const handleSignUp = useCallback(async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation (can be expanded)
    // if (password !== confirmPassword) {
    //   const err = new Error("Passwords do not match.");
    //   setError(err);
    //   toast({ title: "Validation Error", description: err.message, variant: "destructive" });
    //   setIsLoading(false);
    //   return { error: err, data: null };
    // }
    if (!email || !password) {
      const err = new Error("Email and password are required.");
      setError(err);
      toast({
        title: "Validation Error",
        description: err.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return { error: err, data: null };
    }
     if (password.length < 6) {
      const err = new Error("Password must be at least 6 characters long.");
      setError(err);
      toast({ title: "Validation Error", description: err.message, variant: "destructive" });
      setIsLoading(false);
      return { error: err, data: null };
    }


    const { error: signUpError, data } = await signUp(email, password);

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
      // props.onSignUpSuccess?.(); // Call optional callback
    }

    setIsLoading(false);
    return { error: signUpError, data };
  }, [email, password, signUp, toast /*, confirmPassword */]);

  return {
    email,
    password,
    // confirmPassword,
    isLoading,
    error,
    setEmail, // Exposing direct setters if needed, or use handlers
    setPassword,
    // setConfirmPassword,
    handleEmailChange,
    handlePasswordChange,
    // handleConfirmPasswordChange,
    handleSignIn,
    handleSignUp,
    setIsLoading, // Expose if external factors can influence loading
    setError,     // Expose if external factors can set error
  };
};
