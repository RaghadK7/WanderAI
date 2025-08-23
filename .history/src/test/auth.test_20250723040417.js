// tests/auth.test.js
import { auth } from '../src/firebase-config';

describe('User Authentication', () => {
  let testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'test123';

  it('should sign up a new user', async () => {
    const userCredential = await auth.createUserWithEmailAndPassword(testEmail, testPassword);
    expect(userCredential.user.email).toBe(testEmail);
  });

  it('should sign in an existing user', async () => {
    const userCredential = await auth.signInWithEmailAndPassword(testEmail, testPassword);
    expect(userCredential.user.email).toBe(testEmail);
  });

  it('should sign out the user', async () => {
    await auth.signOut();
    expect(auth.currentUser).toBeNull();
  });
});