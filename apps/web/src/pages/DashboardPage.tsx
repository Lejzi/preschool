import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import {
  CalendarDays,
  MessageCircle,
  Megaphone,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Baby,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { clsx } from "clsx";
import { format } from "date-fns";
import { useKids } from "@/hooks/useKids";
import { useAttendanceDay } from "@/hooks/useAttendance";
import { useConversations } from "@/hooks/useMessages";
import { useInvoices } from "@/hooks/useBilling";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useActivePreschoolContext } from "@/hooks/usePreschool";

export function DashboardPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const { preschoolCode } = useParams();
  const firstName = userProfile?.displayName?.split(" ")[0] ?? "";

  const { data: allKids = [] } = useKids(preschoolId || "");
  const visibleKids = useMemo(() => {
    if (!userProfile) return [];
    if (role === "parent") {
      return allKids.filter(
        (kid) =>
          kid.parentIds?.includes(userProfile.id) ||
          userProfile.linkedKidIds?.includes(kid.id),
      );
    }
    return allKids;
  }, [allKids, role, userProfile]);

  const { data: todayAttendance } = useAttendanceDay(
    preschoolId || "",
    format(new Date(), "yyyy-MM-dd"),
  );
  const { data: conversations = [] } = useConversations(
    preschoolId || "",
    userProfile?.id || "",
  );
  const { data: invoices = [] } = useInvoices(
    preschoolId || "",
    role === "parent" ? visibleKids.map((kid) => kid.id) : undefined,
  );
  const { data: announcements = [] } = useAnnouncements(preschoolId || "");

  const presentCount = Object.values(todayAttendance?.entries || {}).filter(
    (entry) => entry.status === "present" || entry.status === "late",
  ).length;
  const pendingAttendance = Math.max(0, visibleKids.length - Object.keys(todayAttendance?.entries || {}).length);
  const unreadMessages = conversations.filter(
    (conv) => conv.lastMessage && !conv.lastMessage.read && conv.lastMessage.senderId !== userProfile?.id,
  ).length;
  const overdueInvoices = invoices.filter((invoice) => {
    if (invoice.status === "overdue") return true;
    if (invoice.status !== "sent") return false;
    if (typeof invoice.dueDate === "object" && invoice.dueDate && "seconds" in invoice.dueDate) {
      return new Date(invoice.dueDate.seconds * 1000) < new Date();
    }
    if (typeof invoice.dueDate === "string") {
      return new Date(invoice.dueDate) < new Date();
    }
    return false;
  }).length;
  const recentAnnouncements = announcements.slice(0, 3);
  const dummyAlerts = useMemo(
    () => [
      {
        id: "alert-1",
        title: t("dashboard.alerts.items.lateArrival.title"),
        message: t("dashboard.alerts.items.lateArrival.message"),
        time: "08:05",
        tone: "warning" as const,
      },
      {
        id: "alert-2",
        title: t("dashboard.alerts.items.pickupChange.title"),
        message: t("dashboard.alerts.items.pickupChange.message"),
        time: "12:20",
        tone: "info" as const,
      },
      {
        id: "alert-3",
        title: t("dashboard.alerts.items.absence.title"),
        message: t("dashboard.alerts.items.absence.message"),
        time: "07:12",
        tone: "neutral" as const,
      },
    ],
    [t],
  );

  if (isResolvingPreschool) {
    return (
      <div className="flex justify-center py-12">
        <CheckCircle className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dzień dobry, {firstName} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("pl-PL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {(role === "admin" || role === "teacher" || role === "superadmin") && (
        <AdminTeacherDashboard
          preschoolCode={preschoolCode!}
          presentCount={presentCount}
          pendingAttendance={pendingAttendance}
          unreadMessages={unreadMessages}
          overdueInvoices={overdueInvoices}
          recentAnnouncements={recentAnnouncements}
          alerts={dummyAlerts}
        />
      )}

      {role === "parent" && (
        <ParentDashboard
          preschoolCode={preschoolCode!}
          kidsCount={visibleKids.length}
          unreadMessages={unreadMessages}
          overdueInvoices={overdueInvoices}
          recentAnnouncements={recentAnnouncements.length}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  to,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  color: string;
  to?: string;
}) {
  const inner = (
    <div className="card flex items-center gap-4 hover:shadow-[var(--shadow-elevated)] transition-all duration-200 active:scale-[0.99]">
      <div className={clsx("p-3 rounded-xl", color)}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function AdminTeacherDashboard({
  preschoolCode,
  presentCount,
  pendingAttendance,
  unreadMessages,
  overdueInvoices,
  recentAnnouncements,
  alerts,
}: {
  preschoolCode: string;
  presentCount: number;
  pendingAttendance: number;
  unreadMessages: number;
  overdueInvoices: number;
  recentAnnouncements: Array<{ id: string; title: string; authorName: string }>;
  alerts: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    tone: "warning" | "info" | "neutral";
  }>;
}) {
  const { t } = useTranslation();
  const toneStyles = {
    warning: "border-amber-200 bg-amber-50",
    info: "border-blue-200 bg-blue-50",
    neutral: "border-slate-200 bg-slate-50",
  } as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle}
          label="Obecnych dziś"
          value={presentCount}
          color="bg-green-500"
          to={`/${preschoolCode}/attendance`}
        />
        <StatCard
          icon={Clock}
          label="Do sprawdzenia"
          value={pendingAttendance}
          color="bg-yellow-500"
          to={`/${preschoolCode}/attendance`}
        />
        <StatCard
          icon={MessageCircle}
          label="Nowych wiadomości"
          value={unreadMessages}
          color="bg-blue-500"
          to={`/${preschoolCode}/messages`}
        />
        <StatCard
          icon={AlertCircle}
          label="Zaległe faktury"
          value={overdueInvoices}
          color="bg-red-500"
          to={`/${preschoolCode}/billing`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Lista obecności",
            to: `/${preschoolCode}/attendance`,
            icon: CalendarDays,
            desc: "Zaznacz obecność dzieci",
          },
          {
            label: "Jadłospis tygodnia",
            to: `/${preschoolCode}/menu`,
            icon: "🥗",
            desc: "Podgląd i edycja jadłospisu",
          },
          {
            label: "Nowe ogłoszenie",
            to: `/${preschoolCode}/announcements`,
            icon: Megaphone,
            desc: "Opublikuj dla rodziców",
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all duration-200 block"
          >
            <div className="text-2xl mb-2">
              {typeof item.icon === "string" ? item.icon : <item.icon size={24} className="text-brand-600" />}
            </div>
            <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{t("dashboard.recentAnnouncements.title")}</h2>
          <Link to={`/${preschoolCode}/announcements`} className="text-sm text-brand-600 hover:underline">
            {t("dashboard.recentAnnouncements.viewAll")}
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-slate-500">{t("dashboard.recentAnnouncements.empty")}</p>
          ) : (
            recentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <p className="font-medium text-slate-800">{announcement.title}</p>
                <p className="text-xs text-slate-500">{announcement.authorName}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t("dashboard.alerts.title")}</h2>
            <p className="text-sm text-slate-500">{t("dashboard.alerts.subtitle")}</p>
          </div>
          <span className="badge-blue">{alerts.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={clsx(
                "rounded-2xl border px-4 py-3",
                toneStyles[alert.tone],
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-500">{alert.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ParentDashboard({
  preschoolCode,
  kidsCount,
  unreadMessages,
  overdueInvoices,
  recentAnnouncements,
}: {
  preschoolCode: string;
  kidsCount: number;
  unreadMessages: number;
  overdueInvoices: number;
  recentAnnouncements: number;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Baby} label="Moje dzieci" value={kidsCount} color="bg-brand-600" to={`/${preschoolCode}/kids`} />
        <StatCard icon={MessageCircle} label="Nieprzeczytane" value={unreadMessages} color="bg-blue-500" to={`/${preschoolCode}/messages`} />
        <StatCard icon={CreditCard} label="Do opłacenia" value={overdueInvoices} color="bg-red-500" to={`/${preschoolCode}/billing`} />
        <StatCard icon={Megaphone} label="Nowe ogłoszenia" value={recentAnnouncements} color="bg-amber-500" to={`/${preschoolCode}/announcements`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            label: "Sprawdź jadłospis",
            to: `/${preschoolCode}/menu`,
            emoji: "🥗",
            desc: "Co dziś na obiad?",
          },
          {
            label: "Plan dnia",
            to: `/${preschoolCode}/activities`,
            emoji: "📅",
            desc: "Aktywności i zajęcia",
          },
          {
            label: "Wiadomości",
            to: `/${preschoolCode}/messages`,
            emoji: "💬",
            desc: "Napisz do nauczyciela",
          },
          {
            label: "Płatności",
            to: `/${preschoolCode}/billing`,
            emoji: "💳",
            desc: "Stan rozliczeń",
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4"
          >
            <span className="text-3xl">{item.emoji}</span>
            <div>
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
