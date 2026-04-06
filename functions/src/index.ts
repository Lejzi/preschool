import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v2";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all function groups
export * from "./auth/setUserRole";
export * from "./auth/inviteUser";
export * from "./auth/manageStaffMember";
export * from "./kids/linkParentToKid";
export * from "./preschools/createPreschool";
export * from "./billing/generateInvoice";
// TODO: enable once Przelewy24 account is set up
// export * from "./billing/initiatePayment";
// export * from "./billing/p24Webhook";
export * from "./notifications/sendPushNotification";
