import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, Loader2, UsersRound, Pencil, Trash2, Search } from "lucide-react";
import { useGroups, useSaveGroup, useDeleteGroup } from "@/hooks/useGroups";
import { useKids } from "@/hooks/useKids";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { useStaff } from "@/hooks/useStaff";
import type { Group } from "@przedszkole/shared";

function localizeGroupError(message: string) {
  if (message.includes("Missing or insufficient permissions")) {
    return "Brak uprawnień do zapisania grupy. Upewnij się, że wdrożono najnowsze reguły Firestore i że Twoje konto ma właściwą rolę.";
  }
  if (message.includes("offline")) {
    return "Brak połączenia z internetem. Spróbuj ponownie za chwilę.";
  }
  return "Nie udało się zapisać grupy.";
}

export function GroupsPage() {
  const { t } = useTranslation();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const isAdmin = role === "admin" || role === "superadmin";

  const { data: groups = [], isLoading } = useGroups(preschoolId || "");
  const { data: kids = [] } = useKids(preschoolId || "");
  const { data: staff = [] } = useStaff(preschoolId || "");
  const { mutate: saveGroup, isPending: isSaving } = useSaveGroup();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [ageRange, setAgeRange] = useState("");
  const [description, setDescription] = useState("");
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const normalizedTeacherSearch = teacherSearch.trim().toLowerCase();
  const filteredStaff = staff.filter((teacher) =>
    !normalizedTeacherSearch ||
    teacher.displayName.toLowerCase().includes(normalizedTeacherSearch) ||
    teacher.email.toLowerCase().includes(normalizedTeacherSearch),
  );

  const resetForm = () => {
    setEditingGroupId(null);
    setName("");
    setColor("#3b82f6");
    setAgeRange("");
    setDescription("");
    setTeacherIds([]);
    setTeacherSearch("");
  };

  const openCreateModal = () => {
    resetForm();
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroupId(group.id);
    setName(group.name || "");
    setColor(group.colorHex || "#3b82f6");
    setAgeRange(group.ageRange || "");
    setDescription(group.description || "");
    setTeacherIds(group.teacherIds || []);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preschoolId) {
      setError("Brak przypisanego przedszkola do tego konta.");
      return;
    }
    if (!name.trim()) return;

    setError(null);
    setSuccess(null);

    saveGroup(
      {
        id: editingGroupId || undefined,
        preschoolId,
        name: name.trim(),
        colorHex: color,
        ageRange: ageRange.trim() || undefined,
        description: description.trim() || undefined,
        teacherIds,
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
          setSuccess(t("groups.saveSuccess"));
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "";
          setError(localizeGroupError(message) || t("groups.saveError"));
        },
      }
    );
  };

  const handleDelete = (group: Group) => {
    if (!preschoolId) return;

    const assignedKidsCount = kids.filter((kid) => kid.groupId === group.id).length;
    if (assignedKidsCount > 0) {
      setError(t("groups.deleteBlockedHasKids"));
      return;
    }

    if (!window.confirm(t("groups.confirmDelete"))) return;

    setError(null);
    setSuccess(null);
    deleteGroup(
      { preschoolId, groupId: group.id },
      {
        onSuccess: () => {
          setSuccess(t("groups.deleteSuccess"));
        },
        onError: () => {
          setError(t("groups.deleteError"));
        },
      },
    );
  };

  const toggleTeacher = (teacherId: string) => {
    setTeacherIds((current) =>
      current.includes(teacherId)
        ? current.filter((id) => id !== teacherId)
        : [...current, teacherId],
    );
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("groups.title")}</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            {t("groups.addGroup")}
          </button>
        )}
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && !isModalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading || isResolvingPreschool ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="card text-center py-12 text-slate-500 border-dashed">
          <UsersRound className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>{t("groups.noGroups", "Brak grup")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div
              key={g.id}
              className="card"
              style={{ borderTop: `4px solid ${g.colorHex || "#ccc"}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 text-lg">{g.name}</p>
                  {g.ageRange && (
                    <p className="text-sm text-slate-500 mt-1">{g.ageRange}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      className="btn-ghost p-2"
                      onClick={() => openEditModal(g)}
                      aria-label={t("groups.editGroup")}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn-ghost p-2 text-red-500"
                      onClick={() => handleDelete(g)}
                      disabled={isDeleting}
                      aria-label={t("groups.deleteGroup")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              {g.description && (
                <p className="text-sm text-slate-500 mt-2">{g.description}</p>
              )}
              <p className="text-sm text-slate-500 mt-3">
                👩‍🏫 {t("groups.teacherCount", { count: g.teacherIds?.length || 0 })}
              </p>
              <p className="text-sm text-slate-500">
                👦 {t("groups.kidCount", { count: kids.filter((kid) => kid.groupId === g.id).length })}
              </p>
              {g.teacherIds?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.teacherIds.map((teacherId) => {
                    const teacher = staff.find((item) => item.id === teacherId);
                    if (!teacher) return null;
                    return (
                      <span key={teacherId} className="badge-blue">
                        {teacher.displayName}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingGroupId ? t("groups.editGroup") : t("groups.addGroup")}
              </h2>
              <button disabled={isSaving} className="btn-ghost p-2" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="label">{t("common.name", "Nazwa grupy")}</label>
                <input
                  required
                  autoFocus
                  className="input"
                  placeholder="np. Biedronki"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t("groups.ageRange")}</label>
                <input
                  className="input"
                  placeholder="np. 3-4 lata"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t("groups.description")}</label>
                <textarea
                  className="input min-h-24 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t("groups.groupColor")}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                  <span className="text-sm font-mono text-slate-500">{color}</span>
                </div>
              </div>

              <div>
                <label className="label">{t("groups.teacherAssignment")}</label>
                {staff.length === 0 ? (
                  <p className="text-sm text-slate-500">{t("groups.noTeachersAvailable")}</p>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        className="input pl-9"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder={t("groups.teacherSearchPlaceholder")}
                      />
                    </div>
                    <div className="max-h-[250px] space-y-2 overflow-y-auto pr-1">
                      {filteredStaff.map((teacher) => (
                        <label
                          key={teacher.id}
                          className="flex min-h-10 items-center justify-between gap-3 text-sm text-slate-700"
                        >
                          <span>{teacher.displayName}</span>
                          <input
                            type="checkbox"
                            checked={teacherIds.includes(teacher.id)}
                            onChange={() => toggleTeacher(teacher.id)}
                          />
                        </label>
                      ))}
                      {filteredStaff.length === 0 && (
                        <p className="py-2 text-sm text-slate-500">{t("groups.noTeachersAvailable")}</p>
                      )}
                    </div>
                  </div>
                )}
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
