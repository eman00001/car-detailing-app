import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Image, Pressable } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import styles from '../../stylesheet';
import DetailerMap from '../../components/DetailerMap';
import { db } from '../../firebaseConfig';

export default function DetailerViewCustomerScreen({ route }) {
    const navigation = useNavigation();
    const { request = {}, source } = route.params || {};
    const [requestData, setRequestData] = useState(request);
    const [isSaving, setIsSaving] = useState(false);
    const isJobSource = source === 'jobs';
    const isDashboardSource = source === 'dashboard';

    const customerName = requestData.customerName || requestData.name || requestData.customer || 'Unknown Customer';
    const description = requestData.description || requestData.notes || requestData.details || 'No description provided.';
    const service = requestData.service || requestData.serviceType || 'Unknown service';
    const locationText = requestData.location?.address || requestData.address || requestData.location || 'No location provided.';
    const availableTimes = requestData.availableTimes || requestData.available_time || requestData.times || requestData.schedule || [];
    const vehicle = requestData.vehicle || requestData.vehicleModel || requestData.vehicleType || 'Unknown vehicle';
    const vehicleColor = requestData.vehicleColor || requestData.color || requestData.vehicle_color || 'Unknown color';
    const vehiclePhoto = requestData.vehiclePhoto || requestData.photoUrl || requestData.imageUrl || requestData.image || requestData.photo || null;

    const latitude = requestData.latitude ?? requestData.location?.latitude ?? requestData.coordinates?.latitude ?? requestData.location?.coords?.latitude;
    const longitude = requestData.longitude ?? requestData.location?.longitude ?? requestData.coordinates?.longitude ?? requestData.location?.coords?.longitude;
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

    const updateRequestStatus = async (status) => {
        if (!requestData.id) return;
        setIsSaving(true);
        try {
            const requestRef = doc(db, 'requests', requestData.id);
            const updatePayload = { status };
            if (status === 'pending') {
                updatePayload.acceptedByUid = null;
            }
            if (status === 'accepted') {
                const uid = await AsyncStorage.getItem('userUid');
                if (uid) {
                    updatePayload.acceptedByUid = uid;
                }
            }
            await updateDoc(requestRef, updatePayload);
            setRequestData({ ...requestData, ...updatePayload });
            if (isDashboardSource || isJobSource) {
                navigation.goBack();
            }
        } catch (error) {
            console.warn('Failed to update request status:', error);
        } finally {
            setIsSaving(false);
        }
    };

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

                {isDashboardSource && requestData.status === 'pending' ? (
                    <View style={styles.detailActionRow}>
                        <Pressable
                            style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
                            onPress={() => updateRequestStatus('accepted')}
                            disabled={isSaving}
                        >
                            <Text style={styles.buttonText}>Accept</Text>
                        </Pressable>
                    </View>
                ) : null}

                {isJobSource ? (
                    requestData.status === 'completed' ? (
                        <View style={styles.detailActionRow}>
                            <Pressable
                                style={[styles.button, styles.buttonPlain, { flex: 1 }]}
                                onPress={() => updateRequestStatus('accepted')}
                                disabled={isSaving}
                            >
                                <Text style={styles.buttonText}>Mark Uncomplete</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.detailActionRow}>
                            <Pressable
                                style={[styles.button, styles.buttonPrimary, { flex: 1, marginRight: 8 }]}
                                onPress={() => updateRequestStatus('completed')}
                                disabled={isSaving}
                            >
                                <Text style={styles.buttonText}>Mark Completed</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.button, styles.buttonPlain, { flex: 1 }]}
                                onPress={() => updateRequestStatus('pending')}
                                disabled={isSaving}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </Pressable>
                        </View>
                    )
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
