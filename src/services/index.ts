import type { Repo } from './repo';
import { isFirebaseConfigured } from '../lib/firebase';
import { MockRepo } from './mockRepo';
import { FirestoreRepo } from './firestoreRepo';

/**
 * The single data backend used by the whole app.
 * - With Firebase env vars set (.env) → live Firestore (FirestoreRepo).
 * - Without them → local mock, persisted to localStorage (offline demo).
 */
export const repo: Repo = isFirebaseConfigured ? new FirestoreRepo() : new MockRepo();

// Convenience re-exports so pages import from one place.
export type { Repo };
export type { SeedDatabase } from './seed';

