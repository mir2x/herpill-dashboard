"use client";

import {
  useGetAllUserQuery,
  useToggleUserStatusMutation,
  useDeleteUserMutation,
} from "@/api/userApi";
import { User as UserIcon, Trash2, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { CreateStaffModal } from "../Staff/CreateStaffModal";
// Import the modal

interface UserManagementPageProps {
  userType: "user" | "staff";
}

const UserManagementPage = ({ userType }: UserManagementPageProps) => {
  const isStaffPage = userType === "staff";
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  // State to control the visibility of the "Create Staff" modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageTitle = isStaffPage ? "Staff Management" : "Users";
  const listTitle = isStaffPage ? "Staff List" : "User List";
  const emptyListMessage = `No ${userType}s found.`;
  const detailsLinkPrefix = isStaffPage
    ? "/dashboard/staff"
    : "/dashboard/user";

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllUserQuery({ page, limit, isStaff: isStaffPage });

  const [toggleUserStatus, { isLoading: isTogglingStatus }] =
    useToggleUserStatusMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleToggleStatus = async (
    id: string,
    currentBlockedStatus: boolean
  ) => {
    try {
      await toggleUserStatus({ id, blocked: !currentBlockedStatus }).unwrap();
      toast.success("User status updated successfully!");
    } catch (err: any) {
      toast.error(
        err.data?.message || "An error occurred while updating status."
      );
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete this staff member: ${name}? This action cannot be undone.`
      )
    ) {
      try {
        await deleteUser(id).unwrap();
        toast.success("Staff member deleted successfully!");
      } catch (err: any) {
        toast.error(err.data?.message || "Failed to delete staff member.");
      }
    }
  };

  const users = usersResponse?.data || [];
  const meta = usersResponse?.meta;
  const totalPage = meta?.totalPage || 1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-pink-400">
        Loading {pageTitle}...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
        <p className="text-xl mb-4">Error loading data for {pageTitle}.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="text-gray-800 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 text-pink-500">
          <UserIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>

        {/* User Table Card (Design is preserved) */}
        <div className="p-6 bg-white shadow-md rounded-xl text-gray-800 my-16 border-b-2 border-gray-400 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{listTitle}</h2>

            {/* "Create Staff" is now a button that opens the modal */}
            {isStaffPage && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors shadow-sm"
              >
                <PlusCircle size={20} />
                Create Staff
              </button>
            )}

            {isFetching && !isLoading && (
              <span className="text-pink-400 text-sm">Updating...</span>
            )}
          </div>

          {users.length === 0 ? (
            <p className="text-center text-gray-600 py-4">{emptyListMessage}</p>
          ) : (
            <table className="w-full border border-pink-200 rounded-2xl">
              <thead>
                <tr className="bg-fuchsia-100">
                  <th className="p-2 border border-pink-200">Image</th>
                  <th className="p-2 border border-pink-200">Name</th>
                  <th className="p-2 border border-pink-200">Email</th>
                  <th className="p-2 border border-pink-200">Status</th>
                  <th className="p-2 border border-pink-200">Block/Unblock</th>
                  <th className="p-2 border border-pink-200">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="text-center">
                    <td className="p-1 border border-pink-200 flex justify-center">
                      <Image
                        src={
                          user.avatar ||
                          "https://i.postimg.cc/4xLZjmW2/dfb6892164e638fc869bc424d651235a519c6d80.png"
                        }
                        alt={user.firstName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                        quality={100}
                      />
                    </td>
                    <td className="p-2 border border-pink-200">
                      {`${user.firstName} ${user.surname || ""}`.trim()}
                    </td>
                    <td className="p-2 border border-pink-200">{user.email}</td>
                    <td className="p-2 border border-pink-200">
                      {user.blocked ? (
                        <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                          Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-2 border border-pink-200">
                      {isStaffPage ? (
                        <button
                          onClick={() =>
                            handleDeleteUser(
                              user._id,
                              `${user.firstName} ${user.surname || ""}`.trim()
                            )
                          }
                          disabled={isDeleting}
                          className="flex items-center justify-center gap-1 mx-auto px-3 py-1 bg-transparent hover:bg-red-500 text-red-600 hover:text-white rounded border border-red-500 disabled:opacity-50"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      ) : (
                        <div className="w-full flex gap-5 justify-center items-center px-4 py-2">
                          <span>{user.blocked ? "Unblock" : "Block"}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={user.blocked}
                              onChange={() =>
                                handleToggleStatus(user._id, user.blocked)
                              }
                              disabled={isTogglingStatus}
                            />
                            <div className="w-11 h-6 bg-green-500 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-pink-300 peer-checked:bg-red-500"></div>
                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-full"></div>
                          </label>
                        </div>
                      )}
                    </td>
                    <td className="p-2 border border-pink-200">
                      <Link
                        href={`${detailsLinkPrefix}/${user._id}`}
                        className="px-3 py-1 bg-transparent hover:bg-pink-400 text-gray-700 hover:text-white rounded border border-pink-400"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          {totalPage > 1 && (
            <div className="flex justify-end items-center mt-6 space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 rounded-lg hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-700 text-sm">
                Page {page} of {totalPage}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                disabled={page === totalPage || isFetching}
                className="px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 rounded-lg hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render the modal component */}
      <CreateStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default UserManagementPage;
