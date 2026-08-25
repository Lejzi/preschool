import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginWithGoogle, loading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<"email" | "google" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setAuthMethod("email");
    try {
      await login(data.email, data.password);
      navigate("/", { replace: true });
    } catch (e: any) {
      setError(t("auth.loginError"));
      setAuthMethod(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setAuthMethod("google");
    try {
      await loginWithGoogle();
      navigate("/", { replace: true });
    } catch {
      setError(t("auth.googleLoginError"));
      setAuthMethod(null);
    }
  };

  const isSubmitting = loading || authMethod !== null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">
        {t("auth.login")}
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        {t("auth.noAccount")}{" "}
        <Link
          to="/register"
          className="text-brand-600 hover:underline font-medium"
        >
          {t("auth.register")}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isSubmitting && (
          <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
            {t("auth.loggingIn")}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="label">{t("auth.email")}</label>
          <input
            type="email"
            className="input"
            placeholder="jan@przyklad.pl"
            disabled={isSubmitting}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label">{t("auth.password")}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="input pr-10"
              disabled={isSubmitting}
              {...register("password")}
            />
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-brand-600 hover:underline"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
          id="login-submit"
        >
          {isSubmitting && authMethod === "email" ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <LogIn size={16} />
          )}
          {isSubmitting && authMethod === "email" ? t("auth.loggingIn") : t("auth.login")}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {t("auth.or")}
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          className="btn-secondary w-full"
          onClick={handleGoogleLogin}
        >
          {isSubmitting && authMethod === "google" ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-brand-600 border-t-transparent" />
          ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.8-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 8.6-6.1 8.6-9.2 0-.6-.1-1-.2-1.4H12Z"
            />
            <path
              fill="#34A853"
              d="M2.8 7.1 6 9.5c.9-1.7 2.6-2.9 4.9-2.9 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 8 2 4.5 4.3 2.8 7.1Z"
            />
            <path
              fill="#FBBC05"
              d="M12 20.4c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1.1-3.4 1.1-3.8 0-5.2-2.5-5.5-3.8L3.2 15c1.7 3.3 5.1 5.4 8.8 5.4Z"
            />
            <path
              fill="#4285F4"
              d="M20.6 11.2c0-.6-.1-1-.2-1.4H12v3.9h5.5c-.3 1.4-1.2 2.6-2.1 3.4l3 2.4c1.8-1.7 2.8-4.1 2.8-8.3Z"
            />
          </svg>
          )}
          {isSubmitting && authMethod === "google"
            ? t("auth.loggingIn")
            : t("auth.continueWithGoogle")}
        </button>
      </form>
    </div>
  );
}
