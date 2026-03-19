import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../stylesheet";

export default function ErrorScreen({ errorMessage }) {
    return <SafeAreaView style={styles.container}>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
    </SafeAreaView>
}