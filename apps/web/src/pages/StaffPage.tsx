import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Loader2, UserRound, X, Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  useInviteUser,
  useRemoveStaffMember,
  useStaff,
  useUpdateStaffMember,
} from "@/hooks/useStaff";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";

export function StaffPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const isAdmin = role === "admin" || role === "superadmin";

  const { data: staff = [], isLoading } = useStaff(preschoolId || "");
  const { mutate: inviteUser, isPending: isInviting } = useInviteUser();
  const { mutate: updateStaffMember, isPending: isUpdating } = useUpdateStaffMember();
  const { mutate: removeStaffMember, isPending: isRemoving } = useRemoveStaffMember();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<"teacher" | "admin">("teacher");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isSaving = isInviting || isUpdating;
  const roleLabels: Record<string, string> = {
    admin: t("staff.admin"),
    teacher: t("staff.teacher"),
    parent: t("staff.parent"),
    superadmin: t("staff.superadmin"),
  };

  const resetForm = () => {
    setEditingStaffId(null);
    setDisplayName("");
    setEmail("");
    setNewRole("teacher");
  };

  const openCreateModal = () => {
    resetForm();
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staffMember: (typeof staff)[number]) => {
    setEditingStaffId(staffMember.id);
    setDisplayName(staffMember.displayName);
    setEmail(staffMember.email);
    setNewRole(staffMember.role as "teacher" | "admin");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preschoolId || !displayName || !email) return;

    setError(null);
    setSuccess(null);

    if (editingStaffId) {
      updateStaffMember(
        {
          targetUserId: editingStaffId,
          displayName,
          role: newRole,
          preschoolId,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            resetForm();
            setSuccess(t("staff.saveSuccess"));
          },
          onError: (err: unknown) => {
            const message =
              err instanceof Error ? err.message : t("staff.saveError");
            setError(message);
          },
        },
      );
      return;
    }

    inviteUser(
      {
        displayName,
        email,
        role: newRole,
        preschoolId,
      },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            resetForm();
            setSuccess(t("staff.inviteSuccess"));
          },
          onError: (err: unknown) => {
            const message =
              err instanceof Error ? err.message : t("staff.inviteError");
            setError(message);
          },
        },
    );
  };

  const handleRemove = (staffMemberId: string) => {
    if (!preschoolId) return;
    if (staffMemberId === userProfile?.id) {
      setError(t("staff.cannotRemoveSelf"));
      return;
    }
    if (!window.confirm(t("staff.confirmRemove"))) return;

    setError(null);
    setSuccess(null);
    removeStaffMember(
      { targetUserId: staffMemberId, preschoolId },
      {
        onSuccess: () => {
          setSuccess(t("staff.removeSuccess"));
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : t("staff.removeError");
          setError(message);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("staff.title")}</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            {t("staff.inviteStaff")}
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
      ) : staff.length === 0 ? (
        <div className="card text-center py-12 text-slate-500 border-dashed">
          <UserRound className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>{t("staff.noStaff", "Brak personelu")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 shrink-0 text-sm uppercase">
                {s.displayName[0]?.[0]}
                {s.displayName.split(" ")[1]?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{s.displayName}</p>
                <p className="text-xs text-slate-500">{s.email}</p>
              </div>
              <span className={s.role === "admin" ? "badge-blue" : "badge-slate"}>
                {roleLabels[s.role] || s.role}
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    className="btn-ghost p-2"
                    onClick={() => openEditModal(s)}
                    aria-label={t("staff.editStaff")}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="btn-ghost p-2 text-red-500"
                    onClick={() => handleRemove(s.id)}
                    aria-label={t("staff.removeStaff")}
                    disabled={isRemoving}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingStaffId ? t("staff.editStaff") : t("staff.inviteStaff")}
              </h2>
              <button
                disabled={isSaving}
                className="btn-ghost p-2"
                onClick={() => setIsModalOpen(false)}
              >
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
                <label className="label">{t("auth.displayName")}</label>
                <input
                  required
                  autoFocus={!editingStaffId}
                  className="input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t("auth.email")}</label>
                <input
                  required
                  type="email"
                  className="input"
                  value={email}
                  disabled={!!editingStaffId}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t("staff.role")}</label>
                <Select
                  value={newRole}
                  onChange={(value) => setNewRole(value as "teacher" | "admin")}
                  options={[
                    { value: "teacher", label: t("staff.teacher") },
                    { value: "admin", label: t("staff.admin") },
                  ]}
                />
              </div>

              <p className="text-xs text-slate-500">
                {editingStaffId
                  ? t("staff.editHint")
                  : t("staff.inviteHint")}
              </p>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  className="btn-ghost flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingStaffId ? (
                    t("common.save")
                  ) : (
                    t("staff.sendInvite")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
