import { Route, Routes } from "react-router-dom";
import { SideNavigation } from "./app/components/SideNavigation";
import { ESPProvider } from "./app/context/ESPContext";
import { BrowserRouter } from "react-router-dom";
import { ControlBoard } from "./app/components/ControlBoard";
import { Dashboard } from "./app/pages/Dashboard";
import { Electrical } from "./app/pages/Electrical";
import { Mechanical } from "./app/pages/Mechanical";
import { LevitationPropulsion } from "./app/pages/LevitationPropulsion";
import React from "react";
export default function MainPage() {
    return (  
        
<ESPProvider>
      <BrowserRouter>
      
        <div className="dark min-h-screen bg-background text-foreground">
          <SideNavigation />
          <ControlBoard />
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/electrical" element={<Electrical />} />
            <Route path="/mechanical" element={<Mechanical />} />
            <Route path="/levitation-propulsion" element={<LevitationPropulsion />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ESPProvider>

    )
}