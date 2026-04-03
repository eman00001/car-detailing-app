import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { where, orderBy } from 'firebase/firestore';
import styles from '../../stylesheet';
import ErrorScreen from '../ErrorScreen';
import RequestsList from '../../components/RequestsList';

export default function DetailerJobsScreen() {
    const navigation = useNavigation();
    const [userUid, setUserUid] = useState(null);
    const [jobs, setJobs] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // get user info from async storage
    useEffect(() => {
        (async () => {
            try {
                const userUid = await AsyncStorage.getItem('userUid');
                setUserUid(userUid);
                if (userUid == null) {
                    setErrorMessage('You must be signed in to view this screen');
                }
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
        })();
    }, []);

    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />;
    }

    return (
        <SafeAreaView style={styles.paddedContainer}>
            <Text style={styles.h3}>Your Jobs {jobs && `(${jobs.length})`}</Text>
            <RequestsList
                userUid={userUid}
                requests={jobs}
                setRequests={setJobs}
                requestsFilter={where('acceptedByUid', '==', userUid)}
                requestsOrder={orderBy('acceptedAt', 'desc')}
                onPressItem={item => navigation.navigate('DetailerRequestDetails', { request: item })}
            />
            <Pressable
                style={[styles.button, styles.buttonPlain, { marginTop: 18 }]}
                onPress={() => navigation.navigate('DetailerJobsMap', { requests: jobs })}
            >
                <Text style={styles.buttonText}>View Jobs Map</Text>
            </Pressable>
        </SafeAreaView>
    );
}