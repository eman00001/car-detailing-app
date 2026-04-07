import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import ErrorScreen from "../ErrorScreen";
import styles from "../../stylesheet";
import RequestDetails from "../../components/RequestDetails";


export default function CustomerRequestDetailsScreen({ route }) {
    const { request } = route?.params ?? { };

    if (request == null) {
        return <ErrorScreen errorMessage="Unknown request" />; 
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.paddedContainer}
                contentContainerStyle={[styles.listContainer, styles.paddedScrollContainer]}
            >
                <RequestDetails request={request} />
            </ScrollView>
        </SafeAreaView>
    );
}