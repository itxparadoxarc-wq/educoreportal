import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Fees from "./pages/Fees";
import Attendance from "./pages/Attendance";
import Academics from "./pages/Academics";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/students"
            element={
              <DashboardLayout>
                <Students />
              </DashboardLayout>
            }
          />
          <Route
            path="/fees"
            element={
              <DashboardLayout>
                <Fees />
              </DashboardLayout>
            }
          />
          <Route
            path="/attendance"
            element={
              <DashboardLayout>
                <Attendance />
              </DashboardLayout>
            }
          />
          <Route
            path="/academics"
            element={
              <DashboardLayout>
                <Academics />
              </DashboardLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;