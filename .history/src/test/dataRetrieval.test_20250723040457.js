// tests/dataRetrieval.test.js
import { db, auth } from '../src/firebase-config';

describe('Data Retrieval', () => {
  beforeAll(async () => {
    await auth.signInWithEmailAndPassword('test@example.com', 'test123');
  });

  it('should retrieve user trips', async () => {
    const snapshot = await db.collection('trips')
      .where('userId', '==', auth.currentUser.uid)
      .get();
    
    expect(snapshot.size).toBeGreaterThan(0);
    snapshot.forEach(doc => {
      expect(doc.data()).toHaveProperty('destination');
      expect(doc.data()).toHaveProperty('startDate');
    });
  });

  it('should get a single trip', async () => {
    const trips = await db.collection('trips').limit(1).get();
    const tripId = trips.docs[0].id;
    const doc = await db.collection('trips').doc(tripId).get();
    
    expect(doc.exists).toBe(true);
    expect(doc.data()).toHaveProperty('destination');
  });
});