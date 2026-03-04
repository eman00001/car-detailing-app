import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { getAuth } from "firebase/auth";
import styles from '../../stylesheet';

const auth = getAuth();
const user = auth?.currentUser;

export default function CustomerDashboardScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.h1}>Welcome, {user?user.displayName:"fakeUser"}</Text>
        </SafeAreaView>
    );
}

