import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { MailCheck, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword, loading } = useAuthStore();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const { register, handleSubmit } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    await resetPassword(data.email);
    setEmail(data.email);
    setSent(true);
  };

  if (sent)
    return (
      <div className="text-center space-y-4">
        <MailCheck size={48} className="mx-auto text-brand-600" />
        <h2 className="text-xl font-bold text-slate-900">
          {t("auth.resetPassword")}
        </h2>
        <p className="text-sm text-slate-500">
          {t("auth.resetPasswordSent", { email })}
        </p>
        <Link to="/login" className="btn-primary inline-flex">
          <ArrowLeft size={16} />
          {t("auth.login")}
        </Link>
      </div>
    );

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">
        {t("auth.forgotPassword")}
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        Podaj swój adres e-mail, a wyślemy instrukcje resetowania hasła.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">{t("auth.email")}</label>
          <input
            type="email"
            className="input"
            {...register("email", { required: true })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {t("auth.resetPassword")}
        </button>
        <Link
          to="/login"
          className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} />
          {t("auth.login")}
        </Link>
      </form>
    </div>
  );
}
