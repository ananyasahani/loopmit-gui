import React from 'react';
import { useLocation } from 'react-router-dom';
import { FloatingDock } from './ui/floating-dock';
import { Home, Cpu, Cog, Rocket, LogOut } from 'lucide-react';
import { StopBtn } from './stopbtn';
import { Button } from './ui/button';
import { useClerk } from '@clerk/clerk-react';
import ShinyText from './ui/ShinyText';

export function Header() {
  const location = useLocation();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    {
      title: 'Dashboard',
      icon: <Home className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/',
    },
    {
      title: 'Electrical',
      icon: <Cpu className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/electrical',
    },
    {
      title: 'Mechanical',
      icon: <Cog className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/mechanical',
    },
    {
      title: 'Levitation & Propulsion',
      icon: <Rocket className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/levitation-propulsion',
    },
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'LoopMIT Control Center';
      case '/electrical':
        return 'Electrical Subsystem';
      case '/mechanical':
        return 'Mechanical Subsystem';
      case '/levitation-propulsion':
        return 'Levitation & Propulsion';
      default:
        return 'LoopMIT Control Center';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/':
        return 'Real-time sensor telemetry and system monitoring for hyperloop pod prototype';
      case '/electrical':
        return 'Power distribution, battery management, and electrical control systems';
      case '/mechanical':
        return 'Structural design, chassis, and mechanical components';
      case '/levitation-propulsion':
        return 'Magnetic levitation system and propulsion controls';
      default:
        return 'Real-time sensor telemetry and system monitoring for hyperloop pod prototype';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-foreground mb-2">
            <ShinyText 
              text={getPageTitle()} 
              speed={3}
              color="#373e43"
              shineColor="#ffffff"
              spread={120}
            />
          </h1>
          <p className="text-muted-foreground text-sm">
            {getPageDescription()}
          </p>
        </div>
        
        {/* Center - Floating Dock */}
        <div className="absolute left-[55%] transform -translate-x-1/2 top-1/2 -translate-y-1/2">
          <FloatingDock items={navItems} />
        </div>

        {/* Right - Action Buttons */}
        <div className="flex items-center gap-3">
          <StopBtn />
          <Button
            onClick={handleLogout}
            className="bg-[#39C3EF] hover:bg-[#39C3EF]/90 text-black transition font-medium duration-200 h-10 rounded-lg px-6 flex items-center justify-center gap-2"
            style={{
              boxShadow:
                "0px -1px 0px 0px #ffffff40 inset, 0px 1px 0px 0px #ffffff40 inset",
            }}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
