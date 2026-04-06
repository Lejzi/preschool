import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import {
  CreditCard,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { formatPLN, type InvoiceStatus } from "@przedszkole/shared";
import { useInvoices, useSaveInvoice, useMarkInvoicePaid } from "@/hooks/useBilling";
import { useKids } from "@/hooks/useKids";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  draft: { label: "Szkic", badge: "badge-slate", icon: <Clock size={14} /> },
  sent: { label: "Oczekuje", badge: "badge-yellow", icon: <Clock size={14} /> },
  paid: {
    label: "Opłacona",
    badge: "badge-green",
    icon: <CheckCircle2 size={14} />,
  },
  overdue: {
    label: "Zaległa",
    badge: "badge-red",
    icon: <AlertCircle size={14} />,
  },
  cancelled: {
    label: "Anulowana",
    badge: "badge-slate",
    icon: <AlertCircle size={14} />,
  },
};

export function BillingPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const [activeTab, setActiveTab] = useState<"invoices" | "items">("invoices");
  const isAdmin = role === "admin" || role === "superadmin";

  const { data: allKids = [] } = useKids(preschoolId || "");
  const kids = isAdmin
    ? allKids
    : allKids.filter(
        (kid) =>
          kid.parentIds?.includes(userProfile?.id || "") ||
          userProfile?.linkedKidIds?.includes(kid.id),
      );

  // If parent, only fetch their kids' invoices. If admin, fetch all.
  const kidIds = isAdmin ? undefined : kids.map(k => k.id);
  const { data: invoices = [], isLoading } = useInvoices(preschoolId || "", kidIds);

  const { mutate: markPaid, isPending: isPaying } = useMarkInvoicePaid();
  const { mutate: saveInvoice, isPending: isSaving } = useSaveInvoice();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvKidId, setNewInvKidId] = useState("");
  const [newInvMonth, setNewInvMonth] = useState("");
  const [newInvAmount, setNewInvAmount] = useState("");

  const totalOverdue = invoices.filter(
    (i) => i.status === "overdue" || (i.status === "sent" && typeof i.dueDate === 'string' && new Date(i.dueDate) < new Date()),
  ).reduce((sum, i) => sum + i.totalAmountGrosze, 0);

  const billingItemsSummary = invoices
    .flatMap((invoice) => invoice.lineItems || [])
    .reduce<Record<string, { name: string; totalAmountGrosze: number; occurrences: number }>>((acc, item) => {
      const key = item.billingItemId || item.name;
      if (!acc[key]) {
        acc[key] = {
          name: item.name,
          totalAmountGrosze: 0,
          occurrences: 0,
        };
      }
      acc[key].totalAmountGrosze += item.totalAmountGrosze;
      acc[key].occurrences += item.quantity;
      return acc;
    }, {});

  const handlePay = (invoiceId: string, kidId: string) => {
    if (!preschoolId) return;
    const now = new Date();
    const paidAtStr = now.toISOString();
    
    markPaid({ preschoolId, kidId, invoiceId, paidAt: paidAtStr });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preschoolId || !newInvKidId || !newInvMonth || !newInvAmount) return;

    const kid = kids.find(k => k.id === newInvKidId);
    if (!kid) return;
    
    // amount is PLN, we need Grosze
    const grosze = Math.round(parseFloat(newInvAmount) * 100);

    // naive due date: end of current month of creation (just for MVP)
    const now = new Date();
    const dueDateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,"0")}-10`; // e.g. 10th of this month

    saveInvoice({
      preschoolId,
      kidId: kid.id,
      kidName: `${kid.firstName} ${kid.lastName}`,
      month: newInvMonth,
      totalAmountGrosze: grosze,
      dueDate: new Date(dueDateStr) as unknown as import("firebase/firestore").Timestamp,
      status: "sent",
      paidAt: null,
      lineItems: [{ billingItemId: "generic", name: "Czesne", unitAmountGrosze: grosze, quantity: 1, totalAmountGrosze: grosze }],
      parentId: kid.parentIds?.[0] || "",
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setNewInvKidId("");
        setNewInvMonth("");
        setNewInvAmount("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("billing.title")}</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            {t("billing.generateInvoice")}
          </button>
        )}
      </div>

      {/* Summary */}
      {totalOverdue > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <p className="font-medium text-sm">Zaległe płatności</p>
            <p className="text-xs">
              {t("billing.totalDue", {
                amount: (totalOverdue / 100).toFixed(2),
              })}
            </p>
          </div>
        </div>
      )}

      {/* Tabs (admin) */}
      {isAdmin && (
        <div className="flex gap-2 border-b border-slate-200">
          {(["invoices", "items"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {tab === "invoices"
                ? t("billing.invoices")
                : t("billing.billingItems")}
            </button>
          ))}
        </div>
      )}

      {isLoading || isResolvingPreschool ? (
        <div className="flex justify-center py-12">
           <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : activeTab === "items" && isAdmin ? (
        <div className="space-y-3">
          {Object.values(billingItemsSummary).length === 0 ? (
            <div className="card text-center py-12 text-slate-500 border-dashed">
              <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Brak pozycji rozliczeniowych w wystawionych fakturach.</p>
            </div>
          ) : (
            Object.values(billingItemsSummary).map((item) => (
              <div key={item.name} className="card flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">Łączna liczba pozycji: {item.occurrences}</p>
                </div>
                <p className="font-bold text-slate-900">{formatPLN(item.totalAmountGrosze)}</p>
              </div>
            ))
          )}
        </div>
      ) : invoices.length === 0 ? (
        <div className="card text-center py-12 text-slate-500 border-dashed">
          <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Brak faktur i rozliczeń.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            // Check real overdue
            let computedStatus = inv.status;
            let isOverdue = false;
            let dueDateDisplay = "";
            if (inv.dueDate && typeof inv.dueDate === "object" && "seconds" in inv.dueDate) {
              const due = new Date((inv.dueDate as any).seconds * 1000);
              dueDateDisplay = due.toLocaleDateString("pl-PL");
              if (computedStatus === "sent" && due < new Date()) {
                isOverdue = true;
              }
            } else if (typeof inv.dueDate === "string") {
              dueDateDisplay = inv.dueDate;
              if (computedStatus === "sent" && new Date(inv.dueDate) < new Date()) {
                isOverdue = true;
              }
            }
            if (isOverdue) computedStatus = "overdue";
            
            const sc = STATUS_CONFIG[computedStatus] || STATUS_CONFIG["draft"];

            return (
              <div key={inv.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <CreditCard size={20} className="text-slate-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm truncate max-w-[200px]">
                      {inv.kidName}
                    </p>
                    <span className={sc.badge + " flex items-center gap-1 shrink-0"}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {inv.month} · Termin: {dueDateDisplay}
                    {inv.paidAt &&
                      ` · Zapłacono: ${
                        typeof inv.paidAt === "object" && inv.paidAt && "seconds" in inv.paidAt
                          ? new Date(inv.paidAt.seconds * 1000).toLocaleDateString("pl-PL")
                          : new Date(inv.paidAt as any).toLocaleDateString("pl-PL")
                      }`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900">
                    {formatPLN(inv.totalAmountGrosze)}
                  </p>
                  {(computedStatus === "sent" || computedStatus === "overdue") && (
                    <button
                      className="btn-primary text-xs px-3 py-1 mt-1"
                      onClick={() => handlePay(inv.id!, inv.kidId)}
                      disabled={isPaying}
                    >
                      {isAdmin ? "Oznacz jako opłacone" : t("billing.payNow")}
                    </button>
                  )}
                  {computedStatus === "paid" && (
                    <button className="btn-ghost text-xs px-2 py-1 mt-1">
                      <Download size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-sm animate-fade-in relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">{t("billing.generateInvoice")}</h2>
              <button disabled={isSaving} className="btn-ghost p-2" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Dziecko</label>
                <Select
                  value={newInvKidId} 
                  onChange={setNewInvKidId}
                  placeholder="-- Wybierz dziecko --"
                  options={kids.map((k) => ({
                    value: k.id,
                    label: `${k.firstName} ${k.lastName}`,
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Miesiąc (np. 2025-03)</label>
                  <input
                    required
                    className="input"
                    type="month"
                    value={newInvMonth}
                    onChange={(e) => setNewInvMonth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Kwota (PLN)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="np. 650.00"
                    className="input"
                    value={newInvAmount}
                    onChange={(e) => setNewInvAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" disabled={isSaving} className="btn-ghost flex-1" onClick={() => setIsModalOpen(false)}>
                  Anuluj
                </button>
                <button type="submit" disabled={isSaving || !newInvKidId} className="btn-primary flex-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Wygeneruj"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
