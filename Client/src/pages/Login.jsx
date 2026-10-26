import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Sparkles, Loader2 } from "lucide-react";
import { useAFCStore } from "../store/afcStore";
import FormField from "../components/ui/FormField";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const login = useAFCStore((s) => s.login);
  const isLoading = useAFCStore((s) => s.authLoading);
  const error = useAFCStore((s) => s.authError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onBlur", defaultValues: { email: "", password_hash: "" } });

  const onSubmit = async (values) => {
    const success = await login(values.email, values.password_hash);
    if (success) navigate("/dashboard");
    console.log("Login form submitted with values:", success);
    // clearError();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#1a1f3a] p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none text-white">AFC Gender Project</p>
            <p className="text-xs font-medium text-indigo-300">Empowering girls. Enabling Future</p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-tight text-white">
            Track programme reach,
            <br /> cluster by cluster.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-slate-400">
            Sign in to view awareness sessions, field activity, and programme-wide impact in one place.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} AFC Gender Programme. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-bold text-slate-900">AFC Gender</p>
          </div>

          <p className="text-xs font-bold uppercase tracking-wide text-rose-500">Welcome back</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to access the programme dashboard.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6" noValidate>
            <FormField
              label="Email address"
              type="email"
              icon={Mail}
              placeholder="you@AFC Gender.org"
              error={errors.email}
              register={register("email", {
                required: "Email is required",
                pattern: { value: EMAIL_PATTERN, message: "Enter a valid email address" },
              })}
            />

            <FormField
              label="Password"
              type="password"
              icon={Lock}
              placeholder="Enter your password"
              error={errors.password_hash}
              register={register("password_hash", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}