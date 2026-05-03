"use client";

import { useEffect, useState, FormEvent } from "react";
import toast from "react-hot-toast";
import { useUpdateUserDetailsMutation } from "@/api/userApi";
import { Gender, Sex, UpdateUserDetailsRequest, User } from "@/types";

const genderOptions: { label: string; value: Gender | "" }[] = [
  { label: "Not Provided", value: "" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Not Stated", value: "not-stated" },
  { label: "Non Binary", value: "non-binary" },
  { label: "Other", value: "other" },
];

const sexOptions: { label: string; value: Sex | "" }[] = [
  { label: "Not Provided", value: "" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const formatDateForInput = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
};

const getErrorMessage = (err: unknown) =>
  err &&
  typeof err === "object" &&
  "data" in err &&
  err.data &&
  typeof err.data === "object" &&
  "message" in err.data
    ? String(err.data.message)
    : "Unable to update user details.";

interface UserDetailsEditFormProps {
  user: User;
  onUpdated?: (user: User) => void;
}

export default function UserDetailsEditForm({
  user,
  onUpdated,
}: UserDetailsEditFormProps) {
  const [form, setForm] = useState<UpdateUserDetailsRequest>({
    firstName: "",
    surname: "",
    avatar: "",
    dateOfBirth: "",
    gender: "",
    sex: "",
    phoneNumber: "",
    postcode: "",
    nhs: "",
    contraception: "",
  });

  const [updateUserDetails, { isLoading }] = useUpdateUserDetailsMutation();

  useEffect(() => {
    setForm({
      firstName: user.firstName || "",
      surname: user.surname || "",
      avatar: user.avatar || "",
      dateOfBirth: formatDateForInput(user.dateOfBirth),
      gender: user.gender || "",
      sex: user.sex || "",
      phoneNumber: user.phoneNumber || "",
      postcode: user.postcode || "",
      nhs: user.nhs || "",
      contraception: user.contraception || "",
    });
  }, [user]);

  const updateField = <T extends keyof UpdateUserDetailsRequest>(
    field: T,
    value: UpdateUserDetailsRequest[T]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await updateUserDetails({
        id: user._id,
        data: {
          ...form,
          firstName: form.firstName.trim(),
          surname: form.surname.trim(),
          avatar: form.avatar.trim(),
          phoneNumber: form.phoneNumber.trim(),
          postcode: form.postcode.trim(),
          nhs: form.nhs.trim(),
          contraception: form.contraception.trim(),
        },
      }).unwrap();

      if (response.success) {
        toast.success("User details updated successfully.");
        onUpdated?.(response.data);
      } else {
        toast.error(response.message || "Unable to update user details.");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 border-t border-gray-200 pt-6"
    >
      <h3 className="text-xl font-semibold mb-6">Editable User Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <label className="block">
          <span className="text-sm text-gray-500">First Name</span>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Enter first name"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-500">Surname</span>
          <input
            type="text"
            value={form.surname}
            onChange={(e) => updateField("surname", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Enter surname"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-500">Phone Number</span>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => updateField("phoneNumber", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Enter phone number"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-500">Date of Birth</span>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateField("dateOfBirth", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-500">Gender</span>
          <select
            value={form.gender}
            onChange={(e) => updateField("gender", e.target.value as Gender | "")}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          >
            {genderOptions.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-gray-500">Sex Assigned at Birth</span>
          <select
            value={form.sex}
            onChange={(e) => updateField("sex", e.target.value as Sex | "")}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          >
            {sexOptions.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-gray-500">Postcode</span>
          <input
            type="text"
            value={form.postcode}
            onChange={(e) => updateField("postcode", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Enter postcode"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-500">NHS Number</span>
          <input
            type="text"
            value={form.nhs}
            onChange={(e) => updateField("nhs", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Enter NHS number"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-500">Contraception Preference</span>
          <input
            type="text"
            value={form.contraception}
            onChange={(e) => updateField("contraception", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Enter contraception preference"
          />
        </label>
        <label className="block lg:col-span-3">
          <span className="text-sm text-gray-500">Avatar URL</span>
          <input
            type="url"
            value={form.avatar}
            onChange={(e) => updateField("avatar", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Enter avatar URL"
          />
        </label>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-pink-200 text-pink-800 hover:bg-pink-400 hover:text-white px-4 py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save User Details"}
        </button>
      </div>
    </form>
  );
}
