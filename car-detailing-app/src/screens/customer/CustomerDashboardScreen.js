import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Pressable, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../firebaseConfig';
import { doc, collection, where, and, orderBy } from 'firebase/firestore';

import styles from '../../stylesheet';
import RequestsList from '../../components/RequestsList';

export default function CustomerDashboardScreen() {
    const navigation = useNavigation();
    const [userUid, setUserUid] = useState(null);
    const [name, setName] = useState(null);

    // get the user's UID and name from async storage
    useEffect(() => {
        (async () => {
            // get the user ID from async storage, showing an error if not found
            try {
                const userUid = await AsyncStorage.getItem('userUid');
                const name = await AsyncStorage.getItem('userName');
                setUserUid(userUid);
                setName(name);
                if (userUid == null) { // user ID should not be null on this screen, so if is show error
                    setErrorMessage('You must be signed in to view this screen');
                }
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
        })();
    }, []);

    // function handles beginning to create a new request
    const handleCreateRequest = () => {
        // create empty document in order to generate ID
        const requestDoc = doc(collection(db, 'requests'));
        const requestId = requestDoc.id;
        // pass generated ID to request form screen
        navigation.navigate('CreateRequest', { requestId });
    }

    return (
        <SafeAreaView style={styles.paddedContainer}>
            <Text style={styles.h2}>
                Welcome{name ? `, ${name}!` : '!'}
            </Text>
            <View style={[styles.row, styles.spaceBottom]}>
                <Text style={styles.h3}>My Requests</Text>
                <Pressable
                    style={[styles.buttonSmall, styles.buttonPlain]}
                    onPress={() => navigation.navigate('RequestDrafts')}
                >
                    <Text style={[styles.buttonText, styles.buttonTextSmall]}>See Drafts</Text>
                </Pressable>
            </View>
            <RequestsList
                userUid={userUid}
                requestsFilter={and(
                    where("customerUid", "==", userUid),
                    where("status", "!=", "draft"), // filter out drafts
                )}
                requestsOrder={orderBy("updatedAt", "desc")}
            />
            <Pressable
                style={[styles.button, styles.buttonPrimary, { marginTop: 18 }]}
                onPress={handleCreateRequest}
                >
                <Text style={styles.buttonText}>Create New Request</Text>
            </Pressable>
        </SafeAreaView>
    );
}