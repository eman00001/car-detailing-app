import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, doc, collection, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import styles from '../../stylesheet';
import { db } from '../../firebaseConfig';
import RequestDetails from '../../components/RequestDetails';
import { getOtherUserNames } from '../../firebaseUtils';

export default function DetailerViewCustomerScreen({ route }) {
    const navigation = useNavigation();
    const request = route?.params?.request || {};
    const [requestData, setRequestData] = useState(request);
    const [isSaving, setIsSaving] = useState(false);

    // function opens a chat with the request customer, creating a new one if it doesn't exist yet
    const openChat = async () => {
        setIsSaving(true);
        try {
            const userUid = await AsyncStorage.getItem('userUid');
            const chatsCollection = collection(db, 'chats');
            const chatsQuery = query(
                chatsCollection,
                where('userIds', 'array-contains', userUid)
            );
            const chatsRef = await getDocs(chatsQuery);

            // if already exists, navigate to chat
            for (const chatDoc of chatsRef.docs) {
                const data = chatDoc.data();
                if (data.userIds.includes(requestData.customerUid)) {
                    // get names of users from firestore using UIDs
                    const otherUserNames = await getOtherUserNames(data.userIds, userUid);
                    const chatName = Object.values(otherUserNames).join(','); // chat name is users' names separated by commas
                    navigation.navigate('DetailerChats', { screen: 'ChatMessages', params: {
                        id: chatDoc.id,
                        otherUserNames,
                        chatName
                    } });
                    return;
                }
            }

            // if doesn't exist yet, create new chat
            const newChatRef = await addDoc(chatsCollection, {
                userIds: [userUid, requestData.customerUid] // chat between detailer and customer
            });
            navigation.navigate('DetailerChats', { screen: 'ChatMessages', params: {
                id: newChatRef.id,
                otherUserNames: requestData.customerName,
                chatName: requestData.customerName,
            } });
        } catch (error) {
            console.warn('Failed to open chat:', error);
        } finally {
            setIsSaving(false);
        }
    }

    // function accepts a customer request, and navigates to a chat between the customer
    const acceptRequest = async () => {
        if (!requestData.id) return;
        setIsSaving(true);
        try {
            const userUid = await AsyncStorage.getItem('userUid');
            const requestRef = doc(db, 'requests', requestData.id);
            const updatePayload = {
                status: 'accepted',
                acceptedByUid: userUid,
                acceptedAt: Timestamp.now(),
            }
            await updateDoc(requestRef, updatePayload);
            setRequestData({ ...requestData, ...updatePayload });

            await openChat();
        } catch (error) {
            console.warn('Failed to accept request:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // function changes the status of a request, when complex logic is not needed
    const updateRequestStatus = async (status) => {
        if (!requestData.id) return;
        setIsSaving(true);
        try {
            const requestRef = doc(db, 'requests', requestData.id);
            // update the status of the request
            const updatePayload = { status };
            // if cancelled, remove detailer from request
            if (status === 'open') {
                updatePayload.acceptedByUid = null;
            }
            // update the database and reference
            await updateDoc(requestRef, updatePayload);
            setRequestData({ ...requestData, ...updatePayload });
            // go back to previous page
            navigation.goBack();
        } catch (error) {
            console.warn('Failed to update request status:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.paddedContainer}
                contentContainerStyle={[styles.listContainer, styles.paddedScrollContainer]}
            >
                <RequestDetails request={request} />
                {requestData.status === 'open' ? (<>
                    <Pressable
                        style={[styles.button, isSaving ? styles.buttonDisabled : styles.buttonPlain]}
                        onPress={openChat}
                        disabled={isSaving}
                    >
                        <Text style={styles.buttonText}>Open Chat</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.button, isSaving ? styles.buttonDisabled : styles.buttonPrimary]}
                        onPress={acceptRequest}
                        disabled={isSaving}
                    >
                        <Text style={styles.buttonText}>Accept</Text>
                    </Pressable>
                </>) : requestData.status === 'accepted' ? (
                    <View style={styles.row}>
                        <Pressable
                            style={[styles.button, styles.buttonStretch, isSaving ? styles.buttonDisabled : styles.buttonPlain]}
                            onPress={() => updateRequestStatus('open')}
                            disabled={isSaving}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.buttonStretch, isSaving ? styles.buttonDisabled : styles.buttonPrimary]}
                            onPress={() => updateRequestStatus('completed')}
                            disabled={isSaving}
                        >
                            <Text style={styles.buttonText}>Complete</Text>
                        </Pressable>
                    </View>
                ) : requestData.status === 'completed' ? (
                    <Pressable
                        style={[styles.button, isSaving ? styles.buttonDisabled : styles.buttonPlain]}
                        onPress={() => updateRequestStatus('accepted')}
                        disabled={isSaving}
                    >
                        <Text style={styles.buttonText}>Mark Uncomplete</Text>
                    </Pressable>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
