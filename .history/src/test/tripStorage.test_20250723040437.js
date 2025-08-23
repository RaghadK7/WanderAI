// tests/tripStorage.test.js
import { db, auth } from '../src/firebase-config';

describe('Trip Data Storage', () => {
  let tripId;
  const testTrip = {
    destination: 'Dubai',
    startDate: '2023-01-01',
    endDate: '2023-01-07',
    notes: 'Business trip'
  };

  beforeAll(async () => {
    // تسجيل دخول مستخدم اختباري
    await auth.signInWithEmailAndPassword('test@example.com', 'test123');
  });

  it('should store a new trip', async () => {
    const docRef = await db.collection('trips').add({
      ...testTrip,
      userId: auth.currentUser.uid,
      createdAt: new Date()
    });
    tripId = docRef.id;
    expect(docRef.id).toBeDefined();
  });

  it('should update an existing trip', async () => {
    await db.collection('trips').doc(tripId).update({
      notes: 'Updated notes'
    });
    const doc = await db.collection('trips').doc(tripId).get();
    expect(doc.data().notes).toBe('Updated notes');
  });
});