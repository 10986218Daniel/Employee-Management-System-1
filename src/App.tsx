import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster as HotToaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Index from "./pages/Index";
import AuthPage from "./pages/auth/index";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import EmployeeDashboard from "@/pages/dashboard/employee/index";
import EmployeeProfile from "@/pages/dashboard/employee/profile";
import EmployeeAttendance from "@/pages/dashboard/employee/attendance";
import HRDashboard from "@/pages/dashboard/hr/index";
import AdminDashboard from "@/pages/dashboard/admin/index";
import Messages from "@/pages/dashboard/messages";
import Notifications from "@/pages/dashboard/notifications";
import Requests from "@/pages/dashboard/requests";
import Settings from "@/pages/dashboard/settings";

// New Pages
import GPSTracker from "@/pages/dashboard/gps-tracker";
import Announcements from "@/pages/dashboard/announcements";

// HR Pages
import EmployeeManagement from "@/pages/dashboard/hr/employees";
import HRProfile from "@/pages/dashboard/hr/profile";

// Admin Pages
import UserManagement from "@/pages/dashboard/admin/users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HotToaster position="top-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Redirect /dashboard to employee by default */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/employee" replace />} />
              
              {/* Employee Dashboard Routes */}
              <Route path="/dashboard/employee" element={<DashboardLayout requiredRole="employee" />}>
                <Route index element={<EmployeeDashboard />} />
                <Route path="profile" element={<EmployeeProfile />} />
                <Route path="attendance" element={<EmployeeAttendance />} />
                <Route path="messages" element={<Messages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="requests" element={<Requests />} />
                <Route path="settings" element={<Settings />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="performance" element={<div className="p-6"><h1>Performance Dashboard</h1><p>Coming soon...</p></div>} />
              </Route>
              
              {/* HR Dashboard Routes */}
              <Route path="/dashboard/hr" element={<DashboardLayout requiredRole="hr" />}>
                <Route index element={<HRDashboard />} />
                <Route path="profile" element={<HRProfile />} />
                <Route path="attendance" element={<EmployeeAttendance />} />
                <Route path="messages" element={<Messages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="requests" element={<Requests />} />
                <Route path="settings" element={<Settings />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="employees" element={<EmployeeManagement />} />
                <Route path="performance" element={<div className="p-6"><h1>Performance Management</h1><p>Coming soon...</p></div>} />
                <Route path="reports" element={<div className="p-6"><h1>Reports</h1><p>Coming soon...</p></div>} />
                <Route path="departments" element={<div className="p-6"><h1>Departments</h1><p>Coming soon...</p></div>} />
                <Route path="analytics" element={<div className="p-6"><h1>Analytics</h1><p>Coming soon...</p></div>} />
              </Route>
              
              {/* Admin Dashboard Routes */}
              <Route path="/dashboard/admin" element={<DashboardLayout requiredRole="admin" />}>
                <Route index element={<AdminDashboard />} />
                <Route path="profile" element={<EmployeeProfile />} />
                <Route path="attendance" element={<EmployeeAttendance />} />
                <Route path="messages" element={<Messages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="requests" element={<Requests />} />
                <Route path="settings" element={<Settings />} />
                <Route path="announcements" element={<Announcements />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;