import { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';
import { query, collection, onSnapshot } from 'firebase/firestore';

import styles from '../stylesheet';
import LoadingScreen from '../screens/LoadingScreen';

export default function RequestsList({ userUid, requestsFilter, requestsOrder, onPressItem }) {
    const [requests, setRequests] = useState([]);
    const [isLoading, setLoading] = useState(true);

    // get requests from database
    useEffect(() => {
        if (!userUid) return;

        const q = query(
            collection(db, "requests"),
            requestsFilter,
            requestsOrder,
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setRequests(requests);
            setLoading(false);
        });

        return unsubscribe;
    }, [userUid]);

    const renderItem = ({ item }) => (
        <Pressable
            style={styles.card}
            onPress={() => onPressItem?.(item)}
        >
            <View style={styles.left}>
                <Text style={styles.service}>{item.serviceType}</Text>
                <Text style={styles.vehicle}>Vehicle</Text>
                <Text style={styles.date}>{item.availabilityText}</Text>
            </View>

            <View style={styles.right}>
                <Text style={[styles.status, statusColors[item.status]]}>
                {item.status.toUpperCase()}
                </Text>
            </View>
        </Pressable>
    );

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const statusColors = {
  open: { color: "#770" },
  pending: { color: "#915700" },    // orange
  accepted: { color: "#088" },   // blue
  completed: { color: "#0f9713" },  // green
  issue: { color: "#bd0d00" },
};