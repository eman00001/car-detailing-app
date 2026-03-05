import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../stylesheet";

export default function LoadingScreen() {
    return <SafeAreaView style={styles.containerCentered}>
        <ActivityIndicator size="large" />
    </SafeAreaView>
}