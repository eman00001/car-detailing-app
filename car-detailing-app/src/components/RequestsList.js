import { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';

import { db } from '../firebaseConfig';
import { query, collection, onSnapshot } from 'firebase/firestore';

import styles from '../stylesheet';
import LoadingScreen from '../screens/LoadingScreen';
import { formatDateTime, snippet } from '../utils';
import { statusColors } from '../constants';

// snip description to a max of 40 characters long
const DESCRIPTION_MAX_LENGTH = 40;

export default function RequestsList({
    userUid,
    requests,
    setRequests,
    requestsFilter,
    requestsOrder,
    onPressItem,
    showCustomerName = true
}) {
    
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

    const renderItem = ({ item }) => {
        const vehicleDetails = [];
        if (item.carMake) vehicleDetails.push(item.carMake);
        if (item.carModel) vehicleDetails.push(item.carModel);
        const vehicle = vehicleDetails.join(', ');

        const updatedAt = item.updatedAt?.toDate();
        const updatedAtTime = updatedAt && formatDateTime(updatedAt);

        return <Pressable
            style={styles.card}
            onPress={() => onPressItem?.(item)}
        >
            <View style={styles.left}>
                {showCustomerName && <Text style={styles.h3}>{item.customerName}</Text>}
                <Text style={styles.service}>{item.serviceType}</Text>
                <Text style={styles.description}>{snippet(item.description, DESCRIPTION_MAX_LENGTH)}</Text>
                {vehicle && <Text style={styles.vehicle}>{vehicle}</Text>}
                <Text style={styles.date}>{item.availabilityText}</Text>
                {updatedAtTime && <Text style={styles.updatedAtTime}>Last updated {updatedAtTime}</Text>}
            </View>

            <View style={styles.right}>
                <Text style={[styles.status, statusColors[item.status]]}>
                {item.status.toUpperCase()}
                </Text>
            </View>
        </Pressable>
    };

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
                ListEmptyComponent={<Text>No requests yet</Text>}
            />
        </View>
    );
}