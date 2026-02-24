import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../../stylesheet';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function ChatMessagesScreen({ route }) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const userUid = await AsyncStorage.getItem('userUid');
                if (userUid == null) return; // should never happen, but if user not signed in do not query for messages

                // get messages using chat ID from route params
                const messagesQuerySnapshot = await getDocs(query(
                    collection(db, 'chats', route.params.id, 'messages'),
                    orderBy('timestamp', 'desc'),
                ));
                const messages = messagesQuerySnapshot.docs.map(messageDoc => {
                    const messageData = messageDoc.data();
                    const isOwnMessage = messageData.userId === userUid;
                    const dateTimeString = messageData.timestamp.toDate().toLocaleString('en-us', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    return {
                        id: messageDoc.id,
                        ...messageData,
                        isOwnMessage,
                        dateTimeString,
                    }
                });
                setMessages(messages);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    console.log(messages[0]?.time);
    return (
        <SafeAreaView style={styles.container}>
            <FlatList
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
        </SafeAreaView>
    );
}

const chatStyles = StyleSheet.create({
    messageBoxContainer: {
        margin: 12,
        alignSelf: 'flex-start', /* align to left (for English) */
    },
    ownMessageContainer: { /* align to right if own message */
        alignSelf: 'flex-end',
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
    }
});