"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useGetChatsQuery, useDeleteChatMutation } from "@/api/chatApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Chat, User } from "@/types";
import { Archive } from "lucide-react";

const getOtherParticipant = (
  chat: Chat,
  currentUserId?: string
): User | null => {
  if (!currentUserId) return null;
  const other = chat.participants.find((p) => p.user && p.user._id !== currentUserId);
  return other?.user || chat.participants.find((p) => p.user)?.user || null;
};

const getAvatarInitials = (name: string = ""): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
const getAvatarColor = (name: string = ""): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
  ];
  return colors[name.length % colors.length];
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const activeChatId = params.chatId as string;

  const { data: chatsResponse, isLoading: isLoadingChats } = useGetChatsQuery();
  const currentUserId = useSelector((state: RootState) => state.auth.user?._id);
  const [deleteChat, { isLoading: isDeletingChat }] = useDeleteChatMutation();

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Hide this conversation from your inbox? The user can still message support again.")) return;
    await deleteChat(chatId).unwrap();
    if (activeChatId === chatId) {
      router.push("/dashboard/messages");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <p className="p-4 text-gray-500">Loading chats...</p>
          ) : (
            chatsResponse?.success &&
            chatsResponse.data.data.map((chat) => {
              const participant = getOtherParticipant(chat, currentUserId);
              if (!participant) return null;
              return (
                <Link
                  key={chat._id}
                  href={`/dashboard/messages/${chat._id}`}
                  passHref
                >
                  <div
                    className={`group flex items-center p-4 border-b border-gray-100 cursor-pointer ${
                      activeChatId === chat._id
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`relative flex-shrink-0 h-12 w-12 rounded-full ${getAvatarColor(
                        participant.firstName
                      )} flex items-center justify-center text-white font-semibold`}
                    >
                      {participant.avatar ? (
                        <Image
                          src={participant.avatar}
                          alt={participant.firstName}
                          layout="fill"
                          className="rounded-full object-cover"
                        />
                      ) : (
                        getAvatarInitials(participant.firstName)
                      )}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-gray-900">
                        {participant.firstName} {participant.surname}
                      </h3>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        ID: {participant._id.slice(-6)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat._id)}
                      disabled={isDeletingChat}
                      className="ml-2 flex-shrink-0 p-1.5 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-opacity disabled:opacity-50"
                      title="Hide conversation"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
      {/* Main Chat Area - Renders the page.tsx for the active chat */}
      <div className="w-2/3 flex flex-col bg-gray-100">{children}</div>
    </div>
  );
}
