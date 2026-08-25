// =====================================================
// Core Firestore Types — Preschool Domain
// =====================================================

import { Timestamp } from "./firebase-types";

// ─── Roles ───────────────────────────────────────────
export type UserRole = "superadmin" | "admin" | "teacher" | "parent";

// ─── Preschool ───────────────────────────────────────
export interface Preschool {
  id: string;
  code: string; // URL slug, e.g. "sloneczko"
  name: string;
  address: Address;
  phone?: string;
  email?: string;
  logoUrl?: string;
  settings: PreschoolSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PreschoolSettings {
  timezone: string; // e.g. "Europe/Warsaw"
  workingHours: { open: string; close: string }; // e.g. { open: "07:00", close: "17:00" }
  currency: "PLN";
  defaultLanguage: "pl" | "en";
}

// ─── User ────────────────────────────────────────────
export interface User {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  phone?: string;
  photoUrl?: string;
  role: UserRole;
  preschoolId: string | null; // null for superadmin
  linkedKidIds: string[]; // for parent role
  fcmTokens: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Custom claims stored in Firebase Auth token
export interface AuthClaims {
  role: UserRole;
  preschoolId: string | null;
}

// ─── Group ───────────────────────────────────────────
export interface Group {
  id: string;
  preschoolId: string;
  name: string;
  teacherIds: string[];
  ageRange?: string; // e.g. "3-4 years"
  description?: string;
  colorHex?: string; // for UI differentiation
  createdAt: Timestamp;
}

export interface KidGuardian {
  uid?: string;
  name: string;
  email?: string;
  phone?: string;
  relation?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

export type FoodAllergyKey =
  | "gluten"
  | "dairy"
  | "egg"
  | "nuts"
  | "soy"
  | "fish";

// ─── Kid ─────────────────────────────────────────────
export interface Kid {
  id: string;
  preschoolId: string;
  firstName: string;
  lastName: string;
  pesel?: string;
  groupId: string;
  parentIds: string[]; // Firebase Auth UIDs
  guardians?: KidGuardian[];
  emergencyContacts?: EmergencyContact[];
  primaryParentName?: string;
  primaryParentEmail?: string;
  photoUrl?: string;
  birthDate: Timestamp;
  allergies?: string[];
  medicalNotes?: string;
  pickupNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Attendance ──────────────────────────────────────
export type AttendanceStatus = "present" | "absent" | "excused" | "late";

export interface AttendanceEntry {
  kidId: string;
  status: AttendanceStatus;
  checkInTime: Timestamp | null;
  checkOutTime: Timestamp | null;
  notes?: string;
  recordedBy: string; // Teacher UID
  updatedAt: Timestamp;
}

// dateStr format: "2025-02-22"
export interface AttendanceDay {
  dateStr: string;
  preschoolId: string;
  entries: Record<string, AttendanceEntry>; // kidId → entry
}

// ─── Menu ────────────────────────────────────────────
export type MealType =
  | "breakfast"
  | "second_breakfast"
  | "lunch"
  | "dessert"
  | "snack";

export interface MealItem {
  recipeId?: string;
  name: string;
  description?: string;
  specialDietMeals?: Partial<Record<FoodAllergyKey, {
    recipeId?: string;
    name: string;
    description?: string;
  }>>;
}

export type DayMeals = Partial<Record<MealType, MealItem>>;

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";

export interface WeeklyMenu {
  id: string; // e.g. "2025-W08"
  preschoolId: string;
  year: number;
  week: number;
  days: Partial<Record<WeekDay, DayMeals>>;
  publishedAt: Timestamp | null;
  publishedBy: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Recipe ──────────────────────────────────────────
export type RecipeCategory =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dessert"
  | "soup"
  | "main";

export interface Recipe {
  id: string;
  preschoolId: string;
  name: string;
  description?: string;
  category: RecipeCategory;
  ingredients: string[];
  instructions?: string;
  photoUrl?: string;
  tags?: string[];
  allergens?: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Activity ────────────────────────────────────────
export interface ActivityItem {
  time: string; // e.g. "09:00"
  title: string;
  description?: string;
  groupId?: string | null; // null = whole preschool
  emoji?: string;
}

export interface DailyActivity {
  dateStr: string; // "2025-02-22"
  preschoolId: string;
  items: ActivityItem[];
  createdBy: string;
  updatedAt: Timestamp;
}

// ─── Announcement ────────────────────────────────────
export type AnnouncementTarget = "all" | "group";

export interface Announcement {
  id: string;
  preschoolId: string;
  title: string;
  body: string;
  targetType: AnnouncementTarget;
  targetGroupId: string | null;
  authorId?: string;
  authorName: string;
  attachmentUrls?: string[];
  isPinned: boolean;
  comments?: AnnouncementComment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AnnouncementComment {
  id?: string;
  authorId?: string;
  authorName: string;
  text: string;
  createdAt: string | Timestamp | any;
}

// ─── Messaging ───────────────────────────────────────
export type ConversationType = "kid" | "group";

export interface Conversation {
  id: string;
  preschoolId: string;
  participantIds: string[]; // [teacherUid, parentUid]
  type?: ConversationType;
  kidId?: string | null;
  kidName?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
    read: boolean;
  } | null;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  attachmentUrls?: string[];
  read: boolean;
  readAt: Timestamp | null;
  createdAt: Timestamp;
}

// ─── Billing ─────────────────────────────────────────
export type BillingItemType =
  | "attendance_per_day"
  | "fixed_monthly"
  | "custom_one_time";

export interface BillingItem {
  id: string;
  preschoolId: string;
  name: string;
  type: BillingItemType;
  amountGrosze: number; // PLN cents (e.g. 4500 = 45.00 PLN)
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceLineItem {
  billingItemId: string;
  name: string;
  quantity: number;
  unitAmountGrosze: number;
  totalAmountGrosze: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  preschoolId: string;
  kidId: string;
  kidName: string;
  parentId: string;
  month: string; // "2025-02"
  lineItems: InvoiceLineItem[];
  totalAmountGrosze: number;
  status: InvoiceStatus;
  p24TransactionId: string | null;
  p24PaymentUrl: string | null;
  paidAt: Timestamp | null;
  dueDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
