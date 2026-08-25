import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import type { EmergencyContact, KidGuardian } from "@przedszkole/shared";
import { useKid, useDeleteKid, useLinkGuardianToKid, useSaveKid } from "@/hooks/useKids";
import { useGroups } from "@/hooks/useGroups";
import { useInvoices } from "@/hooks/useBilling";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { formatPLN } from "@przedszkole/shared";
import { Select } from "@/components/ui/Select";
import { FOOD_ALLERGY_OPTIONS, isPresetFoodAllergy } from "@/lib/foodNeeds";

function formatDateInput(value?: { toDate?: () => Date } | Date | null) {
  if (!value) return "";
  const date =
    value instanceof Date ? value : typeof value.toDate === "function" ? value.toDate() : null;
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function createEmptyGuardian(): KidGuardian {
  return { name: "", email: "", phone: "", relation: "" };
}

function createEmptyEmergencyContact(): EmergencyContact {
  return { name: "", phone: "", relation: "" };
}

type KidProfileFormState = {
  firstName: string;
  lastName: string;
  birthDate: string;
  pesel: string;
  groupId: string;
  notes: string;
  selectedFoodAllergies: string[];
  customAllergies: string;
  medicalNotes: string;
  pickupNotes: string;
  guardians: KidGuardian[];
  emergencyContacts: EmergencyContact[];
  isActive: boolean;
};

function deriveGuardians(kid: any): KidGuardian[] {
  if (Array.isArray(kid.guardians) && kid.guardians.length > 0) {
    return kid.guardians.map((guardian: KidGuardian) => ({
      uid: guardian.uid,
      name: guardian.name || "",
      email: guardian.email || "",
      phone: guardian.phone || "",
      relation: guardian.relation || "",
    }));
  }

  if (kid.primaryParentName || kid.primaryParentEmail) {
    return [
      {
        name: kid.primaryParentName || "",
        email: kid.primaryParentEmail || "",
        phone: "",
        relation: "",
      },
    ];
  }

  return [createEmptyGuardian()];
}

function deriveEmergencyContacts(kid: any): EmergencyContact[] {
  if (Array.isArray(kid.emergencyContacts) && kid.emergencyContacts.length > 0) {
    return kid.emergencyContacts.map((contact: EmergencyContact) => ({
      name: contact.name || "",
      phone: contact.phone || "",
      relation: contact.relation || "",
    }));
  }

  if (kid.emergencyContactName || kid.emergencyContactPhone || kid.emergencyContactRelation) {
    return [
      {
        name: kid.emergencyContactName || "",
        phone: kid.emergencyContactPhone || "",
        relation: kid.emergencyContactRelation || "",
      },
    ];
  }

  return [createEmptyEmergencyContact()];
}

export function KidProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { preschoolCode, kidId } = useParams();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const isAdmin = role === "admin" || role === "superadmin";

  const { data: kid, isLoading } = useKid(preschoolId || "", kidId || "");
  const { data: groups = [] } = useGroups(preschoolId || "");
  const { data: invoices = [] } = useInvoices(preschoolId || "");
  const { mutateAsync: saveKid, isPending: isSavingKid } = useSaveKid();
  const { mutateAsync: linkGuardianToKid, isPending: isLinkingGuardian } =
    useLinkGuardianToKid();
  const { mutate: deleteKid, isPending: isDeleting } = useDeleteKid();

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<KidProfileFormState>({
    firstName: "",
    lastName: "",
    birthDate: "",
    pesel: "",
    groupId: "",
    notes: "",
    selectedFoodAllergies: [],
    customAllergies: "",
    medicalNotes: "",
    pickupNotes: "",
    guardians: [createEmptyGuardian()] as KidGuardian[],
    emergencyContacts: [createEmptyEmergencyContact()] as EmergencyContact[],
    isActive: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!kid) return;

    setFormData({
      firstName: kid.firstName || "",
      lastName: kid.lastName || "",
      birthDate: formatDateInput(kid.birthDate as any),
      pesel: kid.pesel || "",
      groupId: kid.groupId || "",
      notes: kid.notes || "",
      selectedFoodAllergies: (kid.allergies || []).filter(isPresetFoodAllergy),
      customAllergies: (kid.allergies || [])
        .filter((allergy) => !isPresetFoodAllergy(allergy))
        .join(", "),
      medicalNotes: kid.medicalNotes || "",
      pickupNotes: kid.pickupNotes || "",
      guardians: deriveGuardians(kid),
      emergencyContacts: deriveEmergencyContacts(kid),
      isActive: kid.isActive ?? true,
    });
    setHasChanges(false);
    setSaveMessage(null);
    setSaveError(null);
  }, [kid]);

  const kidInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.kidId === kidId),
    [invoices, kidId],
  );
  const totalDue = kidInvoices
    .filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled")
    .reduce((sum, invoice) => sum + invoice.totalAmountGrosze, 0);

  const isSaving = isSavingKid || isLinkingGuardian;

  const updateField = (
    key: Exclude<keyof KidProfileFormState, "guardians" | "emergencyContacts">,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateGuardian = (index: number, key: keyof KidGuardian, value: string) => {
    setFormData((prev) => ({
      ...prev,
      guardians: prev.guardians.map((guardian, itemIndex) =>
        itemIndex === index ? { ...guardian, [key]: value } : guardian,
      ),
    }));
    setHasChanges(true);
  };

  const updateEmergencyContact = (
    index: number,
    key: keyof EmergencyContact,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, itemIndex) =>
        itemIndex === index ? { ...contact, [key]: value } : contact,
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preschoolId || !kid) return;

    setSaveMessage(null);
    setSaveError(null);

    const normalizedGuardians = formData.guardians
      .map((guardian) => ({
        uid: guardian.uid,
        name: guardian.name.trim(),
        email: guardian.email?.trim().toLowerCase() || "",
        phone: guardian.phone?.trim() || "",
        relation: guardian.relation?.trim() || "",
      }))
      .filter((guardian) => guardian.name || guardian.email || guardian.relation);

    const normalizedEmergencyContacts = formData.emergencyContacts
      .map((contact) => ({
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        relation: contact.relation?.trim() || "",
      }))
      .filter((contact) => contact.name || contact.phone || contact.relation);

    try {
      await saveKid({
        ...kid,
        preschoolId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate
          ? (new Date(`${formData.birthDate}T12:00:00`) as any)
          : kid.birthDate,
        pesel: formData.pesel.trim() || undefined,
        groupId: formData.groupId,
        guardians: normalizedGuardians,
        primaryParentName: normalizedGuardians[0]?.name || undefined,
        primaryParentEmail: normalizedGuardians[0]?.email || undefined,
        notes: formData.notes.trim() || undefined,
        allergies: [
          ...formData.selectedFoodAllergies,
          ...formData.customAllergies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ],
        medicalNotes: formData.medicalNotes.trim() || undefined,
        pickupNotes: formData.pickupNotes.trim() || undefined,
        emergencyContacts: normalizedEmergencyContacts,
        emergencyContactName: normalizedEmergencyContacts[0]?.name || undefined,
        emergencyContactPhone: normalizedEmergencyContacts[0]?.phone || undefined,
        emergencyContactRelation: normalizedEmergencyContacts[0]?.relation || undefined,
        isActive: formData.isActive,
      });

      const guardiansToInvite = normalizedGuardians.filter((guardian) => guardian.email);
      if (guardiansToInvite.length > 0) {
        const results = await Promise.allSettled(
          guardiansToInvite.map((guardian) =>
            linkGuardianToKid({
              preschoolId,
              kidId: kid.id,
              guardianEmail: guardian.email,
              guardianName: guardian.name || undefined,
              guardianPhone: guardian.phone || undefined,
              guardianRelation: guardian.relation || undefined,
            }),
          ),
        );

        const failed = results.filter((result) => result.status === "rejected");
        if (failed.length > 0) {
          setSaveError(
            `Child profile saved, but ${failed.length} guardian invite${failed.length > 1 ? "s" : ""} failed.`,
          );
        } else {
          setSaveMessage("Child profile saved and guardians linked.");
        }
      } else {
        setSaveMessage("Child profile saved.");
      }

      setHasChanges(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save child profile.",
      );
    }
  };

  const toggleFoodAllergy = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFoodAllergies: prev.selectedFoodAllergies.includes(allergy)
        ? prev.selectedFoodAllergies.filter((item) => item !== allergy)
        : [...prev.selectedFoodAllergies, allergy],
    }));
    setHasChanges(true);
  };

  const handleDelete = () => {
    if (!preschoolId || !kidId) return;
    if (!window.confirm("Czy na pewno chcesz usunąć profil dziecka?")) return;

    deleteKid(
      { preschoolId, kidId },
      {
        onSuccess: () => navigate(`/${preschoolCode}/kids`),
      },
    );
  };

  if (isLoading || isResolvingPreschool) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!kid) {
    return (
      <div className="card py-12 text-center text-slate-500">
        {t("kids.profileNotFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to={`/${preschoolCode}/kids`} className="btn-ghost -ml-2 p-2">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">
              {kid.firstName} {kid.lastName}
            </h1>
            <p className="text-sm text-slate-500">
              {t("kids.group")}:{" "}
              {groups.find((group) => group.id === kid.groupId)?.name ||
                t("kids.unassignedGroup")}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn-danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
              {t("common.delete")}
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
              {t("common.save")}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card space-y-4 xl:col-span-2">
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}
          {saveMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {saveMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label">{t("kids.firstName")}</label>
              <input
                className="input"
                value={formData.firstName}
                disabled={!isAdmin}
                onChange={(e) => updateField("firstName", e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t("kids.lastName")}</label>
              <input
                className="input"
                value={formData.lastName}
                disabled={!isAdmin}
                onChange={(e) => updateField("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="label">{t("kids.birthDate")}</label>
              <input
                type="date"
                className="input"
                value={formData.birthDate}
                disabled={!isAdmin}
                onChange={(e) => updateField("birthDate", e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t("kids.pesel", "PESEL")}</label>
              <input
                className="input"
                maxLength={11}
                value={formData.pesel}
                disabled={!isAdmin}
                onChange={(e) => updateField("pesel", e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t("kids.group")}</label>
              <Select
                value={formData.groupId}
                disabled={!isAdmin}
                onChange={(value) => updateField("groupId", value)}
                options={[
                  { value: "", label: "Bez przypisanej grupy" },
                  ...groups.map((group) => ({
                    value: group.id,
                    label: group.name,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t("kids.parents")}</h3>
                <p className="mt-1 text-xs text-slate-500">{t("kids.inviteGuardianHint")}</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    {
                      setFormData((prev) => ({
                        ...prev,
                        guardians: [...prev.guardians, createEmptyGuardian()],
                      }));
                      setHasChanges(true);
                    }
                  }
                >
                  <Plus size={16} />
                  {t("kids.addGuardian")}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {formData.guardians.map((guardian, index) => (
                <div
                  key={`guardian-${index}`}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_180px_auto]"
                >
                  <input
                    className="input"
                    placeholder={t("kids.guardianName")}
                    value={guardian.name}
                    disabled={!isAdmin}
                    onChange={(e) => updateGuardian(index, "name", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder={t("kids.guardianEmail")}
                    type="email"
                    value={guardian.email || ""}
                    disabled={!isAdmin}
                    onChange={(e) => updateGuardian(index, "email", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder={t("kids.guardianPhone")}
                    value={guardian.phone || ""}
                    disabled={!isAdmin}
                    onChange={(e) => updateGuardian(index, "phone", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder={t("kids.guardianRelation")}
                    value={guardian.relation || ""}
                    disabled={!isAdmin}
                    onChange={(e) => updateGuardian(index, "relation", e.target.value)}
                  />
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn-ghost px-3"
                      disabled={formData.guardians.length === 1}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          guardians: prev.guardians.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }));
                        setHasChanges(true);
                      }}
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">{t("common.remove")}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">{t("kids.allergies")}</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {FOOD_ALLERGY_OPTIONS.map((allergy) => {
                  const checked = formData.selectedFoodAllergies.includes(allergy);
                  return (
                    <label
                      key={allergy}
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm",
                        isAdmin ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                        checked
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-700",
                        !isAdmin &&
                          (checked
                            ? "border-slate-200 bg-slate-100 text-slate-500"
                            : "border-slate-200 bg-slate-50 text-slate-400"),
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        disabled={!isAdmin}
                        onChange={() => toggleFoodAllergy(allergy)}
                      />
                      {t(`kids.foodAllergyOptions.${allergy}`)}
                    </label>
                  );
                })}
              </div>
              <input
                className="input"
                value={formData.customAllergies}
                disabled={!isAdmin}
                placeholder={t("kids.otherAllergiesPlaceholder")}
                onChange={(e) => updateField("customAllergies", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">{t("kids.medicalNotes")}</label>
            <textarea
              className="input min-h-24 resize-none"
              value={formData.medicalNotes}
              disabled={!isAdmin}
              placeholder={t("kids.medicalNotesPlaceholder")}
              onChange={(e) => updateField("medicalNotes", e.target.value)}
            />
          </div>

          <div>
            <label className="label">{t("kids.pickupNotes")}</label>
            <textarea
              className="input min-h-24 resize-none"
              value={formData.pickupNotes}
              disabled={!isAdmin}
              placeholder={t("kids.pickupNotesPlaceholder")}
              onChange={(e) => updateField("pickupNotes", e.target.value)}
            />
          </div>

          <div>
            <label className="label">{t("common.notes")}</label>
            <textarea
              className="input min-h-28 resize-none"
              value={formData.notes}
              disabled={!isAdmin}
              placeholder={t("kids.generalNotesPlaceholder")}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {t("kids.emergencyContact")}
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    {
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContacts: [
                          ...prev.emergencyContacts,
                          createEmptyEmergencyContact(),
                        ],
                      }));
                      setHasChanges(true);
                    }
                  }
                >
                  <Plus size={16} />
                  {t("kids.addEmergencyContact")}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {formData.emergencyContacts.map((contact, index) => (
                <div
                  key={`contact-${index}`}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_180px_auto]"
                >
                  <input
                    className="input"
                    placeholder={t("kids.emergencyName")}
                    value={contact.name}
                    disabled={!isAdmin}
                    onChange={(e) => updateEmergencyContact(index, "name", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder={t("kids.emergencyPhone")}
                    value={contact.phone}
                    disabled={!isAdmin}
                    onChange={(e) => updateEmergencyContact(index, "phone", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder={t("kids.emergencyRelation")}
                    value={contact.relation || ""}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      updateEmergencyContact(index, "relation", e.target.value)
                    }
                  />
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn-ghost px-3"
                      disabled={formData.emergencyContacts.length === 1}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          emergencyContacts: prev.emergencyContacts.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }));
                        setHasChanges(true);
                      }}
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">{t("common.remove")}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formData.isActive}
              disabled={!isAdmin}
              onChange={(e) => updateField("isActive", e.target.checked)}
            />
            {t("kids.activeKidAccount")}
          </label>
        </div>

        <div className="space-y-4">
          <div className="card">
            <p className="text-sm font-semibold text-slate-900">{t("common.summary")}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>{t("kids.linkedGuardians", { count: kid.parentIds?.length || 0 })}</p>
              {kid.pesel && <p>PESEL: {kid.pesel}</p>}
              {Array.isArray(kid.emergencyContacts) && kid.emergencyContacts[0]?.phone && (
                <p>{t("kids.emergencyPhoneLabel", { phone: kid.emergencyContacts[0].phone })}</p>
              )}
              <p>Faktur: {kidInvoices.length}</p>
              <p>Do zapłaty: {formatPLN(totalDue)}</p>
            </div>
          </div>

          <div className="card">
            <p className="text-sm font-semibold text-slate-900">{t("kids.recentInvoices")}</p>
            <div className="mt-3 space-y-3">
              {kidInvoices.length === 0 ? (
                <p className="text-sm text-slate-500">{t("kids.noInvoicesForKid")}</p>
              ) : (
                kidInvoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-medium text-slate-800">{invoice.month}</p>
                    <p className="text-xs text-slate-500">
                      {formatPLN(invoice.totalAmountGrosze)} · {invoice.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
