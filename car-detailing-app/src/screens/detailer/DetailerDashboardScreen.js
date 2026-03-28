import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Platform, View, Text, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import * as Location from "expo-location";

import styles from '../../stylesheet';
import { db } from '../../firebaseConfig';
import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';



export default function DetailerDashboardScreen() {
    const [name, setName] = useState(null);
    const [userUid, setUserUid] = useState(null);
    const [jobs, setJobs] = useState(null);
    const [requests, setRequests] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [location, setLocation] = useState(null);
    const navigation = useNavigation();

    const markers = [
        { id: 1, lat: 44.6488, lng: -63.5752, title: "Job 1" },
        { id: 2, lat: 44.6510, lng: -63.5800, title: "Job 2" },
        { id: 3, lat: 44.6460, lng: -63.5700, title: "Job 3" }
    ];

    const renderItem = ({ item }) => (
    <View style={styles.card}>
        <View style={styles.left}>
            <Text style={styles.service}>{item.service}</Text>
            <Text style={styles.vehicle}>{item.vehicle}</Text>
            <Text style={styles.date}>{item.date}</Text>
        </View>

        <View style={styles.right}>
            { item.status == 'pending' ?  <Pressable style={styles.button}><Text>Accept</Text></Pressable>: null}
            { item.status == 'upcoming' ?  <Text style={[styles.status, statusColors[item.status]]}>{item.status.toUpperCase()}</Text>: null}
        </View>
    </View>
    );

    const getUserJobs = async (userId) => {
        const q = query(
            collection(db, "requests"),
            where("detailerId", "==", userId)
        );

        const snapshot = await getDocs(q);

        const jobs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return jobs;
    };

    const getAllRequests = async (userId) => {
        const q = query(
            collection(db, "requests"),
            or(
                where("status", "==", "pending"),
                where("detailerId", "==", userId)
            )
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
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                console.log("Permission denied");
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation.coords);

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
                    const data = await getAllRequests(uid);
                    setRequests(data);
                })();
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
            setLoading(false);
        })();
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
                style={{ ...styles.button, ...styles.buttonPlain }}
                onPress={() => navigation.navigate('DetailerDashboardMap', {
                    title: 'Dashboard Map',
                    markers,
                    initialLocation: location,
                })}
            >
                <Text style={styles.buttonText}>View on Map</Text>
            </Pressable>
        </SafeAreaView>
    );
}

const statusColors = {
  pending: { color: "#915700" },    // orange
  upcoming: { color: "#000000" },   // blue
  completed: { color: "#0f9713" },  // green
  issue: { color: "#bd0d00" },
};