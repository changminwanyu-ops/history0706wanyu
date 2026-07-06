import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export interface LeaderboardEntry {
  id?: string;
  name: string;
  timeInSeconds: number;
  attempts: number;
  showYearsUsed: boolean;
  createdAt?: Date;
}

// Collection reference
const leaderboardCol = collection(db, 'leaderboard');

/**
 * Saves a score to the leaderboard
 */
export async function saveScore(entry: Omit<LeaderboardEntry, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(leaderboardCol, {
      ...entry,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding score to Firestore:', error);
    throw error;
  }
}

/**
 * Fetches top scores from the leaderboard
 */
export async function getTopScores(maxResults: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const q = query(leaderboardCol, orderBy('timeInSeconds', 'asc'), limit(maxResults));
    const querySnapshot = await getDocs(q);
    const scores: LeaderboardEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let createdAtDate = new Date();
      if (data.createdAt instanceof Timestamp) {
        createdAtDate = data.createdAt.toDate();
      } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
        createdAtDate = new Date(data.createdAt.seconds * 1000);
      }
      
      scores.push({
        id: doc.id,
        name: data.name || '無名學家',
        timeInSeconds: Number(data.timeInSeconds) || 9999,
        attempts: Number(data.attempts) || 1,
        showYearsUsed: !!data.showYearsUsed,
        createdAt: createdAtDate
      });
    });

    // Sort by time first, then by attempts on client-side to avoid composite indexing requirements
    scores.sort((a, b) => {
      if (a.timeInSeconds !== b.timeInSeconds) {
        return a.timeInSeconds - b.timeInSeconds;
      }
      return a.attempts - b.attempts;
    });
    
    return scores;
  } catch (error) {
    console.error('Error fetching scores from Firestore:', error);
    throw error; // Rethrow so the UI can catch it and display a helpful message
  }
}
