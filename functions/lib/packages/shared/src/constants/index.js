"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTIONS = exports.INVOICE_STATUSES = exports.BILLING_ITEM_TYPES = exports.ATTENDANCE_STATUSES = exports.MEAL_TYPE_LABELS = exports.MEAL_TYPES = exports.WEEK_DAYS = exports.USER_ROLES = void 0;
exports.USER_ROLES = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    TEACHER: "teacher",
    PARENT: "parent",
};
exports.WEEK_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
];
exports.MEAL_TYPES = [
    "breakfast",
    "second_breakfast",
    "lunch",
    "dessert",
    "snack",
];
exports.MEAL_TYPE_LABELS = {
    breakfast: { pl: "Śniadanie", en: "Breakfast" },
    second_breakfast: { pl: "Drugie śniadanie", en: "Second Breakfast" },
    lunch: { pl: "Obiad", en: "Lunch" },
    dessert: { pl: "Deser", en: "Dessert" },
    snack: { pl: "Podwieczorek", en: "Snack" },
};
exports.ATTENDANCE_STATUSES = {
    PRESENT: "present",
    ABSENT: "absent",
    EXCUSED: "excused",
    LATE: "late",
};
exports.BILLING_ITEM_TYPES = {
    ATTENDANCE_PER_DAY: "attendance_per_day",
    FIXED_MONTHLY: "fixed_monthly",
    CUSTOM_ONE_TIME: "custom_one_time",
};
exports.INVOICE_STATUSES = {
    DRAFT: "draft",
    SENT: "sent",
    PAID: "paid",
    OVERDUE: "overdue",
    CANCELLED: "cancelled",
};
// Firestore collection paths
exports.COLLECTIONS = {
    USERS: "users",
    PRESCHOOLS: "preschools",
    GROUPS: (preschoolId) => `preschools/${preschoolId}/groups`,
    KIDS: (preschoolId) => `preschools/${preschoolId}/kids`,
    ATTENDANCE: (preschoolId) => `preschools/${preschoolId}/attendance`,
    MENU: (preschoolId) => `preschools/${preschoolId}/menu`,
    RECIPES: (preschoolId) => `preschools/${preschoolId}/recipes`,
    ACTIVITIES: (preschoolId) => `preschools/${preschoolId}/activities`,
    ANNOUNCEMENTS: (preschoolId) => `preschools/${preschoolId}/announcements`,
    CONVERSATIONS: (preschoolId) => `preschools/${preschoolId}/conversations`,
    MESSAGES: (preschoolId, conversationId) => `preschools/${preschoolId}/conversations/${conversationId}/messages`,
    BILLING_ITEMS: (preschoolId) => `preschools/${preschoolId}/billingItems`,
    INVOICES: (preschoolId) => `preschools/${preschoolId}/invoices`,
};
//# sourceMappingURL=index.js.map