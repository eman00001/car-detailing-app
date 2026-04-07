import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export function getFirebaseAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-exists':
            return 'This email has already registered for an account';
        
        case 'auth/invalid-email':
            return 'Invalid email';
        
        case 'auth/missing-password':
            return 'Please enter your password';

        case 'auth/invalid-password':
            return 'Invalid password';

        case 'auth/weak-password':
            return 'Please choose a stronger password';

        case 'auth/invalid-credential':
            return 'Invalid credentials';

        default:
            return 'Something went wrong';
    }
}

// function takes in an array of user IDs and gets the names of all users in the array that is not the current user
export const getOtherUserNames = async (userIds, userUid) => Object.fromEntries(
    await Promise.all(userIds
        .filter(uid => uid !== userUid) // remove this user's ID from array
        .map(async (uid) => {
            try {
                // query the database for the user info for each user ID
                const userDocSnapshot = await getDoc(doc(db, 'users', uid));
                if (userDocSnapshot.exists()) {
                    const data = userDocSnapshot.data();
                    return [uid, data.name]; // key is user id, value is user's name
                } else {
                    return [uid, 'Unknown User']; // if user not found, default to placeholder name
                }
            } catch (e) {
                console.error(e);
                return [uid, 'Unknown User']; // if error occurred, default to placeholder name
            }
        })
    )
);