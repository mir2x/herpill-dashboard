import {
  AllUsersResponseData,
  ApiResponse,
  CreateStaffRequest,
  LoginResponseData,
  ProfileResponseData,
  UpdateAvatarRequest,
  UpdateUserDetailsRequest,
  User,
} from "@/types";
import { baseApi } from "./api";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStaff: builder.mutation<
      ApiResponse<LoginResponseData>,
      CreateStaffRequest
    >({
      query: (credentials) => ({
        url: "auth/register",
        method: "POST",
        // The role is fixed to 'staff' as per the requirement
        body: { ...credentials, role: "staff" },
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
    getProfile: builder.query<ApiResponse<ProfileResponseData>, void>({
      query: () => "user/profile",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation<
      ApiResponse<ProfileResponseData>,
      Partial<User>
    >({
      query: (body) => ({
        url: "user/update",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    updateUserDetails: builder.mutation<
      ApiResponse<User>,
      { id: string; data: UpdateUserDetailsRequest }
    >({
      query: ({ id, data }) => ({
        url: `user/${id}/details`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    updateAvatar: builder.mutation<
      ApiResponse<ProfileResponseData>,
      UpdateAvatarRequest
    >({
      query: ({ avatar }) => {
        const formData = new FormData();
        formData.append("avatar", avatar);

        return {
          url: "user/update-avatar",
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["User"],
    }),

    getAllUser: builder.query<
      AllUsersResponseData,
      { page?: number; limit?: number; isStaff?: boolean }
    >({
      query: ({ page, limit, isStaff } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());
        if (isStaff) params.append("staff", "true");

        return `user?${params.toString()}`;
      },

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: {
          data: User[];
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPage: number;
          };
        };
      }) => {
        return {
          success: response.success as true,
          message: response.message,
          data: response.data.data,
          meta: response.data.meta,
        };
      },

      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Users" as const,
                id: _id,
              })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),

    getUserById: builder.query<ApiResponse<User>, string>({
      query: (id) => `user/${id}`,
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),

    toggleUserStatus: builder.mutation<
      ApiResponse<User>,
      { id: string; blocked: boolean }
    >({
      query: ({ id, blocked }) => ({
        url: `user/update-blocked-status/${id}`,
        method: "POST",
        body: { blocked },
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),

    deleteUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `auth/delete-account`,
        method: "POST",
        body: { userId: id },
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
  }),
});

export const {
  useCreateStaffMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdateUserDetailsMutation,
  useUpdateAvatarMutation,
  useGetAllUserQuery,
  useGetUserByIdQuery,
  useToggleUserStatusMutation,
  useDeleteUserMutation,
} = userApi;
