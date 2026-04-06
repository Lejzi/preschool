"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNewAnnouncement = exports.onNewMessage = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
/**
 * sendPushNotification — triggered on new message, sends FCM push to recipient.
 */
exports.onNewMessage = (0, firestore_1.onDocumentCreated)({
    document: "preschools/{preschoolId}/conversations/{conversationId}/messages/{messageId}",
    region: "europe-west1",
}, async (event) => {
    const message = event.data?.data();
    if (!message)
        return;
    const { preschoolId, conversationId } = event.params;
    const db = admin.firestore();
    // Get conversation to find recipient
    const convDoc = await db
        .collection("preschools")
        .doc(preschoolId)
        .collection("conversations")
        .doc(conversationId)
        .get();
    if (!convDoc.exists)
        return;
    const conv = convDoc.data();
    // Recipient is the other participant
    const recipientId = conv.participantIds.find((id) => id !== message.senderId);
    if (!recipientId)
        return;
    const recipientDoc = await db.collection("users").doc(recipientId).get();
    const recipient = recipientDoc.data();
    if (!recipient?.fcmTokens?.length)
        return;
    await admin.messaging().sendEachForMulticast({
        tokens: recipient.fcmTokens,
        notification: {
            title: message.senderName,
            body: message.text.substring(0, 100),
        },
        data: {
            type: "new_message",
            conversationId,
            preschoolId,
        },
    });
});
/**
 * onNewAnnouncement — triggered on new announcement, sends FCM to all preschool members.
 */
exports.onNewAnnouncement = (0, firestore_1.onDocumentCreated)({
    document: "preschools/{preschoolId}/announcements/{announcementId}",
    region: "europe-west1",
}, async (event) => {
    const announcement = event.data?.data();
    if (!announcement)
        return;
    const { preschoolId } = event.params;
    const db = admin.firestore();
    // Get all users in this preschool
    const usersSnap = await db
        .collection("users")
        .where("preschoolId", "==", preschoolId)
        .get();
    const tokens = [];
    for (const userDoc of usersSnap.docs) {
        const user = userDoc.data();
        if (user.fcmTokens?.length &&
            user.id !== announcement.authorId // don't notify the author
        ) {
            tokens.push(...user.fcmTokens);
        }
    }
    if (!tokens.length)
        return;
    // FCM has a 500 token limit per request — batch if needed
    const batchSize = 500;
    for (let i = 0; i < tokens.length; i += batchSize) {
        await admin.messaging().sendEachForMulticast({
            tokens: tokens.slice(i, i + batchSize),
            notification: {
                title: announcement.title,
                body: announcement.body.substring(0, 100),
            },
            data: {
                type: "new_announcement",
                announcementId: event.params.announcementId,
                preschoolId,
            },
        });
    }
});
//# sourceMappingURL=sendPushNotification.js.map