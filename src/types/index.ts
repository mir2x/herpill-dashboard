import { User } from "lucide-react";

export type CreateStaffRequest = Pick<User, "email" | "firstName"> & {
  password: string;
};

export interface PaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export type UserRole = "admin" | "user" | "staff";
export type Gender = "male" | "female" | "not-stated" | "non-binary" | "other";
export type Sex = "male" | "female";

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  verified: boolean;
  firstName: string;
  surname?: string;
  avatar?: string;
  dateOfBirth?: string;
  phoneNumber: string;
  gender?: Gender;
  sex?: Sex;
  postcode?: string;
  nhs?: string;
  contraception?: string;
  blocked: boolean;
  deviceTokens?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  method: string;
  email: string;
  password: string;
  deviceToken?: string;
}
export interface LoginSuccessData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TwoFactorRequiredData {
  status: "2fa_required";
  userId: string;
}

export interface TwoFactorSetupData {
  status: "2fa_setup_required";
  userId: string;
  qrCodeImageUrl: string;
}

export type LoginResponseData =
  | LoginSuccessData
  | TwoFactorRequiredData
  | TwoFactorSetupData;

export interface VerifyTwoFactorRequest {
  userId: string;
  token: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  incompleteUsers: number;
  blockedUsers: number;
  newRequests: number;
}

export interface MonthlyUserStat {
  _id: number;
  name: string;
  users: number;
}

export interface DashboardResponseData {
  stats: DashboardStats;
  monthlyStat: MonthlyUserStat[];
  users: User[];
}

export type ProfileResponseData = User;

export type AllUsersResponseData = PaginatedResponse<User>;

export type UpdateAvatarRequest = {
  avatar: File;
};

export interface ChatParticipant {
  user: User;
  unreadCount: number;
}

export interface Chat {
  _id: string;
  participants: ChatParticipant[];
  hiddenFor?: string[];
  createdAt: string;
  updatedAt: string;
}

export type SendMessage = {
  _id: string;
  firstName: string;
  role: string;
  surname: string;
};

export interface Message {
  _id: string;
  chatId: string;
  senderId: string | SendMessage;
  text?: string;
  attachment?: string;
  createdAt: string;
  updatedAt: string;
}

export type SendImageRequest = {
  chatId: string;
  attachment: File;
};

export type ChatsResponseData = PaginatedResponse<Chat>;
export type MessagesResponseData = PaginatedResponse<Message>;

export type ServiceStatus = "pending" | "accept" | "decline";
export enum DeliveryStatus {
  Pending = "pending",
  Started = "started",
  Done = "done",
}

export interface Cocp {
  _id: string;
  userId: User | string;

  consent: boolean;
  shareConsent: boolean;
  speakWithSpecialist: boolean;
  medicalHistory: string[];
  medicalDetails: string;
  isPregnant: boolean;

  drugs: string[];
  cocp: string;

  exclusions: string;
  needAppointment: boolean;

  bloodPreasureStatus: string;

  bmi: number;
  systolic: number;
  diastolic: number;

  weightChecked: boolean;
  comment: string;

  deliveryStatus: DeliveryStatus;
  deliveredBy?: string;
  status: ServiceStatus;
  hiddenFromServiceList?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pop {
  _id: string;
  userId: User | string;

  consent: boolean;
  shareConsent: boolean;
  speakWithSpecialist: boolean;
  medicalHistory: string[];
  medicalDetails: string;
  isPregnant: boolean;

  popOptions: string;

  exclusions: string;
  needAppointment: boolean;

  deliveryStatus: DeliveryStatus;
  deliveredBy?: string;
  status: ServiceStatus;
  hiddenFromServiceList?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AllPopsResponseData = PaginatedResponse<Pop>;
export type AllCocpsResponseData = PaginatedResponse<Cocp>;
