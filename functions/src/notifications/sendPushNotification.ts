import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

/**
 * sendPushNotification — triggered on new message, sends FCM push to recipient.
 */
export const onNewMessage = onDocumentCreated(
  {
    document:
      "preschools/{preschoolId}/conversations/{conversationId}/messages/{messageId}",
    region: "europe-west1",
  },
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const { preschoolId, conversationId } = event.params;
    const db = admin.firestore();

    // Get conversation to find recipient
    const convDoc = await db
      .collection("preschools")
      .doc(preschoolId)
      .collection("conversations")
      .doc(conversationId)
      .get();

    if (!convDoc.exists) return;
    const conv = convDoc.data()!;

    // Recipient is the other participant
    const recipientId = conv.participantIds.find(
      (id: string) => id !== message.senderId,
    );
    if (!recipientId) return;

    const recipientDoc = await db.collection("users").doc(recipientId).get();
    const recipient = recipientDoc.data();

    if (!recipient?.fcmTokens?.length) return;

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
  },
);

/**
 * onNewAnnouncement — triggered on new announcement, sends FCM to all preschool members.
 */
export const onNewAnnouncement = onDocumentCreated(
  {
    document: "preschools/{preschoolId}/announcements/{announcementId}",
    region: "europe-west1",
  },
  async (event) => {
    const announcement = event.data?.data();
    if (!announcement) return;

    const { preschoolId } = event.params;
    const db = admin.firestore();

    // Get all users in this preschool
    const usersSnap = await db
      .collection("users")
      .where("preschoolId", "==", preschoolId)
      .get();

    const tokens: string[] = [];
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      if (
        user.fcmTokens?.length &&
        user.id !== announcement.authorId // don't notify the author
      ) {
        tokens.push(...user.fcmTokens);
      }
    }

    if (!tokens.length) return;

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
  },
);
