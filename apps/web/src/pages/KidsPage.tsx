import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Loader2, Baby, Trash2, Search } from "lucide-react";
import type { EmergencyContact, KidGuardian } from "@przedszkole/shared";
import { useAuthStore } from "@/stores/authStore";
import { useKids, useLinkGuardianToKid, useSaveKid } from "@/hooks/useKids";
import { useGroups } from "@/hooks/useGroups";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";
import { FOOD_ALLERGY_OPTIONS } from "@/lib/foodNeeds";

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

export function KidsPage() {
  const { t } = useTranslation();
  const { preschoolCode } = useParams();
  const { userProfile } = useAuthStore();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const isAdmin = role === "admin" || role === "superadmin";

  const { data: allKids = [], isLoading } = useKids(preschoolId || "");
  const { data: groups = [] } = useGroups(preschoolId || "");
  const { mutateAsync: saveKid, isPending: isSavingKid } = useSaveKid();
  const { mutateAsync: linkGuardianToKid, isPending: isLinkingGuardian } =
    useLinkGuardianToKid();
  const kids =
    isAdmin || role === "teacher"
      ? allKids
      : allKids.filter(
          (kid) =>
            kid.parentIds?.includes(userProfile?.id || "") ||
            userProfile?.linkedKidIds?.includes(kid.id),
        );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(
    formatDateInput(new Date(new Date().setFullYear(new Date().getFullYear() - 3))),
  );
  const [pesel, setPesel] = useState("");
  const [group, setGroup] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFoodAllergies, setSelectedFoodAllergies] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [guardians, setGuardians] = useState<KidGuardian[]>([createEmptyGuardian()]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    createEmptyEmergencyContact(),
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const isSaving = isSavingKid || isLinkingGuardian;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredKids = kids.filter((kid) => {
    const matchesGroup = !groupFilter || kid.groupId === groupFilter;
    if (!matchesGroup) return false;
    if (!normalizedSearch) return true;

    const groupName =
      groups.find((item) => item.id === kid.groupId)?.name.toLowerCase() || "";
    const guardianSearch = (kid.guardians || [])
      .flatMap((guardian) => [
        guardian.name || "",
        guardian.email || "",
        guardian.phone || "",
        guardian.relation || "",
      ])
      .join(" ")
      .toLowerCase();
    const searchable = [
      kid.firstName,
      kid.lastName,
      `${kid.firstName} ${kid.lastName}`,
      kid.pesel || "",
      groupName,
      guardianSearch,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalizedSearch);
  });

  const updateGuardian = (index: number, key: keyof KidGuardian, value: string) => {
    setGuardians((current) =>
      current.map((guardian, itemIndex) =>
        itemIndex === index ? { ...guardian, [key]: value } : guardian,
      ),
    );
  };

  const updateEmergencyContact = (
    index: number,
    key: keyof EmergencyContact,
    value: string,
  ) => {
    setEmergencyContacts((current) =>
      current.map((contact, itemIndex) =>
        itemIndex === index ? { ...contact, [key]: value } : contact,
      ),
    );
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setBirthDate(
      formatDateInput(new Date(new Date().setFullYear(new Date().getFullYear() - 3))),
    );
    setPesel("");
    setGroup("");
    setSelectedFoodAllergies([]);
    setCustomAllergies("");
    setMedicalNotes("");
    setPickupNotes("");
    setNotes("");
    setGuardians([createEmptyGuardian()]);
    setEmergencyContacts([createEmptyEmergencyContact()]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preschoolId || !firstName || !lastName) return;

    setFormError(null);
    setPageMessage(null);
    setPageError(null);

    const normalizedGuardians = guardians
      .map((guardian) => ({
        name: guardian.name.trim(),
        email: guardian.email?.trim().toLowerCase() || "",
        phone: guardian.phone?.trim() || "",
        relation: guardian.relation?.trim() || "",
      }))
      .filter((guardian) => guardian.name || guardian.email || guardian.relation);

    const normalizedEmergencyContacts = emergencyContacts
      .map((contact) => ({
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        relation: contact.relation?.trim() || "",
      }))
      .filter((contact) => contact.name || contact.phone || contact.relation);
    const normalizedAllergies = [
      ...selectedFoodAllergies,
      ...customAllergies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ];

    try {
      const savedKid = await saveKid({
        preschoolId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate ? (new Date(`${birthDate}T12:00:00`) as any) : (new Date() as any),
        pesel: pesel.trim() || undefined,
        groupId: group,
        parentIds: [],
        guardians: normalizedGuardians,
        primaryParentName: normalizedGuardians[0]?.name || undefined,
        primaryParentEmail: normalizedGuardians[0]?.email || undefined,
        allergies: normalizedAllergies,
        medicalNotes: medicalNotes.trim() || undefined,
        pickupNotes: pickupNotes.trim() || undefined,
        emergencyContacts: normalizedEmergencyContacts,
        emergencyContactName: normalizedEmergencyContacts[0]?.name || undefined,
        emergencyContactPhone: normalizedEmergencyContacts[0]?.phone || undefined,
        emergencyContactRelation: normalizedEmergencyContacts[0]?.relation || undefined,
        notes: notes.trim() || undefined,
        isActive: true,
      });

      const guardiansToInvite = normalizedGuardians.filter((guardian) => guardian.email);

      if (guardiansToInvite.length > 0) {
        const results = await Promise.allSettled(
          guardiansToInvite.map((guardian) =>
            linkGuardianToKid({
              preschoolId,
              kidId: savedKid.id as string,
              guardianEmail: guardian.email,
              guardianName: guardian.name || undefined,
              guardianPhone: guardian.phone || undefined,
              guardianRelation: guardian.relation || undefined,
            }),
          ),
        );

        const failed = results.filter((result) => result.status === "rejected");
        if (failed.length > 0) {
          setPageError(
            `Child saved, but ${failed.length} guardian invite${failed.length > 1 ? "s" : ""} failed.`,
          );
        } else {
          setPageMessage("Child saved and guardians linked successfully.");
        }
      } else {
        setPageMessage("Child saved successfully.");
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save child profile.",
      );
    }
  };

  const toggleFoodAllergy = (allergy: string) => {
    setSelectedFoodAllergies((current) =>
      current.includes(allergy)
        ? current.filter((item) => item !== allergy)
        : [...current, allergy],
    );
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("kids.title")}</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            {t("kids.addKid")}
          </button>
        )}
      </div>

      {pageError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {pageError}
        </div>
      )}
      {pageMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {pageMessage}
        </div>
      )}

      {!isLoading && !isResolvingPreschool && kids.length > 0 && (
        <div className="card">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
            <Select
              value={groupFilter}
              onChange={setGroupFilter}
              options={[
                { value: "", label: t("kids.allGroups") },
                ...groups.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("kids.searchPlaceholder")}
              />
            </div>
          </div>
        </div>
      )}

      {isLoading || isResolvingPreschool ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : kids.length === 0 ? (
        <div className="card border-dashed py-12 text-center text-slate-500">
          <Baby className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p>{t("kids.noKids", "Brak dzieci")}</p>
        </div>
      ) : filteredKids.length === 0 ? (
        <div className="card border-dashed py-12 text-center text-slate-500">
          <Search className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p>{t("kids.noSearchResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredKids.map((kid) => (
            <Link
              key={kid.id}
              to={`/${preschoolCode}/kids/${kid.id}`}
              className="card flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold uppercase text-brand-700">
                {kid.firstName[0]?.[0]}
                {kid.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {kid.firstName} {kid.lastName}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {groups.find((item) => item.id === kid.groupId)?.name ||
                    t("kids.unassignedGroup")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card max-h-[90vh] w-full max-w-3xl animate-fade-in overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">{t("kids.addKid")}</h2>
              <button
                disabled={isSaving}
                className="btn-ghost p-2"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="label">{t("kids.firstName")}</label>
                  <input
                    required
                    autoFocus
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t("kids.lastName")}</label>
                  <input
                    required
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="label">{t("kids.birthDate")}</label>
                  <input
                    required
                    type="date"
                    className="input"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t("kids.pesel", "PESEL")}</label>
                  <input
                    className="input"
                    maxLength={11}
                    value={pesel}
                    onChange={(e) => setPesel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t("kids.group")}</label>
                  <Select
                    value={group}
                    onChange={setGroup}
                    options={[
                      { value: "", label: "Bez przypisanej grupy" },
                      ...groups.map((item) => ({
                        value: item.id,
                        label: item.name,
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
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setGuardians((current) => [...current, createEmptyGuardian()])}
                  >
                    <Plus size={16} />
                      {t("kids.addGuardian")}
                    </button>
                  </div>

                <div className="space-y-3">
                  {guardians.map((guardian, index) => (
                    <div
                      key={`guardian-${index}`}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_180px_auto]"
                    >
                      <input
                        className="input"
                        placeholder={t("kids.guardianName")}
                        value={guardian.name}
                        onChange={(e) => updateGuardian(index, "name", e.target.value)}
                      />
                      <input
                        className="input"
                        type="email"
                        placeholder={t("kids.guardianEmail")}
                        value={guardian.email || ""}
                        onChange={(e) => updateGuardian(index, "email", e.target.value)}
                      />
                      <input
                        className="input"
                        placeholder={t("kids.guardianPhone")}
                        value={guardian.phone || ""}
                        onChange={(e) => updateGuardian(index, "phone", e.target.value)}
                      />
                      <input
                        className="input"
                        placeholder={t("kids.guardianRelation")}
                        value={guardian.relation || ""}
                        onChange={(e) => updateGuardian(index, "relation", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-ghost px-3"
                        disabled={guardians.length === 1}
                        onClick={() =>
                          setGuardians((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                      >
                        <Trash2 size={16} />
                        <span className="sr-only">{t("common.remove")}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t("kids.healthAndCare")}
                </h3>
                <div>
                  <label className="label">{t("kids.allergies")}</label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {FOOD_ALLERGY_OPTIONS.map((allergy) => {
                        const checked = selectedFoodAllergies.includes(allergy);
                        return (
                          <label
                            key={allergy}
                            className={checked
                              ? "inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-3 py-2 text-sm text-brand-700"
                              : "inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => toggleFoodAllergy(allergy)}
                            />
                            {t(`kids.foodAllergyOptions.${allergy}`)}
                          </label>
                        );
                      })}
                    </div>
                    <input
                      className="input"
                      placeholder={t("kids.otherAllergiesPlaceholder")}
                      value={customAllergies}
                      onChange={(e) => setCustomAllergies(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">{t("kids.medicalNotes")}</label>
                  <textarea
                    className="input min-h-24 resize-none"
                    placeholder={t("kids.medicalNotesPlaceholder")}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t("kids.pickupNotes")}</label>
                  <textarea
                    className="input min-h-24 resize-none"
                    placeholder={t("kids.pickupNotesPlaceholder")}
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t("common.notes")}</label>
                  <textarea
                    className="input min-h-24 resize-none"
                    placeholder={t("kids.generalNotesPlaceholder")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("kids.emergencyContact")}
                  </h3>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setEmergencyContacts((current) => [
                        ...current,
                        createEmptyEmergencyContact(),
                      ])
                    }
                  >
                    <Plus size={16} />
                    {t("kids.addEmergencyContact")}
                  </button>
                </div>

                <div className="space-y-3">
                  {emergencyContacts.map((contact, index) => (
                    <div
                      key={`contact-${index}`}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_180px_auto]"
                    >
                      <input
                        className="input"
                        placeholder={t("kids.emergencyName")}
                        value={contact.name}
                        onChange={(e) =>
                          updateEmergencyContact(index, "name", e.target.value)
                        }
                      />
                      <input
                        className="input"
                        placeholder={t("kids.emergencyPhone")}
                        value={contact.phone}
                        onChange={(e) =>
                          updateEmergencyContact(index, "phone", e.target.value)
                        }
                      />
                      <input
                        className="input"
                        placeholder={t("kids.emergencyRelation")}
                        value={contact.relation || ""}
                        onChange={(e) =>
                          updateEmergencyContact(index, "relation", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="btn-ghost px-3"
                        disabled={emergencyContacts.length === 1}
                        onClick={() =>
                          setEmergencyContacts((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                      >
                        <Trash2 size={16} />
                        <span className="sr-only">{t("common.remove")}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  className="btn-ghost flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
