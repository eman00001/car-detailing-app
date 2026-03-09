import { useEffect } from 'react';
import { firebase_auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function LogOutScreen() {
    // sign out on load
    useEffect(() => {
        signOut(firebase_auth);
    }, []);
}