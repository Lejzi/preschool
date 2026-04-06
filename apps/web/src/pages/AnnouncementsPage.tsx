import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import {
  Pin,
  MessageSquare,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Megaphone,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";
import { useAnnouncements, useSaveAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { format } from "date-fns";
import type { Announcement } from "@przedszkole/shared";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";
import { useGroups } from "@/hooks/useGroups";

export function AnnouncementsPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const isStaff = role === "admin" || role === "teacher";

  const { data: announcements = [], isLoading } = useAnnouncements(preschoolId || "");
  const { data: groups = [] } = useGroups(preschoolId || "");
  const { mutate: saveAnnouncement, isPending: isSaving } = useSaveAnnouncement();
  const { mutate: deleteAnn, isPending: isDeleting } = useDeleteAnnouncement();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showComment, setShowComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [newTarget, setNewTarget] = useState<"all" | "group">("all");
  const [newGroupStr, setNewGroupStr] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !preschoolId ||
      !newTitle ||
      !newBody ||
      !userProfile?.displayName ||
      (newTarget === "group" && !newGroupStr)
    ) {
      return;
    }

    saveAnnouncement(
      {
        preschoolId,
        title: newTitle,
        body: newBody,
        authorName: userProfile.displayName,
        targetType: newTarget,
        targetGroupId: newTarget === "group" ? newGroupStr : null,
        isPinned: newPinned,
        comments: [], // explicit initial
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setNewTitle("");
          setNewBody("");
          setNewPinned(false);
          setNewTarget("all");
          setNewGroupStr("");
        },
      }
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Na pewno usunąć to ogłoszenie?")) {
      deleteAnn({ preschoolId: preschoolId || "", id });
    }
  };

  const handleSendComment = (annId: string, currentComments: Announcement["comments"]) => {
    if (!preschoolId || !userProfile?.displayName || !commentText.trim()) return;

    const newComment = {
      authorName: userProfile.displayName,
      text: commentText.trim(),
      createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
    };

    saveAnnouncement({
      preschoolId,
      id: annId,
      comments: [...(currentComments || []), newComment],
    }, {
      onSuccess: () => {
        setCommentText("");
        setShowComment(null);
      }
    });
  };

  // Sort pinned to top dynamically
  const sortedAnnouncements = useMemo(() => {
    const pinned = announcements.filter(a => a.isPinned);
    const unpinned = announcements.filter(a => !a.isPinned);
    return [...pinned, ...unpinned];
  }, [announcements]);

  // Expand the newest pinned item by default if nothing else is chosen
  const defaultExpandedId = expanded ?? (sortedAnnouncements[0]?.isPinned ? sortedAnnouncements[0].id : null);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("announcements.title")}</h1>
        {isStaff && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            {t("announcements.newAnnouncement")}
          </button>
        )}
      </div>

      {isLoading || isResolvingPreschool ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : sortedAnnouncements.length === 0 ? (
        <div className="card text-center py-12 text-slate-500 border-dashed">
          <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>{t("announcements.noAnnouncements", "Brak ogłoszeń")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={clsx(
                "card transition-all",
                ann.isPinned && "border-l-4 border-l-brand-500",
              )}
            >
              <button
                className="w-full text-left"
                onClick={() => setExpanded(defaultExpandedId === ann.id ? "" : ann.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ann.isPinned && (
                        <span className="badge-blue flex items-center gap-1">
                          <Pin size={10} /> {t("announcements.pinned")}
                        </span>
                      )}
                      {ann.targetType === "group" && (
                        <span className="badge-yellow">
                          {t("announcements.targetGroup", {
                            group:
                              groups.find((group) => group.id === ann.targetGroupId)?.name ||
                              ann.targetGroupId ||
                              "Nieznana grupa",
                          })}
                        </span>
                      )}
                      {ann.targetType === "all" && (
                        <span className="badge-slate">
                          {t("announcements.targetAll")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mt-1.5 flex items-center gap-2">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ann.authorName}
                      {ann.createdAt?.seconds && ` · ${format(new Date(ann.createdAt.seconds * 1000), "d MMM yyyy")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isStaff && (
                      <button
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        onClick={(e) => handleDelete(ann.id, e)}
                        disabled={isDeleting}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <span className="text-slate-400 mt-1">
                      {defaultExpandedId === ann.id ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </span>
                  </div>
                </div>
              </button>

              {defaultExpandedId === ann.id && (
                <div className="mt-4 animate-fade-in">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {ann.body}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t("announcements.comments")} ({(ann.comments || []).length})
                      </p>
                      <button
                        className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                        onClick={() =>
                          setShowComment(showComment === ann.id ? null : ann.id)
                        }
                      >
                        <MessageSquare size={12} />
                        {t("announcements.addComment")}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(ann.comments || []).map((c, idx) => (
                        <div key={idx} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0 uppercase">
                            {c.authorName[0]}
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-xs font-medium text-slate-700">
                              {c.authorName}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">
                              {c.text}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">{c.createdAt}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {showComment === ann.id && (
                      <div className="flex gap-2 mt-3 animate-slide-in">
                        <input
                          className="input flex-1 text-sm"
                          placeholder={t("announcements.addComment") + "..."}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button 
                          className="btn-primary px-3"
                          disabled={isSaving}
                          onClick={() => handleSendComment(ann.id, ann.comments)}
                        >
                          Wyślij 
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-lg animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">{t("announcements.newAnnouncement")}</h2>
              <button disabled={isSaving} className="btn-ghost p-2" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">{t("common.title", "Tytuł")}</label>
                <input
                  required
                  autoFocus
                  className="input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t("common.description", "Treść powiadomienia")}</label>
                <textarea
                  required
                  rows={4}
                  className="input resize-none"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Odbiorcy</label>
                  <Select
                    value={newTarget} 
                    onChange={(value) => setNewTarget(value as "all" | "group")}
                    options={[
                      { value: "all", label: "Wszyscy" },
                      { value: "group", label: "Wybrana grupa" },
                    ]}
                  />
                </div>
                {newTarget === "group" && (
                  <div>
                    <label className="label">Grupa</label>
                    <Select
                      value={newGroupStr}
                      onChange={setNewGroupStr}
                      placeholder="Wybierz grupę"
                      options={groups.map((group) => ({
                        value: group.id,
                        label: group.name,
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="pin-post"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <label htmlFor="pin-post" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                  Przypnij to ogłoszenie (ważne)
                </label>
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
