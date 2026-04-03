import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { useState, useEffect } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { where, and, orderBy } from 'firebase/firestore';

import styles from '../../stylesheet';
import RequestsList from '../../components/RequestsList';
import { useNavigation } from '@react-navigation/native';

export default function CustomerRequestDraftsScreen() {
    const navigation = useNavigation();

    const [userUid, setUserUid] = useState(null);
    const [requests, setRequests] = useState(null);

    // get the user's UID and name from async storage
    useEffect(() => {
        (async () => {
            // get the user ID from async storage, showing an error if not found
            try {
                const userUid = await AsyncStorage.getItem('userUid');
                setUserUid(userUid);
                if (userUid == null) { // user ID should not be null on this screen, so if is show error
                    setErrorMessage('You must be signed in to view this screen');
                }
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
        })();
    }, []);

    // when press draft, go to create flow to update values
    const onPressDraft = (draft) => {
        navigation.navigate('CreateRequest', { requestId: draft.id });
    }

    return (
        <SafeAreaView style={styles.paddedContainer}>
            <Text style={styles.h2}>My Request Drafts {requests && `(${requests.length})`}</Text>
            <RequestsList
                userUid={userUid}
                requests={requests}
                setRequests={setRequests}
                requestsFilter={and(
                    where("customerUid", "==", userUid),
                    where("status", "==", "draft"), // filter out drafts
                )}
                requestsOrder={orderBy("updatedAt", "desc")}
                onPressItem={onPressDraft}
                showCustomerName={false}
            />
        </SafeAreaView>
    );
}