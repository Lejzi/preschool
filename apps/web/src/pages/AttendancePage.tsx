import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { format, addDays, subDays } from "date-fns";
import { pl } from "date-fns/locale";
import type { AttendanceStatus } from "@przedszkole/shared";
import { useKids } from "@/hooks/useKids";
import { useAttendanceDay, useSaveAttendance } from "@/hooks/useAttendance";
import { useGroups } from "@/hooks/useGroups";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  present: {
    label: "Obecny",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200 hover:bg-green-100",
    icon: <CheckCircle2 size={16} />,
  },
  absent: {
    label: "Nieobecny",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200 hover:bg-red-100",
    icon: <XCircle size={16} />,
  },
  late: {
    label: "Spóźniony",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    icon: <Clock size={16} />,
  },
  excused: {
    label: "Usprawiedliwiony",
    color: "text-slate-600",
    bgColor: "bg-slate-50 border-slate-200 hover:bg-slate-100",
    icon: <AlertCircle size={16} />,
  },
};

export function AttendancePage() {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const isEditable = role === "admin" || role === "teacher";

  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: kidsData = [], isLoading: isLoadingKids } = useKids(preschoolId || "");
  const { data: groupsData = [] } = useGroups(preschoolId || "");
  const { data: dayData, isLoading: isLoadingAttendance } = useAttendanceDay(preschoolId || "", dateStr);
  const { mutate: saveAttendance, isPending: isSaving } = useSaveAttendance();

  // Local state for optimistic UI toggling before save
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  useEffect(() => {
    // Only update local state if we don't have unsaved changes or if the day changed.
    // We compare a JSON string of entries to see if it changed to avoid deep equal loops.
    // A better approach for the future is separating server state and local draft state.
    if (!hasUnsavedChanges) {
      if (dayData && dayData.entries) {
        const serverState: Record<string, AttendanceStatus> = {};
        Object.entries(dayData.entries).forEach(([kidId, entry]) => {
          serverState[kidId] = entry.status;
        });
        setLocalAttendance(serverState);
      } else {
        setLocalAttendance({});
      }
    }
  }, [dayData, hasUnsavedChanges]);

  const groups = [...new Set(kidsData.map((k) => k.groupId || "Bez grupy"))];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredKids = kidsData.filter((kid) => {
    const fullName = `${kid.firstName} ${kid.lastName}`.toLowerCase();
    const matchesGroup = !groupFilter || (kid.groupId || "Bez grupy") === groupFilter;
    if (!matchesGroup) return false;
    if (!normalizedSearch) return true;
    return fullName.includes(normalizedSearch);
  });

  const counts = {
    present: Object.values(localAttendance).filter(
      (s) => s === "present" || s === "late",
    ).length,
    absent: Object.values(localAttendance).filter(
      (s) => s === "absent" || s === "excused",
    ).length,
  };

  const updateStatus = (kidId: string, next: AttendanceStatus) => {
    if (!isEditable) return;
    setLocalAttendance((prev) => ({ ...prev, [kidId]: next }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!preschoolId || !userProfile?.id) return;
    
    const entriesToSave: Record<string, { status: AttendanceStatus; recordedBy: string; kidId: string }> = {};
    Object.entries(localAttendance).forEach(([kidId, status]) => {
      entriesToSave[kidId] = {
        status,
        recordedBy: userProfile.id,
        kidId,
      };
    });

    saveAttendance(
      {
        preschoolId,
        dateStr,
        entries: entriesToSave,
      },
      {
        onSuccess: () => setHasUnsavedChanges(false)
      }
    );
  };

  const isLoading = isLoadingKids || isLoadingAttendance || isResolvingPreschool;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("attendance.title")}</h1>
        {/* Summary badges */}
        <div className="flex gap-2">
          <span className="badge-green">
            {t("attendance.totalPresent", { count: counts.present })}
          </span>
          <span className="badge-red">
            {t("attendance.totalAbsent", { count: Math.max(0, kidsData.length - counts.present) })}
          </span>
        </div>
      </div>

      {/* Date picker */}
      <div className="card flex items-center justify-between">
        <button
          onClick={() => setSelectedDate((d) => subDays(d, 1))}
          className="btn-ghost p-2"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-900 capitalize">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: pl })}
          </p>
        </div>
        <button
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          className="btn-ghost p-2"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
          <Select
            value={groupFilter}
            onChange={setGroupFilter}
            options={[
              { value: "", label: t("attendance.allGroups") },
              ...groups.map((group) => ({
                value: group,
                label: groupsData.find((item) => item.id === group)?.name || group,
              })),
            ]}
          />
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder={t("attendance.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Kids by group */}
          {groups.map((group) => {
            const kidsInGroup = filteredKids.filter((k) => (k.groupId || "Bez grupy") === group);
            if (kidsInGroup.length === 0) return null;

            const presentInGroup = kidsInGroup.filter((kid) => {
              const status = localAttendance[kid.id] || "absent";
              return status === "present" || status === "late";
            }).length;

            return (
              <div key={group} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {groupsData.find((item) => item.id === group)?.name || group}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {presentInGroup}/{kidsInGroup.length} obecnych
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {kidsInGroup.map((kid) => {
                    const status = localAttendance[kid.id] || "absent";
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <div
                        key={kid.id}
                        className={clsx(
                          "flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 text-left w-full",
                          cfg.bgColor,
                        )}
                      >
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-sm font-bold text-brand-700 shadow-sm shrink-0 uppercase">
                          {kid.firstName[0]?.[0]}
                          {kid.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {kid.firstName} {kid.lastName}
                          </p>
                          <div
                            className={clsx(
                              "flex items-center gap-1 text-xs mt-0.5",
                              cfg.color,
                            )}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </div>
                        </div>
                        <div className="w-40 shrink-0">
                          <Select
                            value={status}
                            disabled={!isEditable}
                            className="text-sm"
                            onChange={(value) =>
                              updateStatus(kid.id, value as AttendanceStatus)
                            }
                            options={[
                              { value: "absent", label: t("attendance.absent") },
                              { value: "present", label: t("attendance.present") },
                              { value: "late", label: t("attendance.late") },
                              { value: "excused", label: t("attendance.excused") },
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredKids.length === 0 && (
            <div className="card text-center py-12 text-slate-500 border-dashed">
              <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>{t("attendance.noSearchResults", "Brak wyników dla tego wyszukiwania.")}</p>
            </div>
          )}
        </>
      )}

      {isEditable && (
        <div className="flex justify-end sticky bottom-6">
          <button 
            className="btn-primary shadow-[var(--shadow-elevated)]" 
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={16} />}
            {hasUnsavedChanges ? "Zapisz obecność" : "Zapisane"}
          </button>
        </div>
      )}
    </div>
  );
}
