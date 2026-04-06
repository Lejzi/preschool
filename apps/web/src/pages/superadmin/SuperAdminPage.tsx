import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, School2, ArrowRight, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreatePreschool, usePreschools } from "@/hooks/usePreschool";

function localizeCreatePreschoolError(message: string) {
  if (message.includes("Musisz byc zalogowany")) {
    return "Musisz być zalogowany, aby utworzyć przedszkole.";
  }
  if (
    message.includes("Tylko superadministrator") ||
    message.includes("Only superadmins can create preschools")
  ) {
    return "Tylko superadministrator może tworzyć przedszkola.";
  }
  if (message.includes("Nazwa i adres")) {
    return "Nazwa i adres przedszkola są wymagane.";
  }
  if (message.includes("jest juz zajety")) {
    return message.replace("juz", "już");
  }
  return "Nie udało się utworzyć przedszkola.";
}

export function SuperAdminPage() {
  const { t } = useTranslation();
  const { data: preschools = [], isLoading } = usePreschools();
  const { mutate: createPreschool, isPending: isCreating } = useCreatePreschool();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNewName("");
    setNewCity("");
    setNewStreet("");
    setNewPostalCode("");
    setNewEmail("");
    setNewPhone("");
    setCustomCode("");
    setError(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCity || !newStreet || !newPostalCode) return;

    setError(null);
    createPreschool(
      {
        name: newName,
        address: {
          street: newStreet,
          city: newCity,
          postalCode: newPostalCode,
          country: "Polska",
        },
        email: newEmail || undefined,
        phone: newPhone || undefined,
        customCode: customCode || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          setIsModalOpen(false);
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "";
          setError(localizeCreatePreschoolError(message));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("superadmin.title", "Panel Super-Admina")}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Zarządza {preschools.length} placówkami w systemie
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          {t("superadmin.addPreschool", "Dodaj przedszkole")}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : preschools.length === 0 ? (
        <div className="card py-12 text-center text-slate-500 border-dashed">
          Brak placówek. Dodaj pierwsze przedszkole, aby rozpocząć.
        </div>
      ) : (
        <div className="space-y-3">
          {preschools.map((p) => (
            <div
              key={p.id}
              className="card flex items-center gap-4 hover:shadow-[var(--shadow-elevated)] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                <School2 size={22} className="text-brand-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{p.name}</p>
                <p className="text-sm text-slate-500">
                  {p.address?.city} · kod dostępu:{" "}
                  <span className="font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                    /{p.code}
                  </span>
                </p>
                <div className="flex gap-4 mt-1.5 border-t border-slate-100 pt-1.5">
                  <span className="text-xs font-medium text-slate-500">
                    👦 {p.kidCount} dzieci
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    👩‍🏫 {p.staffCount} użytkowników
                  </span>
                </div>
              </div>
              <Link to={`/${p.code}`} className="btn-ghost px-3">
                Przejdź <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Nowe przedszkole</h2>
              <button
                className="btn-ghost p-2"
                disabled={isCreating}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Nazwa placówki</label>
                <input
                  required
                  autoFocus
                  className="input"
                  placeholder="np. Przedszkole Leśne Skrzaty"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Miejscowość</label>
                  <input
                    required
                    className="input"
                    placeholder="np. Kraków"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Kod pocztowy</label>
                  <input
                    required
                    className="input"
                    placeholder="30-001"
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Ulica i numer</label>
                <input
                  required
                  className="input"
                  placeholder="np. ul. Zielona 12"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email kontaktowy</label>
                  <input
                    type="email"
                    className="input"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input
                    className="input"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Własny kod URL</label>
                <input
                  className="input font-mono"
                  placeholder="opcjonalnie, np. lesne-skrzaty"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Jeśli zostawisz puste, system wygeneruje kod z nazwy.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  disabled={isCreating}
                  onClick={() => setIsModalOpen(false)}
                >
                  Anuluj
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Dodaj placówkę"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
