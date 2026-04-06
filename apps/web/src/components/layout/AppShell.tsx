import { useState } from "react";
import { Outlet, NavLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UtensilsCrossed,
  Activity,
  Megaphone,
  MessageCircle,
  Baby,
  UsersRound,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = (preschoolCode: string, role: string | null) => {
  const base = [
    {
      to: `/${preschoolCode}`,
      label: "nav.dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: `/${preschoolCode}/attendance`,
      label: "nav.attendance",
      icon: CalendarDays,
    },
    { to: `/${preschoolCode}/menu`, label: "nav.menu", icon: UtensilsCrossed },
    {
      to: `/${preschoolCode}/activities`,
      label: "nav.activities",
      icon: Activity,
    },
    {
      to: `/${preschoolCode}/announcements`,
      label: "nav.announcements",
      icon: Megaphone,
    },
    {
      to: `/${preschoolCode}/messages`,
      label: "nav.messages",
      icon: MessageCircle,
    },
  ];
  const staffOnly = [
    { to: `/${preschoolCode}/kids`, label: "nav.kids", icon: Baby },
    { to: `/${preschoolCode}/groups`, label: "nav.groups", icon: UsersRound },
  ];
  const adminOnly = [
    { to: `/${preschoolCode}/staff`, label: "nav.staff", icon: Users },
    { to: `/${preschoolCode}/billing`, label: "nav.billing", icon: CreditCard },
    { to: `/${preschoolCode}/settings`, label: "nav.settings", icon: Settings },
  ];

  let items = [...base];
  if (role === "admin" || role === "teacher") items = [...items, ...staffOnly];
  if (role === "admin") items = [...items, ...adminOnly];
  return items;
};

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { preschoolCode, role, userProfile, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const params = useParams();
  
  // If a superadmin is browsing a specific preschool, the URL param overrides their empty store code
  const code = params.preschoolCode || preschoolCode || "";
  const isSuperAdminRoot = window.location.pathname.startsWith("/superadmin");

  // If superadmin is in the root panel, show only the panel link.
  // Otherwise, if they clicked into a preschool, treat them as an admin for the sidebar
  let items = navItems(code, role === "superadmin" ? "admin" : role);
  
  if (isSuperAdminRoot && role === "superadmin") {
    items = [
      {
        to: "/superadmin",
        label: "nav.superadmin",
        icon: ShieldCheck,
        // we don't need end: true here because the children routes are handled
      },
    ];
  } else if (role === "superadmin") {
    // Add a "Back to Panel" button at the top of the sidebar when inside a preschool
    items = [
      {
        to: "/superadmin",
        label: "nav.superadmin", // Could also be common.back
        icon: ShieldCheck,
      },
      ...items,
    ];
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "pl" ? "en" : "pl");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <span className="text-2xl shrink-0">🏫</span>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight text-white truncate">
                Przedszkole App
              </p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {code}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? item.end : false}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-brand-600 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                )
              }
              title={collapsed ? t(item.label) : undefined}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{t(item.label)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user info + lang + logout */}
        <div className="border-t border-slate-700/50 p-3 space-y-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Switch language"
          >
            <Globe size={15} className="shrink-0" />
            {!collapsed && (
              <span>{i18n.language === "pl" ? "🇵🇱 Polski" : "🇬🇧 English"}</span>
            )}
          </button>

          {!collapsed && userProfile && (
            <div className="px-3 py-2 rounded-lg bg-slate-800">
              <p className="text-xs font-medium text-white truncate">
                {userProfile.displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {userProfile.email}
              </p>
            </div>
          )}

          <button
            onClick={() => logout()}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
            title={t("auth.logout")}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>{t("auth.logout")}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white border border-slate-600 hover:bg-slate-600 transition-all z-10"
          style={{
            position: "sticky",
            bottom: 80,
            alignSelf: "flex-end",
            marginRight: -12,
            marginBottom: 8,
          }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
