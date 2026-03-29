import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, View, Text, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import styles from '../../stylesheet';
import { db } from '../../firebaseConfig';
import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';

export default function DetailerJobsScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState(null);
    const [jobs, setJobs] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);

    const renderItem = ({ item }) => (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('DetailerRequestDetails', { request: item })}
        >
            <View style={styles.left}>
                <Text style={styles.service}>{item.service}</Text>
                <Text style={styles.vehicle}>{item.vehicle}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>
            <View style={styles.right}>
                {item.status === 'pending' ? <Text style={styles.status}>{item.status.toUpperCase()}</Text> : null}
            </View>
        </Pressable>
    );

    useEffect(() => {
        (async () => {
            try {
                const storedName = await AsyncStorage.getItem('userName');
                if (storedName) setName(storedName);

                const uid = await AsyncStorage.getItem('userUid');
                if (!uid) {
                    setErrorMessage('You must be signed in to view this screen');
                    setIsLoading(false);
                    return;
                }

                const q = query(collection(db, 'requests'), where('detailerId', '==', uid));
                const snapshot = await getDocs(q);
                setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.warn(error);
                setErrorMessage('Something went wrong');
            }
            setIsLoading(false);
        })();
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />;
    }

    const markers = jobs?.map((job, index) => ({
        id: job.id,
        title: job.service ?? `Job ${index + 1}`,
        lat: job.latitude ?? job.coordinates?.latitude ?? 44.6488 + index * 0.001,
        lng: job.longitude ?? job.coordinates?.longitude ?? -63.5752 - index * 0.001,
    })) ?? [];

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
