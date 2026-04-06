// Firestore Timestamp compatibility shim
// Works with both Firebase Web SDK and Admin SDK
export type Timestamp = {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
};
