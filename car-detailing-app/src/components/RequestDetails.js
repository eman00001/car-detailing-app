import { ScrollView, View, Text, Image, StyleSheet } from 'react-native';
import styles from '../stylesheet';
import DetailerMap from './DetailerMap';
import ErrorScreen from '../screens/ErrorScreen';

export default function RequestDetails({ request, actionButtons }) {
    if (request == null) {
        return <ErrorScreen errorMessage="Unknown request" />
    }

    const customerName = request.customerName || 'Unknown Customer';
    const description = request.description || 'No description provided';
    const service = request.serviceType || 'Unknown service';
    const locationText = request.locationText || 'No location provided';
    const availabilityText = request.availabilityText || 'No availability provided';
    const vehiclePhoto = request.photoUrl;

    const latitude = request.locationCoords?.latitude;
    const longitude = request.locationCoords?.longitude;
    const markers = (latitude != null && longitude != null) ? [
        {
            id: 'request-location',
            lat: latitude,
            lng: longitude,
            title: customerName,
        },
    ] : [];

    const vehicleDetails = [];
    if (request.carMake) vehicleDetails.push(request.carMake);
    if (request.carModel) vehicleDetails.push(request.carModel);
    if (request.carTrim) vehicleDetails.push(request.carTrim);
    const vehicle = vehicleDetails.join(', ') || 'No vehicle details provided';

    const vehicleExteriorColor = request.carExteriorColorRgb && {
        color: `rgb(${request.carExteriorColorRgb})`,
        name: request.carExteriorColor || '',
    };
    const vehicleInteriorColor = request.carInteriorColorRgb && {
        color: `rgb(${request.carInteriorColorRgb})`,
        name: request.carInteriorColor || '',
    };

    return (
        <ScrollView
            style={styles.paddedContainer}
            contentContainerStyle={[styles.listContainer, styles.paddedScrollContainer]}
        >
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
                <Text style={styles.detailText}>{availabilityText}</Text>
            </View>

            <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailText}>{vehicle}</Text>
            </View>

            <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Vehicle Color</Text>
                {(!vehicleExteriorColor & !vehicleInteriorColor) ? (
                    <Text style={styles.detailText}>No color details provided</Text>
                ) : (<>
                    {vehicleExteriorColor && (<>
                        <Text style={styles.h5}>Exterior</Text>
                        <View style={styles.rowStart}>
                            <View style={[requestDetailsStyles.vehicleColorSwatch, { backgroundColor: vehicleExteriorColor.color }]}></View>
                            <Text style={[styles.detailText, { flexShrink: 1 }]}>{vehicleExteriorColor.name}</Text>
                        </View>
                    </>)}
                    {vehicleInteriorColor && (<>
                        <Text style={styles.h5}>Interior</Text>
                        <View style={styles.rowStart}>
                            <View style={[requestDetailsStyles.vehicleColorSwatch, { backgroundColor: vehicleInteriorColor.color }]}></View>
                            <Text style={[styles.detailText, { flexShrink: 1 }]}>{vehicleInteriorColor.name}</Text>
                        </View>
                    </>)}
                </>)}
            </View>

            {vehiclePhoto ? (
                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Vehicle Photo</Text>
                    <Image source={{ uri: vehiclePhoto }} style={styles.detailImage} resizeMode="cover" />
                </View>
            ) : null}

            {actionButtons}
        </ScrollView>
    );
}

const requestDetailsStyles = StyleSheet.create({
    vehicleColorSwatch: {
        width: 30,
        height: 30,
        borderWidth: 2,
        borderColor: '#777',
    },
})