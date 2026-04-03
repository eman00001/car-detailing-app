import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { where, orderBy } from 'firebase/firestore';
import * as Location from "expo-location";

import styles from '../../stylesheet';
import ErrorScreen from '../ErrorScreen';
import RequestsList from '../../components/RequestsList';

export default function DetailerDashboardScreen() {
    const [userUid, setUserUid] = useState(null);
    const [name, setName] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [requests, setRequests] = useState(null);
    const navigation = useNavigation();

    // get user info from async storage
    useEffect(() => {
        (async () => {
            try {
                const uid = await AsyncStorage.getItem('userUid');
                const name = await AsyncStorage.getItem("userName");
                setUserUid(uid);
                setName(name);
                if (uid == null) {
                    setErrorMessage('You must be signed in to view this screen');
                }
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
        })();
    }, []);

    // if error found, show message on screen
    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />;
    }
    
    return (
        <SafeAreaView style={styles.paddedContainer}>
            <Text style={styles.h2}>
                Welcome, {name ? name : "Unknown User"}
            </Text>
            <Text style={styles.h3}>Open Requests {requests && `(${requests.length})`}</Text>
            <RequestsList
                userUid={userUid}
                requests={requests}
                setRequests={setRequests}
                requestsFilter={where('status', '==', 'open')}
                requestsOrder={orderBy('updatedAt', 'desc')}
                onPressItem={item => navigation.navigate('DetailerRequestDetails', { request: item, source: 'dashboard' })}
            />
            <Pressable
                style={[styles.button, styles.buttonPlain, { marginTop: 18 }]}
                onPress={() => navigation.navigate('DetailerDashboardMap', { requests })}
            >
                <Text style={styles.buttonText}>View on Map</Text>
            </Pressable>
        </SafeAreaView>
    );
}