import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Image } from 'react-native';
import styles from '../../stylesheet';
import DetailerMap from '../../components/DetailerMap';

export default function DetailerViewCustomerScreen({ route }) {
    const { request = {} } = route.params || {};

    const customerName = request.customerName || request.name || request.customer || 'Unknown Customer';
    const description = request.description || request.notes || request.details || 'No description provided.';
    const service = request.service || request.serviceType || 'Unknown service';
    const locationText = request.location?.address || request.address || request.location || 'No location provided.';
    const availableTimes = request.availableTimes || request.available_time || request.times || request.schedule || [];
    const vehicle = request.vehicle || request.vehicleModel || request.vehicleType || 'Unknown vehicle';
    const vehicleColor = request.vehicleColor || request.color || request.vehicle_color || 'Unknown color';
    const vehiclePhoto = request.vehiclePhoto || request.photoUrl || request.imageUrl || request.image || request.photo || null;

    const latitude = request.latitude ?? request.location?.latitude ?? request.coordinates?.latitude ?? request.location?.coords?.latitude;
    const longitude = request.longitude ?? request.location?.longitude ?? request.coordinates?.longitude ?? request.location?.coords?.longitude;
    const markers = latitude != null && longitude != null ? [
        {
            id: 'request-location',
            lat: latitude,
            lng: longitude,
            title: customerName,
        },
    ] : [];

    const formattedTimes = Array.isArray(availableTimes)
        ? availableTimes.join(', ')
        : availableTimes || 'Not specified';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.detailScroll}>
                <Text style={styles.h1}>Request Details</Text>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Customer</Text>
                    <Text style={styles.detailText}>{customerName}</Text>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Service</Text>
                    <Text style={styles.detailText}>{service}</Text>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailText}>{description}</Text>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailText}>{locationText}</Text>
                </View>

                {markers.length > 0 ? (
                    <View style={styles.detailMapContainer}>
                        <DetailerMap initialRegion={{ latitude, longitude }} markers={markers} />
                    </View>
                ) : (
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Map</Text>
                        <Text style={styles.detailText}>Location coordinates are not available.</Text>
                    </View>
                )}

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Available Times</Text>
                    <Text style={styles.detailText}>{formattedTimes}</Text>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Vehicle</Text>
                    <Text style={styles.detailText}>{vehicle}</Text>
                </View>

                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Vehicle Color</Text>
                    <Text style={styles.detailText}>{vehicleColor}</Text>
                </View>

                {vehiclePhoto ? (
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Vehicle Photo</Text>
                        <Image source={{ uri: vehiclePhoto }} style={styles.detailImage} resizeMode="cover" />
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
