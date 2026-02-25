import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { formatDateTime } from '../../utils';
import styles from '../../stylesheet';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../../firebaseConfig';
import { onSnapshot, collection, doc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';

import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';

export default function ChatMessagesScreen({ route }) {
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currMessage, setCurrMessage] = useState('');
    const [userUid, setUserUid] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [sendErrorMessage, setSendErrorMessage] = useState(null);
    const navigationHeaderHeight = useHeaderHeight();
    const chatId = route.params.id;

    // get user ID from async storage
    useEffect(() => {
        (async () => {
            try {
                const userUid = await AsyncStorage.getItem('userUid');
                setUserUid(userUid);
                if (userUid == null) { // user ID should not be null on this screen, so if is show error message
                    setErrorMessage('You must be signed in to view this screen');
                }
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
        })();
    }, []);

    // get chat messages, listening to realtime changes
    useEffect(() => {
        if (userUid == null) return; // wait until user ID found
        
        setLoading(true); // begin loading when querying for messages

        // query messages for chat specified by Chat ID passed on route params, order in order sent
        const messagesQuery = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'asc'),
        );
        // every time query contents change, update messages state
        const unsubscribe = onSnapshot(messagesQuery, async (messagesQuerySnapshot) => {
            const messages = messagesQuerySnapshot.docs.map(messageDoc => {
                const messageData = messageDoc.data();
                const isOwnMessage = messageData.userId === userUid;
                const dateTimeString = formatDateTime(messageData.timestamp.toDate());

                return {
                    id: messageDoc.id,
                    ...messageData,
                    isOwnMessage,
                    dateTimeString,
                }
            });
            setMessages(messages);
            setLoading(false); // finish loading when messages fetched
        })
        return unsubscribe;
    }, [userUid]);

    const handleSendMessage = async () => {
        if (currMessage.trim().length === 0) return; // do not allow send empty message
        try {
            setIsSending(true); // begin sending state
            setSendErrorMessage(null); // remove error message and try again
            const messageDocRef = doc(collection(db, 'chats', chatId, 'messages'));
            await setDoc(messageDocRef, {
                userId: userUid,
                content: currMessage,
                timestamp: serverTimestamp(),
            });
            setCurrMessage(''); // clear current message
        } catch (e) {
            console.error(e);
            setSendErrorMessage('Could not send message');
        } finally {
            setIsSending(false); // finish sending state
        }
    }

    // if loading, show loading icon
    if (loading) {
        return <LoadingScreen />;
    }

    // if error, show message on screen
    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />;
    }

    return (
        <SafeAreaView
            style={styles.container}
        >
            {/* ensure the message input and send button is visible above keyboard */}
            <KeyboardAvoidingView
                style={styles.container}
                behavior='padding'
                keyboardVerticalOffset={navigationHeaderHeight}
            >
                <FlatList
                    style={{ flex: 1 }}
                    data={messages}
                    renderItem={({ item }) => (
                        <View style={{
                            ...chatStyles.messageBoxContainer,
                            ...(item.isOwnMessage && chatStyles.ownMessageContainer)
                        }}>
                            <View style={{
                                ...chatStyles.messageBox,
                                ...(item.isOwnMessage && chatStyles.ownMessage)
                            }}>
                                <Text>{item.content}</Text>
                            </View>
                            <Text>{item.dateTimeString}</Text>
                        </View>
                    )}
                    keyExtractor={item => item.id}
                />
                <View
                    style={chatStyles.messageInputContainer}
                >
                    <View style={chatStyles.messageInput}>
                        {sendErrorMessage != null && (
                            <Text style={styles.errorMessage}>{sendErrorMessage}</Text>
                        )}
                        <TextInput
                            multiline
                            value={currMessage}
                            onChangeText={setCurrMessage}
                        />
                    </View>
                    <Pressable
                        style={{ ...chatStyles.messageSendBtn, ...(isSending && chatStyles.messageSendBtnSending) }}
                        disabled={isSending}
                        onPress={handleSendMessage}
                    >
                        <Text style={chatStyles.messageSendBtnText}>Send</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const chatStyles = StyleSheet.create({
    messageBoxContainer: {
        margin: 12,
        alignSelf: 'flex-start', // align to left (for English)
        alignItems: 'flex-start',
    },
    ownMessageContainer: { // align to right if own message
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    messageBox: {
        backgroundColor: '#DDD',
        maxWidth: '90%', // add subtle size cap to width so that there will be space, makes easier distinguish which side for long messages
        padding: 12,
        borderRadius: 12,
        borderEndStartRadius: 0, // make one corner sharp so looks like conventional speech box
    },
    ownMessage: { // change color and direction of speech arrow if own message
        backgroundColor: '#DDF',
        borderEndStartRadius: 12,
        borderEndEndRadius: 0,
    },
    messageInputContainer: {
        borderWidth: 1,
        borderRadius: 6,
        margin: 12,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'stretch',
        alignItems: 'center',
    },
    messageInput: {
        flex: 1,
    },
    messageSendBtn: {
        backgroundColor: '#888',
        padding: 6,
        borderRadius: 6,
    },
    messageSendBtnSending: {
        backgroundColor: '#555',
    },
    messageSendBtnText: {
        color: '#FFF',
        fontWeight: 700,
    }
});