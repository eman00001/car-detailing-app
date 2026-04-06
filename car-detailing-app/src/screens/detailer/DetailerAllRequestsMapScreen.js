import { useEffect, useState } from 'react';


import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../firebaseConfig';
import { query, collection, where, onSnapshot } from 'firebase/firestore';

import DetailerMapOfCustomersScreen from './DetailerMapOfCustomersScreen';
import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';

export default function DetailerAllRequestsMapScreen() {
    const [userUid, setUserUid] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [requests, setRequests] = useState(null);

    // get user info from async storage
    useEffect(() => {
        (async () => {
            try {
                const uid = await AsyncStorage.getItem('userUid');
                setUserUid(uid);
                if (uid == null) {
                    setErrorMessage('You must be signed in to view this screen');
                }
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
        })();
    }, []);

    // get requests from database
    useEffect(() => {
        if (!userUid) return;

        const q = query(
            collection(db, 'requests'),
            where('status', 'not-in', ['draft', 'completed']) // don't show drafts as not public, nor completed as irrelevant
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setRequests(requests);
        });

        return unsubscribe;
    }, [userUid]);

    // show loading screen until finish loading requests from database
    if (requests == null) {
        return <LoadingScreen />;
    }

    // if error found, show message on screen
    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />;
    }
    
    return <DetailerMapOfCustomersScreen requestsList={requests} showStatus={true} />;
}