import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function FormField({ label, icon: Icon, error, type = "text", register, ...rest }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          type={inputType}
          className={`w-full rounded-xl border bg-white py-2.5 ${Icon ? "pl-10" : "pl-3.5"} ${
            isPassword ? "pr-10" : "pr-3.5"
          } text-sm text-slate-800 outline-none transition focus:ring-2 ${
            error
              ? "border-rose-300 focus:ring-rose-200"
              : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
          }`}
          {...register}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-500">{error.message}</p>}
    </div>
  );
}