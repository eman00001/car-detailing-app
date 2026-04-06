import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import styles from '../../stylesheet';
import DetailerMap from '../../components/DetailerMap';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingScreen from '../LoadingScreen';
import { snippet } from '../../utils';

// snip description to a max of 40 characters long
const DESCRIPTION_MAX_LENGTH = 40;

export default function DetailerMapOfCustomersScreen({ route, requestsList, showStatus = false }) {
    const navigation = useNavigation();
    const requests = requestsList || route?.params?.requests || [];

    const [location, setLocation] = useState(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                console.log("Permission denied");
            } else {
                const currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation.coords);
            }
        })();
    }, []);

    // if the requests still have not loaded on the parent, show loading screen
    if (requests == null) {
        return <LoadingScreen />;
    }

    const markers = requests
        .map((request) => {
            // filter out requests without location details
            if (request.locationCoords == null) return null;

            return {
                id: request.id,
                lat: request.locationCoords.latitude,
                lng: request.locationCoords.longitude,
                title: `${request.customerName || 'Unknown User'} - ${request.serviceType}`,
                description: snippet(request.description, DESCRIPTION_MAX_LENGTH) || 'Tap for details',
                status: request.status,
                request,
            };
        })
        .filter(marker => marker != null);

    const handleMarkerCallout = (marker) => {
        navigation.navigate('DetailerRequestDetails', { request: marker.request });
    };

    return (
        <SafeAreaView style={styles.container}>
            <DetailerMap
                initialRegion={location}
                markers={markers}
                onCalloutPress={handleMarkerCallout}
                showStatus={showStatus}
            />
        </SafeAreaView>
    );
}
