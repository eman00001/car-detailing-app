import { SafeAreaView, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from '../../stylesheet';
import DetailerMap from '../../components/DetailerMap';

export default function DetailerMapOfCustomersScreen({ route }) {
    const navigation = useNavigation();
    const { markers = [], initialLocation, title = 'Map' } = route.params || {};

    const normalizedMarkers = (markers || []).map((marker) => {
        const request = marker.request ?? marker;
        return {
            id: marker.id,
            lat: marker.lat ?? marker.latitude ?? request?.location?.latitude,
            lng: marker.lng ?? marker.longitude ?? request?.location?.longitude,
            title: marker.title ?? marker.customerName ?? marker.name ?? marker.service ?? request?.service ?? request?.customerName ?? 'Location',
            description: marker.description ?? marker.notes ?? marker.details ?? request?.description ?? request?.notes ?? request?.details ?? request?.service ?? 'Tap for details',
            request,
        };
    });

    const handleMarkerCallout = (marker) => {
        if (marker.request) {
            navigation.navigate('DetailerRequestDetails', { request: marker.request });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.h1}>{title}</Text>
            <View style={{ flex: 1 }}>
                <DetailerMap
                    initialRegion={initialLocation}
                    markers={normalizedMarkers}
                    onCalloutPress={handleMarkerCallout}
                />
            </View>
        </SafeAreaView>
    );
}
