import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../../stylesheet';

import { db } from '../../firebaseConfig';
import { query, doc, collection, where, orderBy, onSnapshot } from 'firebase/firestore';

export default function CustomerDashboardScreen() {
    const [userUid, setUserUid] = useState(null);
    const [name, setName] = useState(null);
    const [requests, setRequests] = useState([]);
    const [isLoading, setLoading] = useState(true);
    const navigation = useNavigation();

     const renderItem = ({ item }) => (
    <View style={styles.card}>
        <View style={styles.left}>
            <Text style={styles.service}>{item.serviceType}</Text>
            <Text style={styles.vehicle}>Vehicle</Text>
            <Text style={styles.date}>{item.preferredTime}</Text>
        </View>

        <View style={styles.right}>
            <Text style={[styles.status, statusColors[item.status]]}>
            {item.status.toUpperCase()}
            </Text>
        </View>
        </View>
    );

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

    // get requests from database
    useEffect(() => {
        if (!userUid) return;

        const q = query(
            collection(db, "requests"),
            where("customerUid", "==", userUid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setRequests(requests);
            setLoading(false);
        });

        return unsubscribe;
    }, [userUid]);

    // function handles beginning to create a new request
    const handleCreateRequest = () => {
        // create empty document in order to generate ID
        const requestDoc = doc(collection(db, 'requests'));
        const requestId = requestDoc.id;
        // pass generated ID to request form screen
        navigation.navigate('CreateRequest', { requestId });
    }

    if (isLoading) {
        return (
        <SafeAreaView style={styles.container}>
            <Text>Loading...</Text>
        </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.paddedContainer}>
            <Text style={styles.h1}>
                Welcome, {name ? name : "fakeUser"}
            </Text>
            <Text style={styles.h2}>My Requests</Text>
            <View style={styles.container}>
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            </View>
            <Pressable
                style={[styles.button, isLoading ? styles.buttonDisabled : styles.buttonPrimary, { marginTop: 18 }]}
                onPress={handleCreateRequest}
                >
                <Text style={styles.buttonText}>Create New Request</Text>
            </Pressable>
        </SafeAreaView>
    );
}

const statusColors = {
  open: { color: "#770" },
  pending: { color: "#915700" },    // orange
  accepted: { color: "#088" },   // blue
  completed: { color: "#0f9713" },  // green
  issue: { color: "#bd0d00" },
};