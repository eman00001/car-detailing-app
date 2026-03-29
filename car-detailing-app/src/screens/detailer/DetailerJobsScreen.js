import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, View, Text, Pressable } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import styles from '../../stylesheet';
import { db } from '../../firebaseConfig';
import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';

export default function DetailerJobsScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState("");
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);

    const normalizeText = (value) => {
        if (value == null) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (value?.toDate) return value.toDate().toLocaleString();
        if (value instanceof Date) return value.toLocaleString();
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    };

    const renderItem = ({ item }) => (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('DetailerRequestDetails', { request: item, source: 'jobs' })}
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

    const loadJobs = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);
        setJobs([]);

        try {
            const storedName = await AsyncStorage.getItem('userName');
            if (storedName) setName(storedName);

            const uid = await AsyncStorage.getItem('userUid');
            if (!uid) {
                setErrorMessage('You must be signed in to view this screen');
                setJobs([]);
                return;
            }

            const q = query(collection(db, 'requests'), where('acceptedByUid', '==', uid));
            const snapshot = await getDocs(q);
            setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.warn('DetailerJobsScreen load failed:', error);
            setJobs([]);
            setErrorMessage('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadJobs();
            return () => setJobs([]);
        }, [loadJobs])
    );

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />;
    }

    const markers = jobs?.map((job, index) => ({
        id: job.id,
        title: job.service ?? `Job ${index + 1}`,
        description: job.description ?? job.notes ?? job.details ?? '',
        lat: job.latitude ?? job.coordinates?.latitude ?? 44.6488 + index * 0.001,
        lng: job.longitude ?? job.coordinates?.longitude ?? -63.5752 - index * 0.001,
        request: job,
    }));

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.h1}>Your Jobs</Text>
            <View style={styles.container}>
                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
            <Pressable
                style={{ ...styles.button, ...styles.buttonPlain }}
                onPress={() => navigation.navigate('DetailerJobsMap', {
                    title: 'Jobs Map',
                    markers,
                })}
            >
                <Text style={styles.buttonText}>View Jobs Map</Text>
            </Pressable>
        </SafeAreaView>
    );
}

const statusColors = {
  pending: { color: "#915700" },    // orange
  accepted: { color: "#00b909" },   // blue
  completed: { color: "#008ac0" },  // green
  issue: { color: "#bd0d00" },
};