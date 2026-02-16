"use client";

import { useGetUserByIdQuery } from "@/api/userApi";
import { useGetPopsQuery, useGetCocpsQuery } from "@/api/serviceApi";
import { Pop, Cocp, DeliveryStatus } from "@/types";
import {
  User as UserIcon,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Pill,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

// A reusable component to display user details neatly
const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null | boolean;
}) => {
  const displayValue =
    value === null || value === undefined || value === ""
      ? "Not Provided"
      : String(value);

  // Special handling for boolean values
  if (typeof value === "boolean") {
    return (
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <div
          className={`flex items-center gap-2 mt-1 ${value ? "text-green-600" : "text-red-600"
            }`}
        >
          {value ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <p className="font-semibold">{value ? "Yes" : "No"}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800 mt-1">{displayValue}</p>
    </div>
  );
};

// Utility function to format ISO date string
const formatDateTime = (isoString: string) => {
  if (!isoString) return { date: "N/A", time: "N/A" };
  try {
    const dateObj = new Date(isoString);
    const date = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const time = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  } catch (error) {
    return { date: "Invalid Date", time: "Invalid Time" };
  }
};

const UserDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [activeServiceTab, setActiveServiceTab] = useState<"POP" | "COCP">(
    "POP"
  );

  const {
    data: userResponse,
    isLoading,
    isError,
    error,
  } = useGetUserByIdQuery(id!, {
    skip: !id,
  });

  // Fetch POP and COCP requests for this user
  const {
    data: popResponse,
    isLoading: isPopLoading,
  } = useGetPopsQuery(
    { page: 1, limit: 1000, userId: id },
    { skip: !id || activeServiceTab !== "POP" }
  );

  const {
    data: cocpResponse,
    isLoading: isCocpLoading,
  } = useGetCocpsQuery(
    { page: 1, limit: 1000, userId: id },
    { skip: !id || activeServiceTab !== "COCP" }
  );

  // Handle Loading State
  if (isLoading) {
    return (
      <p className="p-8 text-center text-pink-500">Loading user data...</p>
    );
  }

  // Handle Error State
  if (isError || !userResponse?.success) {
    console.error("Error fetching user:", error || userResponse?.message);
    return (
      <p className="p-8 text-center text-red-500">
        User not found or failed to load.
      </p>
    );
  }

  const user = userResponse.data;

  // Format the join date
  const joinedOn = new Date(user.createdAt!).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Service requests
  const serviceLoading = activeServiceTab === "POP" ? isPopLoading : isCocpLoading;
  const requests: (Pop | Cocp)[] =
    activeServiceTab === "POP"
      ? popResponse?.data || []
      : cocpResponse?.data || [];

  return (
    <div className="p-6 bg-pink-50 min-h-screen text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 mb-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to User List
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {`${user.firstName} ${user.surname || ""}`.trim()}
          </h1>
        </div>
        <button className="bg-pink-200 text-pink-800 hover:bg-pink-400 hover:text-white px-4 py-2 rounded-lg transition mt-4 md:mt-0">
          Send Message
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        {/* User Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-200">
          <Image
            src={
              user.avatar ||
              "https://i.postimg.cc/4xLZjmW2/dfb6892164e638fc869bc424d651235a519c6d80.png"
            }
            alt="Profile Picture"
            width={100}
            height={100}
            className="rounded-full object-cover border-4 border-pink-100"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-semibold">
              {`${user.firstName} ${user.surname || ""}`.trim()}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mt-1">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mt-1">
              <Phone size={16} />
              <span>{user.phoneNumber || "No phone number"}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mt-1">
              <Calendar size={16} />
              <span>Joined on {joinedOn}</span>
            </div>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-6">
            Personal & Medical Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DetailItem label="First Name" value={user.firstName} />
            <DetailItem label="Surname" value={user.surname} />
            <DetailItem label="Email Address" value={user.email} />
            <DetailItem label="Phone Number" value={user.phoneNumber} />
            <DetailItem
              label="Date of Birth"
              value={
                user.dateOfBirth
                  ? new Date(user.dateOfBirth).toLocaleDateString()
                  : null
              }
            />
            <DetailItem label="Gender" value={user.gender} />
            <DetailItem label="Sex Assigned at Birth" value={user.sex} />
            <DetailItem label="Postcode" value={user.postcode} />
            <DetailItem label="NHS Number" value={user.nhs} />
            <DetailItem
              label="Contraception Preference"
              value={user.contraception}
            />
            <DetailItem label="Account Verified" value={user.verified} />
            <DetailItem label="Account Blocked" value={user.blocked} />
          </div>
        </div>
      </div>

      {/* Service Requests Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
          <Pill /> Service Requests
        </h3>

        {/* POP / COCP Tabs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setActiveServiceTab("POP")}
            className={`cursor-pointer rounded-xl shadow-md p-4 border-b-2 border-gray-400 transition-all duration-300 ${activeServiceTab === "POP"
                ? "bg-pink-300 text-white"
                : "bg-white hover:bg-pink-200 text-gray-700"
              }`}
          >
            <p
              className={`text-sm font-medium ${activeServiceTab === "POP"
                  ? "text-white"
                  : "text-gray-600"
                }`}
            >
              Requests
            </p>
            <h4
              className={`text-lg font-bold ${activeServiceTab === "POP"
                  ? "text-white"
                  : "text-pink-400"
                }`}
            >
              POP ({popResponse?.data?.length ?? 0})
            </h4>
          </button>

          <button
            onClick={() => setActiveServiceTab("COCP")}
            className={`cursor-pointer rounded-xl shadow-md p-4 border-b-2 border-gray-400 transition-all duration-300 ${activeServiceTab === "COCP"
                ? "bg-pink-300 text-white"
                : "bg-white hover:bg-pink-200 text-gray-700"
              }`}
          >
            <p
              className={`text-sm font-medium ${activeServiceTab === "COCP"
                  ? "text-white"
                  : "text-gray-600"
                }`}
            >
              Requests
            </p>
            <h4
              className={`text-lg font-bold ${activeServiceTab === "COCP"
                  ? "text-white"
                  : "text-pink-400"
                }`}
            >
              COCP ({cocpResponse?.data?.length ?? 0})
            </h4>
          </button>
        </div>

        {/* Requests Table */}
        <div className="p-6 bg-white shadow-md rounded-xl border-b-2 border-gray-400 overflow-x-auto">
          <h4 className="text-lg font-semibold mb-4">
            {activeServiceTab} Requests
          </h4>

          {serviceLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading service requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-4 text-center text-gray-500 italic">
              No {activeServiceTab} requests found for this user.
            </div>
          ) : (
            <table className="w-full border border-pink-200 rounded-2xl">
              <thead>
                <tr className="bg-fuchsia-100">
                  <th className="p-2 border border-pink-200 text-left">
                    Date
                  </th>
                  <th className="p-2 border border-pink-200 text-left">
                    Time
                  </th>
                  <th className="p-2 border border-pink-200 text-left">
                    Status
                  </th>
                  <th className="p-2 border border-pink-200 text-left">
                    Delivery Status
                  </th>
                  <th className="p-2 border border-pink-200 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const requestType = activeServiceTab.toLowerCase();
                  const { date, time } = formatDateTime(req.createdAt || "");

                  return (
                    <tr
                      key={req._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 border-b border-pink-100">{date}</td>
                      <td className="p-3 border-b border-pink-100">{time}</td>
                      <td className="p-3 border-b border-pink-100">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === "accept"
                              ? "bg-green-100 text-green-700"
                              : req.status === "decline"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {req.status.charAt(0).toUpperCase() +
                            req.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 border-b border-pink-100">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${req.deliveryStatus === DeliveryStatus.Done
                              ? "bg-green-100 text-green-700"
                              : req.deliveryStatus === DeliveryStatus.Started
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {req.deliveryStatus
                            ? req.deliveryStatus.charAt(0).toUpperCase() +
                            req.deliveryStatus.slice(1)
                            : "Pending"}
                        </span>
                      </td>
                      <td className="p-3 border-b border-pink-100 text-center">
                        <Link
                          href={`/dashboard/our-service/${req._id}?type=${requestType}`}
                          className="px-3 py-1 bg-blue-200 hover:bg-blue-500 text-blue-800 hover:text-white rounded border border-blue-300 transition-colors"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;

