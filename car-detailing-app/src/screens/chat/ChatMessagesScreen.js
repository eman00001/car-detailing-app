import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Image, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { formatDateTime } from '../../utils';
import styles from '../../stylesheet';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../../firebaseConfig';
import { onSnapshot, collection, doc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';

import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';

import * as ImagePicker from 'expo-image-picker';
import {
    CLOUDINARY_CHAT_MESSAGE_ATTACHMENT_UPLOAD_PRESET,
    uploadImages,
    addTransformationsToCloudinaryUri
} from '../../imageUploadUtils';

export default function ChatMessagesScreen({ route }) {
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currMessage, setCurrMessage] = useState('');
    const [currImages, setCurrImages] = useState([]);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendErrorMessage, setSendErrorMessage] = useState(null);
    const [userUid, setUserUid] = useState(null);

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
            orderBy('timestamp', 'desc'), // want to have most recent at bottom, since FlatList inverted means want first
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

    // function adds an image or multiple to the message that is currently being written
    const handleUploadImage = async () => {
        try {
            setIsUploadingImages(true); // being uploading state
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                allowsMultipleSelection: true,
            });
            if (!result.canceled) {
                setCurrImages(prevImages => [...prevImages, ...result.assets.map(image => image.uri)]);
            }
        } catch (e) {
            console.error(e);
            setSendErrorMessage('Failed to upload images');
        } finally {
            setIsUploadingImages(false); // finish uploading state
        }
    };

    // function removes the specified image from the current list of images to be sent in the message
    const removeCurrImage = (imageUri) => {
        setCurrImages(prevImages => prevImages.filter((uri) => uri !== imageUri));
    }

    // function sends the current message that is written in the message input box, storing it in the Firestore database
    const handleSendMessage = async () => {
        if (currMessage.trim().length === 0 && currImages.length === 0) { // do not allow send empty message
            setSendErrorMessage('Cannot send empty message');
            return;
        }

        try {
            setIsSending(true); // begin sending state
            setSendErrorMessage(null); // remove error message and try again

            const fileURLs = await uploadImages(currImages, CLOUDINARY_CHAT_MESSAGE_ATTACHMENT_UPLOAD_PRESET);

            const messageDocRef = doc(collection(db, 'chats', chatId, 'messages'));
            await setDoc(messageDocRef, {
                userId: userUid,
                content: currMessage,
                attachments: fileURLs,
                timestamp: serverTimestamp(),
            });
            setCurrMessage(''); // clear current message and attachments
            setCurrImages([]);  //
        } catch (e) {
            console.error(e);
            setSendErrorMessage('Could not send message');
        } finally {
            setIsSending(false); // finish sending state
        }
    };

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
                                {item.content && (
                                    <Text style={chatStyles.messageText}>
                                        {item.content}
                                    </Text>
                                )}
                                {item.attachments?.map(uri => (
                                    <Image
                                        key={uri}
                                        style={{
                                            ...chatStyles.messageAttachment,
                                            ...(item.isOwnMessage && chatStyles.ownMessageAttachment)
                                        }}
                                        // add width of 200 transformation to image so load faster
                                        width="200"
                                        source={{ uri: addTransformationsToCloudinaryUri(uri, 'w_200') }}
                                    />
                                ))}
                            </View>
                            <Text>{item.dateTimeString}</Text>
                        </View>
                    )}
                    keyExtractor={item => item.id}
                    inverted
                />
                <View
                    style={chatStyles.messageInputContainer}
                >
                    {sendErrorMessage != null && (
                        <Text style={styles.errorMessage}>{sendErrorMessage}</Text>
                    )}
                    {currImages.length > 0 && (
                        <FlatList
                            contentContainerStyle={chatStyles.messageInputAttachmentsRow}
                            data={currImages}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => removeCurrImage(item)}
                                >
                                    <Image
                                        style={chatStyles.messageInputAttachment}
                                        source={{ uri: item }}
                                    />
                                    <Text style={styles.closeIcon}>X</Text>
                                </Pressable>
                            )}
                            keyExtractor={item => item}
                            horizontal={true}
                        />
                    )}
                    <View
                        style={chatStyles.messageInputRow}
                    >
                        <Pressable
                            style={{ ...chatStyles.currMessageBtn, ...(isUploadingImages && chatStyles.currMessageBtnSending) }}
                            disabled={isUploadingImages || isSending}
                            onPress={handleUploadImage}
                        >
                            <Text style={chatStyles.currMessageBtnText}>Image</Text>
                        </Pressable>
                        <View style={chatStyles.messageInput}>
                            <TextInput
                                multiline
                                value={currMessage}
                                onChangeText={setCurrMessage}
                            />
                        </View>
                        <Pressable
                            style={{ ...chatStyles.currMessageBtn, ...(isSending && chatStyles.currMessageBtnSending) }}
                            disabled={isSending}
                            onPress={handleSendMessage}
                        >
                            <Text style={chatStyles.currMessageBtnText}>Send</Text>
                        </Pressable>
                    </View>
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
        gap: 12,
    },
    ownMessage: { // change color and direction of speech arrow if own message
        backgroundColor: '#DDF',
        borderEndStartRadius: 12,
        borderEndEndRadius: 0,
        alignItems: 'flex-end',
    },
    messageText: {

    },
    messageAttachment: {
        backgroundColor: '#FFF8',
        aspectRatio: 1,
        resizeMode: 'contain',
    },
    ownMessageAttachment: {
        alignSelf: 'flex-end', // if own message attachment, push to right of screen
    },
    messageInputContainer: {
        backgroundColor: '#EEE',
        borderTopColor: '#DDD',
        borderTopWidth: 2,
        padding: 12,
        gap: 6,
    },
    messageInputAttachmentsRow: {
        gap: 6,
    },
    messageInputAttachment: {
        width: 100,
        height: 100,
    },
    messageInputRow: {
        borderWidth: 1,
        borderRadius: 6,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'stretch',
        alignItems: 'center',
        gap: 12,
    },
    messageInput: {
        flex: 1,
    },
    currMessageBtn: {
        backgroundColor: '#888',
        padding: 6,
        borderRadius: 6,
    },
    currMessageBtnSending: {
        backgroundColor: '#555',
    },
    currMessageBtnText: {
        color: '#FFF',
        fontWeight: 700,
    }
});
