import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Toolbar from "./Toolbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  EnerTwin
                </h1>
              </div>
            </div>
            <Toolbar />
          </header>
          
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
      
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
};

export default Layout;