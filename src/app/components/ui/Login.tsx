import React, { useState } from 'react';
import { useAuth, SignIn, SignUp } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';

export function Login() {
  const { isSignedIn, isLoaded } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  // If user is signed in, don't render the login page
  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>
            {showSignUp 
              ? 'Create an account to get started' 
              : 'Sign in to your account to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSignUp ? (
            <div className="space-y-4">
              <SignUp 
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-none border-0",
                  }
                }}
              />
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setShowSignUp(false)}
                >
                  Sign in
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <SignIn 
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-none border-0",
                  }
                }}
              />
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setShowSignUp(true)}
                >
                  Sign up
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

