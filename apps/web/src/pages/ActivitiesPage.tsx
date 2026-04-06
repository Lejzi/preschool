import { useState } from "react";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import { useAuthStore } from "@/stores/authStore";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  BookMarked,
  X,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import plFullCalendarLocale from "@fullcalendar/core/locales/pl";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  format,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";
import { pl as plDateFns } from "date-fns/locale";
import {
  useActivitiesInRange,
  useDailyActivity,
  useSaveDailyActivity,
} from "@/hooks/useActivities";
import { useGroups } from "@/hooks/useGroups";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";
import type { ActivityItem } from "@przedszkole/shared";

const ACTIVITY_EMOJIS = [
  "🎨",
  "📚",
  "🎵",
  "🧩",
  "🏃",
  "🌳",
  "🍎",
  "🍿",
  "😴",
  "🧘",
  "🎭",
  "🧪",
  "✂️",
];

export function ActivitiesPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const isStaff = role === "admin" || role === "teacher";
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd");

  const { data: dailyActivity, isLoading } = useDailyActivity(preschoolId || "", dateStr);
  const { data: monthActivities = [], isLoading: isMonthLoading } = useActivitiesInRange(
    preschoolId || "",
    monthStart,
    monthEnd,
  );
  const { mutate: saveActivity, isPending: isSaving } = useSaveDailyActivity();
  const { data: groups = [] } = useGroups(preschoolId || "");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newTime, setNewTime] = useState("09:00");
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("✨");
  const [newGroup, setNewGroup] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  const openModal = (index?: number) => {
    if (typeof index === "number") {
      const item = activities[index];
      setNewTime(item.time);
      setNewTitle(item.title);
      setNewEmoji(item.emoji || "✨");
      setNewGroup(item.groupId || "");
      setEditingIndex(index);
    } else {
      setNewTime("09:00");
      setNewTitle("");
      setNewEmoji("✨");
      setNewGroup("");
      setEditingIndex(null);
    }
    setIsEmojiPickerOpen(false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preschoolId || !userProfile?.id || !newTime || !newTitle) return;

    const newItem: ActivityItem = {
      time: newTime,
      title: newTitle,
      emoji: newEmoji,
      groupId: newGroup || null,
    };

    const nextItems = [...activities];
    if (editingIndex !== null) {
      nextItems[editingIndex] = newItem;
    } else {
      nextItems.push(newItem);
    }
    
    saveActivity(
      {
        preschoolId,
        dateStr,
        items: nextItems,
        createdBy: userProfile.id,
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingIndex(null);
        },
      }
    );
  };

  const handleDelete = (index: number) => {
    if (!preschoolId || !userProfile?.id) return;
    if (!confirm(t("common.confirmDelete", "Czy na pewno chcesz usunąć tę aktywność?"))) return;

    const nextItems = activities.filter((_, i) => i !== index);
    
    saveActivity({
      preschoolId,
      dateStr,
      items: nextItems,
      createdBy: userProfile.id,
    });
  };

  const activities = dailyActivity?.items || [];
  const calendarEvents = monthActivities.map((day) => ({
    id: day.id,
    title:
      day.items.length === 1
        ? day.items[0]?.title || t("activities.addActivity")
        : `${day.items.length} aktywności`,
    start: day.dateStr,
    allDay: true,
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("activities.title")}</h1>
        {isStaff && (
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={16} />
            {t("activities.addActivity")}
          </button>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
            className="btn-ghost p-2"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="font-semibold text-slate-800 capitalize">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: plDateFns })}
          </p>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="btn-ghost p-2"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          dayCellClassNames={(arg) =>
            isSameDay(arg.date, selectedDate) ? ["fc-day-selected"] : []
          }
          initialView="dayGridMonth"
          height="auto"
          locale={plFullCalendarLocale}
          buttonText={{
            today: "Dzisiaj",
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          initialDate={selectedDate}
          datesSet={(arg) => {
            const currentViewMonth = arg.view.currentStart;
            if (
              currentViewMonth.getMonth() !== selectedDate.getMonth() ||
              currentViewMonth.getFullYear() !== selectedDate.getFullYear()
            ) {
              setSelectedDate((current) => {
                const next = new Date(current);
                next.setFullYear(currentViewMonth.getFullYear());
                next.setMonth(currentViewMonth.getMonth());
                return next;
              });
            }
          }}
          dateClick={(info) => {
            setSelectedDate(new Date(`${info.dateStr}T12:00:00`));
          }}
          events={calendarEvents}
          eventDisplay="block"
          dayMaxEvents={2}
          fixedWeekCount={false}
        />
      </div>

      {/* Timeline */}
      <div className="relative min-h-[300px]">
        {isLoading || isMonthLoading || isResolvingPreschool ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-100 border-dashed">
            <BookMarked className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>{t("activities.noActivitiesThisDay")}</p>
          </div>
        ) : (
          <>
            {/* Vertical line */}
            <div className="absolute left-[72px] top-0 bottom-0 w-px bg-slate-200" />

            <div className="space-y-2">
              {activities.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  {/* Time */}
                  <div className="w-14 text-right shrink-0 pt-3">
                    <span className="text-xs font-mono text-slate-400">
                      {item.time}
                    </span>
                  </div>

                  {/* Dot */}
                  <div className="relative shrink-0 flex items-start justify-center pt-3.5">
                    <div className="w-3 h-3 rounded-full bg-brand-500 border-2 border-white ring-2 ring-brand-200 z-10" />
                  </div>

                  {/* Card */}
                  <div className="flex-1 pb-2">
                    <div className="card py-3 px-4 flex items-center gap-3">
                      <span className="text-xl">{item.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {item.title}
                        </p>
                        {item.groupId && (
                          <span className="badge-blue mt-1">
                            {groups.find((group) => group.id === item.groupId)?.name || item.groupId}
                          </span>
                        )}
                      </div>
                      {isStaff && (
                        <div className="flex items-center gap-1">
                          <button 
                            className="btn-ghost p-1.5 text-slate-400 hover:text-brand-600"
                            onClick={() => openModal(idx)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button 
                            className="btn-ghost p-1.5 text-slate-400 hover:text-red-500"
                            onClick={() => handleDelete(idx)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingIndex !== null ? t("common.edit", "Edytuj") : t("activities.addActivity")}
              </h2>
              <button disabled={isSaving} className="btn-ghost p-2" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="label">{t("common.time")}</label>
                  <input
                    type="time"
                    required
                    className="input font-mono"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Emoji</label>
                  <div className="relative">
                    <button
                      type="button"
                      className="input flex items-center justify-between text-left"
                      onClick={() => setIsEmojiPickerOpen((open) => !open)}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{newEmoji}</span>
                        <span className="text-sm text-slate-600">Wybierz ikonę aktywności</span>
                      </span>
                      <span className="text-xs text-slate-400">▼</span>
                    </button>

                    {isEmojiPickerOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-elevated)]">
                        <div className="grid grid-cols-6 gap-2">
                          {ACTIVITY_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className={clsx(
                                "flex h-11 items-center justify-center rounded-lg border text-xl transition-all",
                                newEmoji === emoji
                                  ? "border-brand-600 bg-brand-100 shadow-sm"
                                  : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-slate-100",
                              )}
                              onClick={() => {
                                setNewEmoji(emoji);
                                setIsEmojiPickerOpen(false);
                              }}
                            >
                              <span>{emoji}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="label">{t("common.name")}</label>
                <input
                  required
                  autoFocus
                  className="input"
                  placeholder="Zajęcia plastyczne"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Grupa (opcjonalnie)</label>
                <Select
                  value={newGroup}
                  onChange={setNewGroup}
                  options={[
                    { value: "", label: "Całe przedszkole" },
                    ...groups.map((group) => ({
                      value: group.id,
                      label: group.name,
                    })),
                  ]}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" disabled={isSaving} className="btn-ghost flex-1" onClick={() => setIsModalOpen(false)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
