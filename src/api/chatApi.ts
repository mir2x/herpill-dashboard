import {
  ApiResponse,
  ChatsResponseData,
  Message,
  MessagesResponseData,
  SendImageRequest,
} from "@/types";
import { baseApi } from "./api";

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<ApiResponse<ChatsResponseData>, void>({
      query: () => "chat?user=true",
      providesTags: ["ChatList"],
    }),

    getMessages: builder.query<ApiResponse<MessagesResponseData>, string>({
      query: (chatId) => `message?chatId=${chatId}`,
      providesTags: (result, error, chatId) => [
        { type: "Messages", id: chatId },
      ],
    }),

    sendImageMessage: builder.mutation<ApiResponse<Message>, SendImageRequest>({
      query: ({ chatId, attachment }) => {
        const formData = new FormData();
        formData.append("chatId", chatId);
        formData.append("attachment", attachment);
        return {
          url: "message/create",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Messages", id: chatId },
      ],
    }),

    deleteChat: builder.mutation<ApiResponse<null>, string>({
      query: (chatId) => ({
        url: `chat/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ChatList"],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendImageMessageMutation,
  useDeleteChatMutation,
} = chatApi;
