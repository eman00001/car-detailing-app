import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { formatDateTime } from '../../utils';
import styles from '../../stylesheet';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../../firebaseConfig';
import { onSnapshot, collection, doc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';

export default function ChatMessagesScreen({ route }) {
    const [messages, setMessages] = useState([]);
    const [currMessage, setCurrMessage] = useState('');
    const [userUid, setUserUid] = useState(null);
    const navigationHeaderHeight = useHeaderHeight();
    const chatId = route.params.id;

    // get user ID from async storage
    useEffect(() => {
        (async () => {
            try {
                const userUid = await AsyncStorage.getItem('userUid');
                setUserUid(userUid);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    // get chat messages, listening to realtime changes
    useEffect(() => {
        if (userUid == null) return; // wait until user ID found
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
        })
        return unsubscribe;
    }, [userUid]);

    const handleSendMessage = async () => {
        if (currMessage.trim().length === 0) return; // do not allow send empty message
        try {
            const messageDocRef = doc(collection(db, 'chats', chatId, 'messages'));
            await setDoc(messageDocRef, {
                userId: userUid,
                content: currMessage,
                timestamp: serverTimestamp(),
            });
            setCurrMessage(''); // clear current message
        } catch (e) {
            console.error(e);
        }
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
                    <TextInput
                        style={chatStyles.messageInput}
                        value={currMessage}
                        onChangeText={setCurrMessage}
                    />
                    <Pressable
                        onPress={handleSendMessage}
                    >
                        <Text>Send</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const chatStyles = StyleSheet.create({
    messageBoxContainer: {
        margin: 12,
        alignSelf: 'flex-start', /* align to left (for English) */
        alignItems: 'flex-start',
    },
    ownMessageContainer: { /* align to right if own message */
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    messageBox: {
        backgroundColor: '#DDD',
        padding: 12,
        borderRadius: 12,
        borderEndStartRadius: 0, /* make one corner sharp so looks like conventional speech box */
    },
    ownMessage: { /* change color and direction of speech arrow if own message */
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
    },
    messageInput: {
        flex: 1,
    },
});