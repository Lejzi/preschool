import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { AppShell } from "@/components/layout/AppShell";
import { AuthLayout } from "@/components/layout/AuthLayout";

// Auth pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";

// App pages
import { DashboardPage } from "@/pages/DashboardPage";
import { AttendancePage } from "@/pages/AttendancePage";
import { MenuPage } from "@/pages/MenuPage";
import { MenuBuilderPage } from "@/pages/MenuBuilderPage";
import { ActivitiesPage } from "@/pages/ActivitiesPage";
import { AnnouncementsPage } from "@/pages/AnnouncementsPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { ConversationPage } from "@/pages/ConversationPage";
import { KidsPage } from "@/pages/KidsPage";
import { KidProfilePage } from "@/pages/KidProfilePage";
import { GroupsPage } from "@/pages/GroupsPage";
import { StaffPage } from "@/pages/StaffPage";
import { BillingPage } from "@/pages/BillingPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SuperAdminPage } from "@/pages/superadmin/SuperAdminPage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LandingPage } from "@/pages/LandingPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user, role, initialized } = useAuthStore();
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "superadmin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function Router() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const unsub = initialize();
    return unsub;
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Super Admin */}
        <Route
          path="/superadmin/*"
          element={
            <RequireSuperAdmin>
              <AppShell>
                <Routes>
                  <Route index element={<SuperAdminPage />} />
                </Routes>
              </AppShell>
            </RequireSuperAdmin>
          }
        />

        {/* Preschool App */}
        <Route
          path="/:preschoolCode/*"
          element={
            <RequireAuth>
              <AppShell>
                <Routes>
                  <Route index element={<DashboardPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="menu" element={<MenuPage />} />
                  <Route path="menu/builder" element={<MenuBuilderPage />} />
                  <Route path="activities" element={<ActivitiesPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route
                    path="messages/:conversationId"
                    element={<ConversationPage />}
                  />
                  <Route path="kids" element={<KidsPage />} />
                  <Route path="kids/:kidId" element={<KidProfilePage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="staff" element={<StaffPage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Routes>
              </AppShell>
            </RequireAuth>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function NoPreshoolPage() {
  const { logout } = useAuthStore();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Brak przypisanego przedszkola
      </h1>
      <p className="text-slate-500 mb-6 max-w-md">
        Twoje konto nie jest jeszcze przypisane do żadnego przedszkola.
        Skontaktuj się z administracją przedszkola, aby uzyskać dostęp.
      </p>
      <button onClick={() => logout()} className="btn-primary">
        Wyloguj się
      </button>
    </div>
  );
}

function RootRedirect() {
  const { user, role, preschoolCode, initialized } = useAuthStore();
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (!user) return <LandingPage />;
  if (role === "superadmin") return <Navigate to="/superadmin" replace />;
  if (preschoolCode) return <Navigate to={`/${preschoolCode}`} replace />;
  return <NoPreshoolPage />;
}
