import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Platform, View, Text, Pressable } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import * as Location from "expo-location";

import styles from '../../stylesheet';
import { db } from '../../firebaseConfig';
import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';



export default function DetailerDashboardScreen() {
    const [name, setName] = useState(null);
    const [userUid, setUserUid] = useState(null);
    const [jobs, setJobs] = useState(null);
    const [requests, setRequests] = useState([]);
    const [isLoading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [location, setLocation] = useState(null);
    const navigation = useNavigation();
  
    const normalizeText = (value) => {
        if (value == null) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (value?.toDate) return value.toDate().toLocaleString();
        if (value instanceof Date) return value.toLocaleString();
        try {
            return JSON.stringify(value);
        } catch (e) {
            return String(value);
        }
    };

    const markers = requests?.map((request, index) => ({
        id: request.id ?? index,
        lat: request.latitude ?? request.location?.latitude ?? 44.6488 + index * 0.001,
        lng: request.longitude ?? request.location?.longitude ?? -63.5752 - index * 0.001,
        title: normalizeText(`${request.customerName ?? request.name ?? 'Request'} ${request.serviceType ?? request.service ?? ''}`.trim()),
        description: normalizeText(request.description ?? request.notes ?? request.details ?? ''),
        request,
    }));

    const renderItem = ({ item }) => (
    <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('DetailerRequestDetails', { request: item, source: 'dashboard' })}
    >
        <View style={styles.left}>
            <Text style={styles.service}>{normalizeText(item.serviceType)}</Text>
            <Text style={styles.vehicle}>{normalizeText(item.description)}</Text>
            <Text style={styles.date}>{normalizeText(item.updatedAt)}</Text>
        </View>

        <View style={styles.right}>
            <Text style={[styles.status, statusColors[item.status]]}>{item.status.toUpperCase()}</Text>
        </View>
    </Pressable>
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

    const getAllRequests = async () => {
        const q = query(
            collection(db, "requests"),
            where("status", "==", "open")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    };

    const loadRequests = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const data = await getAllRequests();
            setRequests(data);
        } catch (e) {
            console.error(e);
            setErrorMessage('Something went wrong');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                console.log("Permission denied");
            } else {
                const currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation.coords);
            }

            try {
                const name = await AsyncStorage.getItem("userName");
                if (name) setName(name);

                const uid = await AsyncStorage.getItem('userUid');
                setUserUid(uid);
                if (uid == null) {
                    setErrorMessage('You must be signed in to view this screen');
                }
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }

            await loadRequests();
        })();
    }, [loadRequests]);

    useFocusEffect(
        useCallback(() => {
            loadRequests();
        }, [loadRequests])
    );

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
                    keyExtractor={(item, index) => String(item.id ?? index)}
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
  open: { color: "#915700" },    // orange
  accepted: { color: "#000000" },   // blue
  completed: { color: "#0f9713" },  // green
  issue: { color: "#bd0d00" },
};