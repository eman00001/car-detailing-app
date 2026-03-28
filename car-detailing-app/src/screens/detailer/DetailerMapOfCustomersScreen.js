import { SafeAreaView, View, Text } from 'react-native';
import styles from '../../stylesheet';
import DetailerMap from '../../components/DetailerMap';

export default function DetailerMapOfCustomersScreen({ route }) {
    const { markers = [], initialLocation, title = 'Map' } = route.params || {};

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.h1}>{title}</Text>
            <View style={{ flex: 1 }}>
                <DetailerMap initialRegion={initialLocation} markers={markers} />
            </View>
        </SafeAreaView>
    );
}
