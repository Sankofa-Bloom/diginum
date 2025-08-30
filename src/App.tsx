import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import BuyPage from "./pages/BuyPage";

import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import TestApiConnection from "./TestApiConnection";
import TestAuth from "./pages/TestAuth";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import AddFunds from "./pages/AddFunds";
import PaymentSuccess from "./pages/PaymentSuccess";
import { useCSRFToken } from '@/lib/csrf';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/auth';

// Create a wrapper component to handle authentication state
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        await getCurrentUser();
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/support" element={<Support />} />
      
      {/* Protected routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route 
          path="buy" 
          element={
            <ProtectedRoute>
              <BuyPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="add-funds" 
          element={
            <ProtectedRoute>
              <AddFunds />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Payment routes */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
      {/* Temporary test routes - remove in production */}
      <Route path="/test-api" element={<TestApiConnection />} />
      <Route path="/test-auth" element={<TestAuth />} />
    </Routes>
  );
}

export default function App() {
  useCSRFToken();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <AuthWrapper>
              <TooltipProvider>
                <AppRoutes />
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </AuthWrapper>
          </BrowserRouter>
        </CurrencyProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
