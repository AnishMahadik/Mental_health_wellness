import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: any;
  updatedAt: any;
  currentMood?: string;
}

export interface Message {
  userId: string;
  role: 'user' | 'ai';
  text: string;
  createdAt: any;
}

export interface MoodEntry {
  userId: string;
  mood: string;
  note: string;
  createdAt: any;
}

const USERS_COLLECTION = 'users';
const MESSAGES_COLLECTION = 'messages';
const MOODS_COLLECTION = 'moods';

export async function createUserProfile(uid: string, email: string, displayName: string) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const profile: UserProfile = {
        uid,
        email,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, profile);
      return profile;
    }
    return userDoc.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${uid}`);
  }
}

export async function getUserProfile(uid: string) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${uid}`);
  }
}

export async function saveMessage(userId: string, role: 'user' | 'ai', text: string) {
  try {
    const messageData: Message = {
      userId,
      role,
      text,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, MESSAGES_COLLECTION), messageData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, MESSAGES_COLLECTION);
  }
}

export async function getChatHistory(userId: string, limitCount = 50) {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Message);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MESSAGES_COLLECTION);
  }
}

export async function saveMood(userId: string, mood: string, note: string = '') {
  try {
    const moodData: MoodEntry = {
      userId,
      mood,
      note,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, MOODS_COLLECTION), moodData);
    
    // Update current mood in user profile
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { 
      currentMood: mood,
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, MOODS_COLLECTION);
  }
}

export async function getMoodHistory(userId: string, limitCount = 30) {
  try {
    const q = query(
      collection(db, MOODS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as MoodEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MOODS_COLLECTION);
  }
}
