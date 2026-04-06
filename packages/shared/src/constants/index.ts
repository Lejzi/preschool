export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  TEACHER: "teacher",
  PARENT: "parent",
} as const;

export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export const MEAL_TYPES = [
  "breakfast",
  "second_breakfast",
  "lunch",
  "dessert",
  "snack",
] as const;

export const MEAL_TYPE_LABELS: Record<string, { pl: string; en: string }> = {
  breakfast: { pl: "Śniadanie", en: "Breakfast" },
  second_breakfast: { pl: "Drugie śniadanie", en: "Second Breakfast" },
  lunch: { pl: "Obiad", en: "Lunch" },
  dessert: { pl: "Deser", en: "Dessert" },
  snack: { pl: "Podwieczorek", en: "Snack" },
};

export const ATTENDANCE_STATUSES = {
  PRESENT: "present",
  ABSENT: "absent",
  EXCUSED: "excused",
  LATE: "late",
} as const;

export const BILLING_ITEM_TYPES = {
  ATTENDANCE_PER_DAY: "attendance_per_day",
  FIXED_MONTHLY: "fixed_monthly",
  CUSTOM_ONE_TIME: "custom_one_time",
} as const;

export const INVOICE_STATUSES = {
  DRAFT: "draft",
  SENT: "sent",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const;

// Firestore collection paths
export const COLLECTIONS = {
  USERS: "users",
  PRESCHOOLS: "preschools",
  GROUPS: (preschoolId: string) => `preschools/${preschoolId}/groups`,
  KIDS: (preschoolId: string) => `preschools/${preschoolId}/kids`,
  ATTENDANCE: (preschoolId: string) => `preschools/${preschoolId}/attendance`,
  MENU: (preschoolId: string) => `preschools/${preschoolId}/menu`,
  RECIPES: (preschoolId: string) => `preschools/${preschoolId}/recipes`,
  ACTIVITIES: (preschoolId: string) => `preschools/${preschoolId}/activities`,
  ANNOUNCEMENTS: (preschoolId: string) =>
    `preschools/${preschoolId}/announcements`,
  CONVERSATIONS: (preschoolId: string) =>
    `preschools/${preschoolId}/conversations`,
  MESSAGES: (preschoolId: string, conversationId: string) =>
    `preschools/${preschoolId}/conversations/${conversationId}/messages`,
  BILLING_ITEMS: (preschoolId: string) =>
    `preschools/${preschoolId}/billingItems`,
  INVOICES: (preschoolId: string) => `preschools/${preschoolId}/invoices`,
} as const;
