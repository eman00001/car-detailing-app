import { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../../firebaseConfig';
import {doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';

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

    // true if the submit button has been pressed
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // request is already saved as draft, so just go to drafts scren
    const saveAsDraft = () => {
        // save as draft and go to drafts screen
        navigation.popTo('Home', { screen: 'CustomerDashboard', params: { screen: 'RequestDrafts' }});
    }

    // when submitting, change from status draft to open and return to dashboard
    const submit = async () => {
        setIsSubmitting(true); // begin submitting
        const requestDoc = doc(db, 'requests', request.id);
        try {
            await updateDoc(requestDoc, { status: 'open', createdAt: Timestamp.now() });
            navigation.navigate('SuccessTransition', {
                navigationScreen: 'Home',
                navigationParams: { screen: 'CustomerDashboard', params: { screen: 'AllRequests' } }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false); // end submitting
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

                <View style={styles.row}>

                    <Pressable
                        onPress={saveAsDraft}
                        disabled={isSubmitting}
                        style={[
                            styles.button,
                            styles.buttonStretch,
                            isSubmitting ? styles.buttonDisabled : styles.buttonPlain
                        ]}
                    >
                        <Text style={styles.buttonText}>Save as Draft</Text>
                    </Pressable>
                    <Pressable
                        onPress={submit}
                        disabled={isSubmitting}
                        style={[
                            styles.button,
                            styles.buttonStretch,
                            isSubmitting ? styles.buttonDisabled : styles.buttonPrimary
                        ]}
                    >
                        <Text style={styles.buttonText}>Submit</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}