import { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../../firebaseConfig';
import { collection, doc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function ChatsListScreen() {
    const [chats, setChats] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        (async () => {
            try {
                const userUid = await AsyncStorage.getItem('userUid');
                if (userUid == null) return; // should never happen, but if user not signed in do not query for chats
                
                // find all chats where this user is involved
                const chatQuerySnapshot = await getDocs(
                    query(
                        collection(db, 'chats'),
                        where('userIds', 'array-contains', userUid)
                    )
                );
                const chats = await Promise.all(
                    chatQuerySnapshot.docs.map(async (chatDoc) => {
                        const data = chatDoc.data();
                        // get names of users from firestore using UIDs
                        const otherUserNames = Object.fromEntries(
                            await Promise.all(
                                data.userIds
                                    .filter(uid => uid !== userUid) // remove this user's ID from array
                                    .map(async (uid) => {
                                        try {
                                            const userDocSnapshot = await getDoc(doc(db, 'users', uid));
                                            if (userDocSnapshot.exists()) {
                                                const data = userDocSnapshot.data();
                                                return [uid, data.name]; // key is user id, value is user's name
                                            } else {
                                                return 'Unknown User'; // if user not found, default to placeholder name
                                            }
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    })
                            )
                        );
                        const chatName = Object.values(otherUserNames).join(','); // chat name is users' names separated by commas
                        return {
                            id: chatDoc.id,
                            otherUserNames,
                            chatName,
                        };
                    })
                );
                setChats(chats);
            
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    const handlePressChat = (chat) => {
        navigation.navigate('ChatMessages', chat);
    }

    return (
        <SafeAreaView>
            <FlatList
                data={chats}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => handlePressChat(item)}
                    >
                        <View>
                            <Text>{item.chatName}</Text>
                        </View>
                    </Pressable>
                )}
                keyExtractor={item => item.id}
            />
        </SafeAreaView>
    )
}