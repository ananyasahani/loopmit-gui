import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ESPProvider } from './context/ESPContext';
import { SideNavigation } from './components/SideNavigation';
import { ControlBoard } from './components/ControlBoard';
import { Dashboard } from './pages/Dashboard';
import { Electrical } from './pages/Electrical';
import { Mechanical } from './pages/Mechanical';
import { LevitationPropulsion } from './pages/LevitationPropulsion';
import React from 'react';

export default function App() {
  return (
    <ESPProvider>
      <BrowserRouter>
        <div className="dark min-h-screen bg-background text-foreground">
          <SideNavigation />
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/electrical" element={<Electrical />} />
            <Route path="/mechanical" element={<Mechanical />} />
            <Route path="/levitation-propulsion" element={<LevitationPropulsion />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ESPProvider>
  );
}