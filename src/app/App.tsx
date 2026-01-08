import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Login } from './components/ui/Login';
import MainPage from '../main2';
import { MultiStepLoader } from './components/ui/multi-step-loader';
import { Button } from './components/ui/button';

const loadingStates = [
  { text: "Initializing LoopMIT" },
  { text: "Connecting to systems" },
  { text: "Loading dashboard" },
  { text: "Preparing interface" },
  { text: "Welcome to LoopMIT" },
];

export default function App() {
  const { isSignedIn, isLoaded } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showMain, setShowMain] = useState(false);

  // When user signs in, start the loader
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setShowLogin(false);
      setLoading(true);
      setShowMain(false);
    }
  }, [isLoaded, isSignedIn]);

  // Finish loader then show main page
  useEffect(() => {
    if (loading) {
      const totalDuration = loadingStates.length * 2000;
      const timer = setTimeout(() => {
        setLoading(false);
        setShowMain(true);
      }, totalDuration);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Signed-in flow
  if (isLoaded && isSignedIn) {
    if (loading || !showMain) {
      return <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={2000} />;
    }
    return <MainPage />;
  }

  // Not signed in yet
  if (showLogin) {
    return <Login />;
  }

  // Pre-auth screen with LoopMIT button
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Button
        onClick={() => setShowLogin(true)}
        className="bg-[#39C3EF] hover:bg-[#39C3EF]/90 text-black mx-auto text-sm md:text-base transition font-medium duration-200 h-10 rounded-lg px-8 flex items-center justify-center"
        style={{
          boxShadow:
            "0px -1px 0px 0px #ffffff40 inset, 0px 1px 0px 0px #ffffff40 inset",
        }}
      >
        LoopMIT
      </Button>
    </div>
  );
}