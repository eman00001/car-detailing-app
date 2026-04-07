import { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, limit, orderBy, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';

import styles from '../../stylesheet';
import { getOtherUserNames } from '../../firebaseUtils';
import { formatDateTime, snippet } from '../../utils';

const MESSAGE_PREVIEW_MAX_LENGTH = 20;

export default function ChatsListScreen() {
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [userUid, setUserUid] = useState(null);
    const [chats, setChats] = useState([]);
    const navigation = useNavigation();

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

    useEffect(() => {
        if (userUid == null) return; // do not continue if user ID not defined

        setLoading(true); // begin loading when querying for chats

        const chatQuery = query(
            collection(db, 'chats'),
            where('userIds', 'array-contains', userUid),
            orderBy('mostRecentTimestamp', 'desc')
        );
        const unsubscribe = onSnapshot(chatQuery, async (chatQuery) => {
            const chats = await Promise.all(
                chatQuery.docs.map(async (chatDoc) => {
                    const data = chatDoc.data();
                    // get names of users from firestore using UIDs
                    const otherUserNames = await getOtherUserNames(data.userIds, userUid);
                    const chatName = Object.values(otherUserNames).join(','); // chat name is users' names separated by commas
                    return {
                        id: chatDoc.id,
                        otherUserNames,
                        chatName,
                        mostRecentMessage: data.mostRecentMessage,
                        mostRecentTimestamp: data.mostRecentTimestamp,
                    };
                })
            );
            setChats(chats);
            setLoading(false);
        });
        return unsubscribe;
    }, [userUid]); // when user ID changes, rerun query

    const handlePressChat = (chat) => {
        navigation.navigate('ChatMessages', {
            id: chat.id,
            otherUserNames: chat.otherUserNames,
            chatName: chat.chatName,
        });
    };

    // if loading, show loading icon
    if (loading) {
        return <LoadingScreen />;
    }

    // if error found, show message on screen
    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={chats}
                renderItem={({ item, index }) => (<>
                    {index !== 0 && <View style={chatsListStyles.itemSeparator}></View>}
                    <Pressable
                        onPress={() => handlePressChat(item)}
                    >
                        <View style={chatsListStyles.listItem}>
                            <View style={chatsListStyles.itemIcon} />
                            <View style={{ flex: 1 }}>
                                <Text style={chatsListStyles.itemText}>{item.chatName}</Text>
                                {item.mostRecentMessage && (
                                    <View style={styles.row}>
                                        <Text style={chatsListStyles.itemMessage}>
                                            {snippet(item.mostRecentMessage, MESSAGE_PREVIEW_MAX_LENGTH)}
                                        </Text>
                                        <Text style={chatsListStyles.itemMessage}>
                                            {item.mostRecentTimestamp && formatDateTime(item.mostRecentTimestamp.toDate())}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Pressable>
                </>)}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.paddedContainer}>No chats yet</Text>
                }
                keyExtractor={item => item.id}
            />
        </SafeAreaView>
    )
}

const chatsListStyles = StyleSheet.create({
    listItem: {
        flexDirection: 'row',
        paddingInline: 12,
        gap: 12,
        alignItems: 'center',
    },
    itemIcon: {
        width: 50,
        height: 50,
        backgroundColor: '#777',
        borderRadius: 25,
    },
    itemText: {
        fontSize: 18,
        fontWeight: 700,
    },
    itemMessage: {
        color: '#777',
        fontSize: 14,
    },
    itemSeparator: {
        borderColor: '#DDD',
        borderTopWidth: 0.5,
        marginInline: 12,
        paddingTop: 12,
    },
});