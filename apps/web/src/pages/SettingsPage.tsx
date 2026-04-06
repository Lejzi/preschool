import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, Loader2, Building, Clock, Globe } from "lucide-react";
import { useActivePreschoolContext, usePreschool, useSavePreschool } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";

export function SettingsPage() {
  const { t } = useTranslation();
  const { preschoolId, role, isResolvingPreschool } = useActivePreschoolContext();
  const isAdmin = role === "admin" || role === "superadmin";

  const { data: preschool, isLoading } = usePreschool(preschoolId || "");
  const { mutate: savePreschool, isPending: isSaving } = useSavePreschool();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    postalCode: "",
    workingOpen: "07:00",
    workingClose: "17:00",
    defaultLanguage: "pl",
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preschool) {
      setTimeout(() => {
        setFormData({
        name: preschool.name || "",
        phone: preschool.phone || "",
        email: preschool.email || "",
        street: preschool.address?.street || "",
        city: preschool.address?.city || "",
        postalCode: preschool.address?.postalCode || "",
        workingOpen: preschool.settings?.workingHours?.open || "07:00",
        workingClose: preschool.settings?.workingHours?.close || "17:00",
        defaultLanguage: preschool.settings?.defaultLanguage || "pl",
      });
      setHasChanges(false);
    }, 0);
    }
  }, [preschool]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setHasChanges(true);
  };

  const updateField = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preschoolId || !isAdmin) return;

    savePreschool({
      id: preschoolId,
      data: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: preschool?.address?.country || "Polska"
        },
        settings: {
          ...(preschool?.settings || {}),
          timezone: preschool?.settings?.timezone || "Europe/Warsaw",
          currency: preschool?.settings?.currency || "PLN",
          defaultLanguage: formData.defaultLanguage as "pl" | "en",
          workingHours: {
            open: formData.workingOpen,
            close: formData.workingClose,
          }
        }
      }
    }, {
      onSuccess: () => setHasChanges(false)
    });
  };

  if (isLoading || isResolvingPreschool) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!preschool) {
    return (
      <div className="card py-12 text-center text-slate-500">
        Brak danych przedszkola.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header justify-between">
        <h1 className="page-title">{t("settings.title")}</h1>
        {isAdmin && (
          <button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="btn-primary"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Zapisz zmiany
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Building className="text-brand-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900">{t("settings.preschoolInfo")}</h2>
          </div>
          
          <div>
            <label className="label">Nazwa placówki</label>
            <input 
              name="name"
              className="input" 
              value={formData.name} 
              onChange={handleChange}
              disabled={!isAdmin} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Telefon</label>
              <input 
                name="phone"
                className="input" 
                value={formData.phone} 
                onChange={handleChange}
                disabled={!isAdmin} 
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input 
                name="email"
                type="email"
                className="input" 
                value={formData.email} 
                onChange={handleChange}
                disabled={!isAdmin} 
              />
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Adres</h3>
            <div className="space-y-3">
               <div>
                  <input name="street" placeholder="Ulica i numer" className="input" value={formData.street} onChange={handleChange} disabled={!isAdmin} />
               </div>
               <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                     <input name="postalCode" placeholder="Kod pocztowy" className="input" value={formData.postalCode} onChange={handleChange} disabled={!isAdmin} />
                  </div>
                  <div className="col-span-2">
                     <input name="city" placeholder="Miejscowość" className="input" value={formData.city} onChange={handleChange} disabled={!isAdmin} />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Operating Hours & Preferences */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Clock className="text-brand-600" size={20} />
              <h2 className="text-lg font-bold text-slate-900">{t("settings.workingHours")}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="label">Otwarcie</label>
                <input 
                  type="time" 
                  name="workingOpen"
                  className="input" 
                  value={formData.workingOpen} 
                  onChange={handleChange}
                  disabled={!isAdmin} 
                />
              </div>
              <span className="text-slate-400 mt-6">-</span>
              <div className="flex-1">
                <label className="label">Zamknięcie</label>
                <input 
                  type="time" 
                  name="workingClose"
                  className="input" 
                  value={formData.workingClose} 
                  onChange={handleChange}
                  disabled={!isAdmin} 
                />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Globe className="text-brand-600" size={20} />
              <h2 className="text-lg font-bold text-slate-900">Preferencje systemowe</h2>
            </div>
            
            <div>
              <label className="label">{t("settings.language")}</label>
              <Select
                value={formData.defaultLanguage} 
                onChange={(value) => updateField("defaultLanguage", value)}
                disabled={!isAdmin}
                options={[
                  { value: "pl", label: "Polski (PL)" },
                  { value: "en", label: "English (EN)" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
