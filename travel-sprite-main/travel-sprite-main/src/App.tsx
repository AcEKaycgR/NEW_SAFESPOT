import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Map from "./pages/Map";
import Itinerary from "./pages/Itinerary";
import DigitalID from "./pages/DigitalID";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { PanicFAB } from "./components/ui/panic-fab";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page without layout */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          
          {/* App pages with layout */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/map" element={<Layout><Map /></Layout>} />
          <Route path="/itinerary" element={<Layout><Itinerary /></Layout>} />
          <Route path="/id" element={<Layout><DigitalID /></Layout>} />
          <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/assistant" element={<Layout><div className="min-h-screen bg-gradient-surface flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">🤖</div><h1 className="text-2xl font-display font-bold mb-2">AI Assistant</h1><p className="text-muted-foreground">Coming soon!</p></div></div></Layout>} />
          
          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <PanicFAB />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
