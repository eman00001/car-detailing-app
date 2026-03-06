import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, query, where, onSnapshot, getDoc, getDocs } from 'firebase/firestore';

import styles from '../../stylesheet';
import { db } from '../../firebaseConfig';
import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';

export default function CustomerDashboardScreen() {
    const [name, setName] = useState(null);
    const [userUid, setUserUid] = useState(null);
    const [requests, setRequests] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const navigation = useNavigation();

    const renderItem = ({ item }) => (
    <View style={styles.card}>
        <View style={styles.left}>
            <Text style={styles.service}>{item.service}</Text>
            <Text style={styles.vehicle}>{item.vehicle}</Text>
            <Text style={styles.date}>{item.date}</Text>
        </View>

        <View style={styles.right}>
            <Text style={[styles.status, statusColors[item.status]]}>
            {item.status.toUpperCase()}
            </Text>
        </View>
    </View>
    );

    const getUserRequests = async (userId) => {
        const q = query(
            collection(db, "requests"),
            where("userId", "==", userId)
        );

        const snapshot = await getDocs(q);

        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return requests;
    };

    useEffect(() => {
        (async () => {
            // get the user ID from async storage, showing an error if not found
            try {
                const name = await AsyncStorage.getItem("userName");
                if (name) setName(name);

                const uid = await AsyncStorage.getItem('userUid');
                setUserUid(uid);
                if (uid == null) { // user ID should not be null on this screen, so if is show error
                    setErrorMessage('You must be signed in to view this screen');
                }

                (async () => {
                    const data = await getUserRequests(uid);
                    setRequests(data);
                })();
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
        })();
        setLoading(false);
    }, []);

    // if loading, show loading icon
    if (isLoading) {
        return <LoadingScreen />;
    }

    // if error found, show message on screen
    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.h1}>
                Welcome, {name ? name : "Unknown User"}
            </Text>
            <Text style={styles.h2}>My Requests</Text>
            <View style={styles.container}>
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
            <Pressable
                style={{...styles.button, ...(isLoading ? styles.buttonDisabled : styles.buttonPlain)}}
                onPress={() => navigation.navigate("CustomerCreateRequestScreen")}
                >
                <Text style={styles.buttonText}>Create New Request</Text>
            </Pressable>
        </SafeAreaView>
    );
}

const statusColors = {
  pending: { color: "#915700" },
  upcoming: { color: "#000000" },
  completed: { color: "#0f9713" },
  issue: { color: "#bd0d00" },
};