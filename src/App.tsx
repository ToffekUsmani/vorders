
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ElevenLabsVoiceProvider } from "@/services/ElevenLabsVoiceService";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import Setup from "./pages/Setup";
import HelpPage from "./pages/Help";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  // If loading, don't redirect yet
  if (isLoading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/register" replace />;
  }
  
  return <>{children}</>;
};

// Initial route component that redirects to register if not authenticated
const InitialRoute = () => {
  const { user, isLoading } = useAuth();
  
  // If loading, don't redirect yet
  if (isLoading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/register" replace />;
  }
  
  return <Index />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<InitialRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/checkout" element={
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ElevenLabsVoiceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ElevenLabsVoiceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
