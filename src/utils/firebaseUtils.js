// Utility functions for Firebase operations
import { db } from "../firebaseConfig";
import { collection, doc } from "firebase/firestore";

/**
 * Get Firestore instance with proper async initialization
 * @returns {Promise<import('firebase/firestore').Firestore>} Firestore instance
 */
export const getFirestoreInstance = async () => {
  return await db.get();
};

/**
 * Get Firestore collection reference
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<import('firebase/firestore').CollectionReference>} Collection reference
 */
export const getCollection = async (collectionName) => {
  const firestore = await getFirestoreInstance();
  return collection(firestore, collectionName);
};

/**
 * Get Firestore document reference
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - ID of the document
 * @returns {Promise<import('firebase/firestore').DocumentReference>} Document reference
 */
export const getDocument = async (collectionName, documentId) => {
  const firestore = await getFirestoreInstance();
  return doc(firestore, collectionName, documentId);
};

export default {
  getFirestoreInstance,
  getCollection,
  getDocument
};