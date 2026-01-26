"use client";

import {
  useGetPopsQuery,
  useGetCocpsQuery,
  useDeletePopMutation,
  useDeleteCocpMutation,
  useUpdatePopStatusMutation,
  useUpdateCocpStatusMutation,
} from "@/api/serviceApi";
import { Pop, Cocp, User, DeliveryStatus } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

// Enum for the *approval* status
enum ServiceStatus {
  Pending = "pending",
  Accept = "accept",
  Decline = "decline",
}

// Enum for the UI tabs
enum TabStatus {
  Pending = "pending",
  Accept = "accept",
  Decline = "decline",
  Done = "done",
}

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

// Type for grouped requests
interface GroupedRequests {
  user: Partial<User>;
  requests: (Pop | Cocp)[];
}

const OurServicePage = () => {
  const [activeServiceTab, setActiveServiceTab] = useState<"POP" | "COCP">(
    "POP"
  );
  const [activeStatusTab, setActiveStatusTab] = useState<TabStatus>(
    TabStatus.Pending
  );

  // Pagination state
  const [popPage, setPopPage] = useState(1);
  const [cocpPage, setCocpPage] = useState(1);
  const localLimit = 10;

  // RTK Query Data Fetching Hooks
  const popQueryParams = { page: 1, limit: 1000 };
  const cocpQueryParams = { page: 1, limit: 1000 };

  const {
    data: popResponse,
    isLoading: isPopLoading,
    isFetching: isPopFetching,
    isError: isPopError,
  } = useGetPopsQuery(popQueryParams, {
    skip: activeServiceTab !== "POP",
  });

  const {
    data: cocpResponse,
    isLoading: isCocpLoading,
    isFetching: isCocpFetching,
    isError: isCocpError,
  } = useGetCocpsQuery(cocpQueryParams, {
    skip: activeServiceTab !== "COCP",
  });

  // RTK Query Mutation Hooks
  const [deletePop] = useDeletePopMutation();
  const [deleteCocp] = useDeleteCocpMutation();
  const [updatePopStatus, { isLoading: isUpdatingPop }] =
    useUpdatePopStatusMutation();
  const [updateCocpStatus, { isLoading: isUpdatingCocp }] =
    useUpdateCocpStatusMutation();

  const isUpdatingStatus = isUpdatingPop || isUpdatingCocp;

  // Event Handlers
  const handleServiceTabChange = (tab: "POP" | "COCP") => {
    setActiveServiceTab(tab);
    setPopPage(1);
    setCocpPage(1);
  };

  const handleStatusTabChange = (status: TabStatus) => {
    setActiveStatusTab(status);
    if (activeServiceTab === "POP") {
      setPopPage(1);
    } else {
      setCocpPage(1);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    status: "accept" | "decline"
  ) => {
    const actionText = status === "accept" ? "accept" : "decline";
    try {
      const mutation =
        activeServiceTab === "POP" ? updatePopStatus : updateCocpStatus;
      const response = await mutation({ id, status }).unwrap();
      toast.success(
        response.message || `Request successfully ${actionText}ed.`
      );
    } catch (err: any) {
      console.error(`Failed to ${actionText} request:`, err);
      toast.error(
        err.data?.message ||
        `An error occurred while trying to ${actionText} the request.`
      );
    }
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This request will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const mutation = activeServiceTab === "POP" ? deletePop : deleteCocp;
          const response = await mutation(id).unwrap();
          toast.success(response.message || "Request deleted successfully!");
          Swal.fire("Deleted!", "The request has been removed.", "success");
        } catch (err: any) {
          console.error("Failed to delete request::", err);
          toast.error(err.data?.message || "An error occurred while deleting.");
        }
      }
    });
  };

  // Derived State
  const isLoading = activeServiceTab === "POP" ? isPopLoading : isCocpLoading;
  const isFetching =
    activeServiceTab === "POP" ? isPopFetching : isCocpFetching;
  const isError = activeServiceTab === "POP" ? isPopError : isCocpError;
  const responseData = activeServiceTab === "POP" ? popResponse : cocpResponse;

  const allRequests = responseData?.data || [];

  // Filter data based on the activeStatusTab
  const filteredRequests = allRequests.filter((req: Pop | Cocp) => {
    switch (activeStatusTab) {
      case TabStatus.Pending:
        return req.status === ServiceStatus.Pending;
      case TabStatus.Decline:
        return req.status === ServiceStatus.Decline;
      case TabStatus.Accept:
        return (
          req.status === ServiceStatus.Accept &&
          req.deliveryStatus !== DeliveryStatus.Done
        );
      case TabStatus.Done:
        return (
          req.status === ServiceStatus.Accept &&
          req.deliveryStatus === DeliveryStatus.Done
        );
      default:
        return false;
    }
  });

  // Helper function to extract user from request
  const getUser = (user: User | string): Partial<User> => {
    return typeof user === "object" ? user : { _id: user };
  };

  // Group requests by user
  const groupedRequests = useMemo(() => {
    const groups: Map<string, GroupedRequests> = new Map();

    filteredRequests.forEach((req: Pop | Cocp) => {
      const user = getUser(req.userId);
      const userId = user._id || "unknown";

      if (!groups.has(userId)) {
        groups.set(userId, { user, requests: [] });
      }
      groups.get(userId)!.requests.push(req);
    });

    return Array.from(groups.values());
  }, [filteredRequests]);

  // Pagination for grouped view (paginate by groups, not individual requests)
  const currentPage = activeServiceTab === "POP" ? popPage : cocpPage;
  const setPage = activeServiceTab === "POP" ? setPopPage : setCocpPage;

  const totalGroups = groupedRequests.length;
  const totalPage = Math.ceil(totalGroups / localLimit);
  const startIndex = (currentPage - 1) * localLimit;
  const endIndex = startIndex + localLimit;

  const groupsToDisplay = groupedRequests.slice(startIndex, endIndex);

  // Status Tab Data
  const statusTabs: { label: string; status: TabStatus }[] = [
    { label: "Pending", status: TabStatus.Pending },
    { label: "Accepted", status: TabStatus.Accept },
    { label: "Declined", status: TabStatus.Decline },
    { label: "Delivery Done", status: TabStatus.Done },
  ];

  // Helper function for tab counts
  const getTabCount = (status: TabStatus): number => {
    switch (status) {
      case TabStatus.Pending:
        return allRequests.filter((r) => r.status === ServiceStatus.Pending)
          .length;
      case TabStatus.Decline:
        return allRequests.filter((r) => r.status === ServiceStatus.Decline)
          .length;
      case TabStatus.Accept:
        return allRequests.filter(
          (r) =>
            r.status === ServiceStatus.Accept &&
            r.deliveryStatus !== DeliveryStatus.Done
        ).length;
      case TabStatus.Done:
        return allRequests.filter(
          (r) =>
            r.status === ServiceStatus.Accept &&
            r.deliveryStatus === DeliveryStatus.Done
        ).length;
      default:
        return 0;
    }
  };

  // Component Render
  return (
    <div>
      {/* Service Tabs (POP/COCP) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
        <div
          onClick={() => handleServiceTabChange("POP")}
          className={`cursor-pointer rounded-xl shadow-md p-6 border-b-2 border-gray-400 group transition-all duration-300 ${activeServiceTab === "POP"
              ? "bg-pink-300 text-white"
              : "bg-white hover:bg-pink-200"
            }`}
        >
          <p
            className={`text-md font-medium ${activeServiceTab === "POP"
                ? "text-white"
                : "text-gray-600 group-hover:text-white"
              }`}
          >
            Request
          </p>
          <h2
            className={`text-2xl font-bold ${activeServiceTab === "POP"
                ? "text-white"
                : "text-pink-400 group-hover:text-white"
              }`}
          >
            Progesterone Only Pill (POP)
          </h2>
        </div>

        <div
          onClick={() => handleServiceTabChange("COCP")}
          className={`cursor-pointer rounded-xl shadow-md p-6 border-b-2 border-gray-400 group transition-all duration-300 ${activeServiceTab === "COCP"
              ? "bg-pink-300 text-white"
              : "bg-white hover:bg-pink-200"
            }`}
        >
          <p
            className={`text-md font-medium ${activeServiceTab === "COCP"
                ? "text-white"
                : "text-gray-600 group-hover:text-white"
              }`}
          >
            Request
          </p>
          <h2
            className={`text-2xl font-bold ${activeServiceTab === "COCP"
                ? "text-white"
                : "text-pink-400 group-hover:text-white"
              }`}
          >
            Combined Contraceptive Pill (COCP)
          </h2>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex justify-center flex-wrap gap-4 mb-16">
        {statusTabs.map((tab) => (
          <button
            key={tab.status}
            onClick={() => handleStatusTabChange(tab.status)}
            className={`py-2 px-6 rounded-lg text-lg font-semibold transition-all duration-200 
              ${activeStatusTab === tab.status
                ? "bg-fuchsia-400 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-fuchsia-200"
              }`}
          >
            {tab.label} ({getTabCount(tab.status)})
          </button>
        ))}
      </div>

      {/* Table & Pagination Container */}
      <div className="p-6 bg-white shadow-md rounded-md text-gray-800 my-16 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {activeServiceTab} Requests –{" "}
            {activeStatusTab.charAt(0).toUpperCase() + activeStatusTab.slice(1)}
          </h2>
          {isFetching && (
            <span className="text-pink-400 text-sm animate-pulse">
              Updating...
            </span>
          )}
        </div>

        {/* Grouped Requests View */}
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading service data...
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-red-500">
            Failed to load data. Please try again.
          </div>
        ) : groupsToDisplay.length === 0 ? (
          <div className="p-4 text-center text-gray-500 italic">
            No {activeStatusTab} requests found for {activeServiceTab}.
          </div>
        ) : (
          <div className="space-y-6">
            {groupsToDisplay.map((group) => {
              const user = group.user;
              const userId = user._id || "unknown";

              return (
                <div
                  key={userId}
                  className="border border-pink-200 rounded-xl overflow-hidden"
                >
                  {/* User Header Row */}
                  <div className="bg-fuchsia-100 p-4 flex items-center gap-4">
                    <Image
                      src={
                        user.avatar ||
                        "https://i.postimg.cc/4xLZjmW2/dfb6892164e638fc869bc424d651235a519c6d80.png"
                      }
                      alt={user.firstName || "User Avatar"}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover border-2 border-pink-300"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">
                        {user.firstName || "Unknown"}{" "}
                        {user.surname && user.surname}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>{user.email || "No email"}</span>
                        <span>•</span>
                        <span>{user.phoneNumber || "No phone"}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                      {group.requests.length} request
                      {group.requests.length > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Requests Table */}
                  <table className="w-full">
                    <thead>
                      <tr className="bg-pink-50">
                        <th className="p-2 border-b border-pink-200 text-left">
                          Date
                        </th>
                        <th className="p-2 border-b border-pink-200 text-left">
                          Time
                        </th>
                        <th className="p-2 border-b border-pink-200 text-left">
                          Delivery Status
                        </th>
                        <th className="p-2 border-b border-pink-200 text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.requests.map((req) => {
                        const requestType = activeServiceTab.toLowerCase();
                        const { date, time } = formatDateTime(
                          req.createdAt || ""
                        );

                        return (
                          <tr
                            key={req._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-3 border-b border-pink-100">
                              {date}
                            </td>
                            <td className="p-3 border-b border-pink-100">
                              {time}
                            </td>
                            <td className="p-3 border-b border-pink-100">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${req.deliveryStatus === DeliveryStatus.Done
                                    ? "bg-green-100 text-green-700"
                                    : req.deliveryStatus ===
                                      DeliveryStatus.Started
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
                            <td className="p-3 border-b border-pink-100">
                              <div className="flex gap-2 justify-center items-center">
                                {req.status === ServiceStatus.Pending && (
                                  <>
                                    <Link
                                      href={`/dashboard/our-service/${req._id}?type=${requestType}`}
                                      className="px-3 py-1 bg-blue-200 hover:bg-blue-500 text-blue-800 hover:text-white rounded border border-blue-300 transition-colors"
                                    >
                                      Details
                                    </Link>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(req._id, "accept")
                                      }
                                      disabled={isUpdatingStatus}
                                      className="px-3 py-1 bg-green-200 hover:bg-green-500 text-green-800 hover:text-white rounded border border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(req._id, "decline")
                                      }
                                      disabled={isUpdatingStatus}
                                      className="px-3 py-1 bg-yellow-200 hover:bg-yellow-500 text-yellow-800 hover:text-white rounded border border-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                                {(req.status === ServiceStatus.Accept ||
                                  req.status === ServiceStatus.Decline) && (
                                    <>
                                      <Link
                                        href={`/dashboard/our-service/${req._id}?type=${requestType}`}
                                        className="px-3 py-1 bg-blue-200 hover:bg-blue-500 text-blue-800 hover:text-white rounded border border-blue-300 transition-colors"
                                      >
                                        Details
                                      </Link>
                                      <button
                                        onClick={() => handleDelete(req._id)}
                                        className="px-3 py-1 bg-red-200 hover:bg-red-500 text-red-800 hover:text-white rounded border border-red-300 transition-colors"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !isError && totalPage > 1 && (
          <div className="flex justify-end items-center mt-6 space-x-2">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isFetching}
              className="px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 rounded-lg hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700 text-sm">
              Page {currentPage} of {totalPage}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPage, currentPage + 1))}
              disabled={currentPage === totalPage || isFetching}
              className="px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 rounded-lg hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OurServicePage;
