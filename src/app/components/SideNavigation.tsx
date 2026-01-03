import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, X, Home, Cpu, Cog, Rocket } from 'lucide-react';
import React from 'react';

export function SideNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home className="size-5" /> },
    { path: '/electrical', label: 'Electrical', icon: <Cpu className="size-5" /> },
    { path: '/mechanical', label: 'Mechanical', icon: <Cog className="size-5" /> },
    { path: '/levitation-propulsion', label: 'Levitation & Propulsion', icon: <Rocket className="size-5" /> },
  ];

  return (
    <>
      {/* Menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Side panel */}
      <motion.nav
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40 p-6"
      >
        <div className="mt-16">
          <h2 className="mb-6 text-foreground">loopMIT</h2>
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
