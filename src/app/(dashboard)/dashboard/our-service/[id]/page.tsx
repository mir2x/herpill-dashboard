"use client";

import {
  useGetPopByIdQuery,
  useGetCocpByIdQuery,
  useUpdatePopDeliveryStatusMutation,
  useUpdateCocpDeliveryStatusMutation,
} from "@/api/serviceApi";
import { useResolveUserChatMutation } from "@/api/chatApi";
import { useGetAllUserQuery } from "@/api/userApi";
import { Pop, Cocp, User, DeliveryStatus } from "@/types";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Phone,
  Pill,
  User as UserIcon,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

// Reusable component for displaying key-value pairs
const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | string[] | boolean | number | null;
}) => {
  let displayValue: React.ReactNode = "Not Provided";

  if (value === true || value === false) {
    displayValue = (
      <div
        className={`flex items-center gap-1.5 font-semibold ${value ? "text-green-600" : "text-red-600"
          }`}
      >
        {value ? <CheckCircle size={16} /> : <XCircle size={16} />}
        <span>{value ? "Yes" : "No"}</span>
      </div>
    );
  } else if (Array.isArray(value) && value.length > 0) {
    displayValue = value.join(", ");
  } else if (value) {
    displayValue = String(value);
  }

  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-gray-800 font-medium mt-1 break-words">
        {displayValue}
      </p>
    </div>
  );
};

const ServiceDetailsPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const type = searchParams.get("type"); // 'pop' or 'cocp'

  // Conditionally fetch data based on the 'type' query parameter
  const {
    data: popResponse,
    isLoading: isPopLoading,
  } = useGetPopByIdQuery(id, { skip: type !== "pop" });
  const {
    data: cocpResponse,
    isLoading: isCocpLoading,
  } = useGetCocpByIdQuery(id, { skip: type !== "cocp" });

  // Fetch staff members
  const { data: staffResponse, isLoading: isStaffLoading } = useGetAllUserQuery({
    isStaff: true,
    limit: 1000,
  });
  const staffList = staffResponse?.data || [];

  const [selectedStaff, setSelectedStaff] = useState<string>("");

  const [updatePopStatus, { isLoading: isPopUpdateLoading }] =
    useUpdatePopDeliveryStatusMutation();
  const [updateCocpStatus, { isLoading: isCocpUpdateLoading }] =
    useUpdateCocpDeliveryStatusMutation();
  const [resolveUserChat, { isLoading: isResolvingChat }] =
    useResolveUserChatMutation();
  const isUpdating = isPopUpdateLoading || isCocpUpdateLoading;

  const isLoading = isPopLoading || isCocpLoading;
  const response = type === "pop" ? popResponse : cocpResponse;

  if (isLoading)
    return (
      <div className="p-8 text-center text-pink-500">
        Loading service request details...
      </div>
    );
  if (!type)
    return (
      <div className="p-8 text-center text-red-500">
        Error: Service type is missing.
      </div>
    );
  if (!response?.success)
    return (
      <div className="p-8 text-center text-red-500">
        Could not find the requested service.
      </div>
    );

  const requestData = response.data as Pop | Cocp;
  const user = requestData.userId as User;
  const requestType = type.toUpperCase();

  const handleSendMessage = async () => {
    try {
      const response = await resolveUserChat(user._id).unwrap();
      if (response.success) {
        router.push(`/dashboard/messages/${response.data._id}`);
      } else {
        toast.error(response.message || "Unable to open conversation.");
      }
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "data" in err &&
        err.data &&
        typeof err.data === "object" &&
        "message" in err.data
          ? String(err.data.message)
          : "Unable to open conversation.";
      toast.error(message);
    }
  };

  const joinedOn = new Date(user.createdAt!).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format date of birth if available
  const dateOfBirthFormatted = user.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null;

  const handleUpdateDeliveryStatus = async (
    newStatus: DeliveryStatus.Started | DeliveryStatus.Done
  ) => {
    if (newStatus === DeliveryStatus.Done && !selectedStaff) {
      toast.error("Please select a staff member who delivered the service.");
      return;
    }

    // Find the staff name from the ID if needed, or just pass the name if the value is the name.
    // The requirement says "their name will be shown in dropdown... and sent the name choosen"
    // Assuming selectedStaff holds the name. If it holds ID, we need to find the name.
    // Let's assume the dropdown values are names for simplicity as per "sent the name choosen".

    const promise: Promise<unknown> =
      type === "pop"
        ? updatePopStatus({
          id,
          deliveryStatus: newStatus,
          deliveredBy: newStatus === DeliveryStatus.Done ? selectedStaff : undefined,
        }).unwrap()
        : updateCocpStatus({
          id,
          deliveryStatus: newStatus,
          deliveredBy: newStatus === DeliveryStatus.Done ? selectedStaff : undefined,
        }).unwrap();

    toast.promise(promise, {
      loading: "Updating delivery status...",
      success: "Status updated successfully!",
      error: "Failed to update status.",
    });
  };

  return (
    <div className="p-6 bg-pink-50/70 min-h-screen text-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 mb-2"
          >
            <ArrowLeft size={16} />
            Back to Service List
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {requestType} Request Details
          </h1>
        </div>
        <button
          onClick={handleSendMessage}
          disabled={isResolvingChat}
          className="bg-pink-200 text-pink-800 hover:bg-pink-400 hover:text-white px-4 py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isResolvingChat ? "Opening..." : "Send Message"}
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white p-8 rounded-xl shadow-md space-y-10">
        {/* User Profile Section */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <UserIcon /> User Information
          </h2>
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
            <div className="text-center sm:text-left grid gap-1">
              <h3 className="text-2xl font-bold">
                {`${user.firstName} ${user.surname || ""}`.trim()}
              </h3>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500">
                <Phone size={16} />
                <span>{user.phoneNumber || "Not Provided"}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500">
                <Calendar size={16} />
                <span>Joined on {joinedOn}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Request Details Section */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <Pill /> Contraception Request Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Common Fields from requestData */}
            <DetailItem label="Consent Given" value={requestData.consent} />
            <DetailItem
              label="Consent to Share with GP"
              value={requestData.shareConsent}
            />
            <DetailItem
              label="Wants to Speak with Specialist"
              value={requestData.speakWithSpecialist}
            />
            <DetailItem
              label="Medical History"
              value={requestData.medicalHistory}
            />
            <DetailItem
              label="Medical Details"
              value={requestData.medicalDetails}
            />
            <DetailItem
              label="Currently Pregnant"
              value={requestData.isPregnant}
            />
            <DetailItem
              label="Exclusions Noted"
              value={requestData.exclusions}
            />
            <DetailItem
              label="Appointment Needed"
              value={requestData.needAppointment}
            />
            <DetailItem
              label="Request Status"
              value={
                requestData.status.charAt(0).toUpperCase() +
                requestData.status.slice(1)
              }
            />

            <DetailItem
              label="Delivery Status"
              value={
                requestData.deliveryStatus
                  ? requestData.deliveryStatus.charAt(0).toUpperCase() +
                  requestData.deliveryStatus.slice(1)
                  : "Pending"
              }
            />

            {requestData.status === "accept" && (
              <section>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                  <Truck /> Delivery Management
                </h2>
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-sm text-gray-500">
                        Current Delivery Status
                      </p>
                      <p className="text-lg font-bold text-pink-600 mt-1 capitalize">
                        {requestData.deliveryStatus || "Pending"}
                      </p>
                      {requestData.deliveredBy && (
                        <p className="text-sm text-gray-600 mt-1">
                          Delivered by: <span className="font-medium">{requestData.deliveredBy}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          handleUpdateDeliveryStatus(DeliveryStatus.Started)
                        }
                        disabled={
                          isUpdating ||
                          requestData.deliveryStatus === "started" ||
                          requestData.deliveryStatus === "done"
                        }
                        className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      >
                        {isUpdating ? "Updating..." : "Mark as Started"}
                      </button>
                    </div>
                  </div>

                  {/* Staff Selection and Done Button */}
                  {requestData.deliveryStatus !== DeliveryStatus.Done && (
                    <div className="flex flex-col sm:flex-row items-end gap-4 border-t pt-4 border-gray-200">
                      <div className="w-full sm:w-auto flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivered By (Staff)
                        </label>
                        <select
                          value={selectedStaff}
                          onChange={(e) => setSelectedStaff(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                          disabled={isUpdating || isStaffLoading}
                        >
                          <option value="">Select Staff</option>
                          {staffList.map((staff) => (
                            <option
                              key={staff._id}
                              value={`${staff.firstName} ${staff.surname || ""}`.trim()}
                            >
                              {staff.firstName} {staff.surname}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateDeliveryStatus(DeliveryStatus.Done)
                        }
                        disabled={
                          isUpdating || !selectedStaff
                        }
                        className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      >
                        {isUpdating ? "Updating..." : "Mark as Done"}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* NEW: User-specific details */}
            <DetailItem label="Date of Birth" value={dateOfBirthFormatted} />
            <DetailItem label="Postcode" value={user.postcode} />
            <DetailItem label="Gender" value={user.gender} />
            <DetailItem label="Sex" value={user.sex} />
            <DetailItem label="NHS Number" value={user.nhs} />
            <DetailItem
              label="Current Contraception"
              value={user.contraception}
            />

            {/* Conditional Fields for POP vs COCP */}
            {type === "pop" && (
              <DetailItem
                label="POP Choice"
                value={(requestData as Pop).popOptions}
              />
            )}
            {type === "cocp" && (
              <>
                <DetailItem
                  label="COCP Choice"
                  value={(requestData as Cocp).cocp}
                />
                <DetailItem
                  label="Other Drugs"
                  value={(requestData as Cocp).drugs}
                />
                <DetailItem
                  label="Blood Pressure Status"
                  value={(requestData as Cocp).bloodPreasureStatus}
                />
                <DetailItem label="BMI" value={(requestData as Cocp).bmi} />
                <DetailItem
                  label="Systolic BP"
                  value={(requestData as Cocp).systolic}
                />
                <DetailItem
                  label="Diastolic BP"
                  value={(requestData as Cocp).diastolic}
                />
                <DetailItem
                  label="Weight Recently Checked"
                  value={(requestData as Cocp).weightChecked}
                />
                <DetailItem
                  label="Additional Comments"
                  value={(requestData as Cocp).comment}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServiceDetailsPage;
