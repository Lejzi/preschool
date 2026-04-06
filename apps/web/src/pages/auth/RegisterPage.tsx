import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";

const schema = z
  .object({
    displayName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Hasła muszą być takie same",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await registerUser(data.email, data.password, data.displayName);
      navigate("/");
    } catch (e: any) {
      setError(t("auth.registerError"));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">
        {t("auth.register")}
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        {t("auth.haveAccount")}{" "}
        <Link
          to="/login"
          className="text-brand-600 hover:underline font-medium"
        >
          {t("auth.login")}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="label">{t("auth.displayName")}</label>
          <input
            type="text"
            className="input"
            placeholder="Jan Kowalski"
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-red-500 text-xs mt-1">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div>
          <label className="label">{t("auth.email")}</label>
          <input
            type="email"
            className="input"
            placeholder="jan@przyklad.pl"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label">{t("auth.password")}</label>
          <input type="password" className="input" {...register("password")} />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="label">{t("auth.confirmPassword")}</label>
          <input
            type="password"
            className="input"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
          id="register-submit"
        >
          {loading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <UserPlus size={16} />
          )}
          {t("auth.register")}
        </button>
      </form>
    </div>
  );
}
