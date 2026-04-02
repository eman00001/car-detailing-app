import { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../../firebaseConfig';
import {doc, onSnapshot, updateDoc } from 'firebase/firestore';

import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';

import styles from '../../stylesheet';
import { formatterCAD } from '../../utils';
import CustomerRequestStepIndicator from './CustomerRequestStepIndicator';

export default function CustomerRequestConfirmScreen({ route }) {
    const navigation = useNavigation();

    // remaing in loading state until finish fetching from database
    const [loading, setLoading] = useState(true);

    // holds the request draft so far
    const [request, setRequest] = useState(null);

    // handles getting the request from the database
    useEffect(() => {
        if (route.params?.requestId == null) { // if request not passed in navigation, cannot continue
            setLoading(false); // stop loading so that error message shows up
            return;
        }
        const { requestId } = route.params;
        const requestDoc = doc(db, 'requests', requestId);
        // listen for changes
        const unsubscribe = onSnapshot(requestDoc, async (requestDocSnapshot) => {
            // store request in state, or null if doesn't exist
            if (requestDocSnapshot.exists()) {
                const request = { ...requestDocSnapshot.data(), id: requestDocSnapshot.id };
                setRequest(request);
            } else {
                setRequest(null);
            }
            setLoading(false); // finish loading
        });
        return unsubscribe;
    }, []);

    // when submitting, change from status draft to open and return to dashboard
    const submit = async () => {
        const requestDoc = doc(db, 'requests', request.id);
        try {
            await updateDoc(requestDoc, { status: 'open' });
            navigation.navigate('SuccessTransition');
        } catch (e) {
            console.error(e);
        }
    }

    // renders a line in the request summary, with a label and the specified data
    const renderRequestData = (label, data, isInline = true) => (
        <View style={isInline && { flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={styles.h5}>{label}</Text>
            <Text style={{ flexShrink: 1 }}>{data ?? 'Not specified'}</Text>
        </View>
    );

    // if loading, show a loading icon
    if (loading) {
        return <LoadingScreen />
    }

    // if finished loading but request could not be found, show error message
    if (request == null) {
        return <ErrorScreen errorMessage="Unknown request" /> 
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.paddedContainer}
                contentContainerStyle={[styles.listContainer, styles.paddedScrollContainer]}
            >
                <CustomerRequestStepIndicator currentStep={4} />
                <Text style={styles.h3}>Please Confirm your Request:</Text>
                {renderRequestData('Service Type', request.serviceType)}
                {renderRequestData('Description', request.description)}
                {renderRequestData('Location', request.locationText)}
                {renderRequestData('Preferred Time', request.preferredTime)}
                {renderRequestData('Car Make', request.carMake)}
                {renderRequestData('Car Model', request.carModel)}
                {renderRequestData('Car Trim', request.carTrim)}
                {renderRequestData('Car Exterior Color', request.carExteriorColor)}
                {renderRequestData('Car Interior Color', request.carInteriorColor)}
                {renderRequestData('Estimated Cost', formatterCAD.format(request.estimatedCost))}

                <Pressable onPress={submit} style={{ ...styles.button, ...styles.buttonPlain }}>
                    <Text style={styles.buttonText}>Submit</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}