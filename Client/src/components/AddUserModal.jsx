import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { User, Mail, Lock, Phone, Loader2 } from "lucide-react";
import Modal from "./ui/Modal";
import FormField from "./ui/FormField";
import { useAFCStore } from "../store/afcStore";


const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{10}$/;
const ROLES = ["Regional Expert", "Super Admin"];

export default function AddUserModal({ isOpen, onClose }) {
  const { addUser, addUserLoading, addUserError, clearAddUserError } = useAFCStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: { name: "", email: "", password: "", role: "", phone_no: "" },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
       clearAddUserError();
    }
  }, [isOpen, reset, clearAddUserError]);

  const onSubmit = async (values) => {
    const success = await addUser(values.name, values.email, values.phone_no, values.password, values.role);
    if (success) {
      reset();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New User" subtitle="Create an account for an admin or regional expert">
      {addUserError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600">
          {addUserError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Full name"
          icon={User}
          placeholder="Jane Doe"
          error={errors.name}
          register={register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" },
          })}
        />

        <FormField
          label="Email address"
          type="email"
          icon={Mail}
          placeholder="jane@ignite.org"
          error={errors.email}
          register={register("email", {
            required: "Email is required",
            pattern: { value: EMAIL_PATTERN, message: "Enter a valid email address" },
          })}
        />

        <FormField
          label="Phone number"
          type="tel"
          icon={Phone}
          placeholder="9876543210"
          error={errors.phone_no}
          register={register("phone_no", {
            required: "Phone number is required",
            pattern: { value: PHONE_PATTERN, message: "Enter a valid 10-digit phone number" },
          })}
        />

        <FormField
          label="Password"
          type="password"
          icon={Lock}
          placeholder="Create a password"
          error={errors.password}
          register={register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Password must be at least 8 characters" },
            pattern: {
              value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
              message: "Password must include at least one letter and one number",
            },
          })}
        />

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
          <select
            defaultValue=""
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
              errors.role
                ? "border-rose-300 focus:ring-rose-200"
                : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
            }`}
            {...register("role", { required: "Please select a role" })}
          >
            <option value="" disabled>
              Select a role
            </option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {errors.role && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.role.message}</p>}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={addUserLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addUserLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {addUserLoading ? "Adding..." : "Add User"}
          </button>
        </div>
      </form>
    </Modal>
  );
}