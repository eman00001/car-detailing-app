import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from 'react';

import styles from '../../stylesheet';

const auth = getAuth();

export default function CustomerDashboardScreen() {
    const [name, setName] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
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
        </SafeAreaView>
    );
}

