import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Wardrobe from "@/pages/Wardrobe";
import AddItem from "@/pages/AddItem";
import BatchAddItems from "@/pages/BatchAddItems";
import Shop from "@/pages/Shop";
import Outfits from "@/pages/Outfits";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import SharedWardrobe from "@/pages/SharedWardrobe";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CookieConsent from "@/components/CookieConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/shared/:token" element={<SharedWardrobe />} />
          <Route path="/" element={<Navigate to="/wardrobe" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/wardrobe/add" element={<AddItem />} />
            <Route path="/wardrobe/batch" element={<BatchAddItems />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/outfits" element={<Outfits />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
