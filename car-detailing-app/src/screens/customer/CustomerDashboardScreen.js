import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, Pressable } from 'react-native';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from 'react';

import styles from '../../stylesheet';

const auth = getAuth();
const fakeData = [
  { id: "1", service: "Full Interior Detail", date: "March 10, 2026", status: "pending" },
  { id: "2", service: "Exterior Wash & Wax", date: "March 18, 2026", status: "upcoming" },
  { id: "3", service: "Engine Bay Cleaning", date: "February 28, 2026", status: "completed" },
  { id: "4", service: "Ceramic Coating", date: "March 5, 2026", status: "issue" },
];

export default function CustomerDashboardScreen({ navigation }) {
    const [name, setName] = useState(null);
    const [isLoading, setLoading] = useState(true);

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setName(user.displayName);
        } else {
            setName(null);
        }
        setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (isLoading) {
        return (
        <SafeAreaView style={styles.container}>
            <Text>Loading...</Text>
        </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.h1}>
                Welcome, {name ? name : "fakeUser"}
            </Text>
            <Text style={styles.h2}>My Requests</Text>
            <View style={styles.container}>
                <FlatList
                    data={fakeData}
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
  pending: { color: "#915700" },    // orange
  upcoming: { color: "#000000" },   // blue
  completed: { color: "#0f9713" },  // green
  issue: { color: "#bd0d00" },
};