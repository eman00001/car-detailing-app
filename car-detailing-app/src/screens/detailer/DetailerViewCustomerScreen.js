import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Image, Pressable } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import styles from '../../stylesheet';
import DetailerMap from '../../components/DetailerMap';
import { db } from '../../firebaseConfig';
import RequestDetails from '../../components/RequestDetails';

export default function DetailerViewCustomerScreen({ route }) {
    const navigation = useNavigation();
    const { request = {}, source } = route.params || {};
    const [requestData, setRequestData] = useState(request);
    const [isSaving, setIsSaving] = useState(false);
    const isJobSource = source === 'jobs';
    const isDashboardSource = source === 'dashboard';

    const updateRequestStatus = async (status) => {
        if (!requestData.id) return;
        setIsSaving(true);
        try {
            const requestRef = doc(db, 'requests', requestData.id);
            const updatePayload = { status };
            if (status === 'open') {
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
            <RequestDetails
                request={request}
                actionButtons={<>
                    {isDashboardSource && requestData.status === 'open' && (
                        <Pressable
                            style={[styles.button, styles.buttonPrimary]}
                            onPress={() => updateRequestStatus('accepted')}
                            disabled={isSaving}
                        >
                            <Text style={styles.buttonText}>Accept</Text>
                        </Pressable>
                    )}

                    {isJobSource && (
                        requestData.status === 'completed' ? (
                            <Pressable
                                style={[styles.button, styles.buttonPlain]}
                                onPress={() => updateRequestStatus('accepted')}
                                disabled={isSaving}
                            >
                                <Text style={styles.buttonText}>Mark Uncomplete</Text>
                            </Pressable>
                        ) : (
                            <View style={styles.row}>
                                <Pressable
                                    style={[styles.button, styles.buttonStretch, styles.buttonPlain]}
                                    onPress={() => updateRequestStatus('open')}
                                    disabled={isSaving}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.button, styles.buttonStretch, styles.buttonPrimary]}
                                    onPress={() => updateRequestStatus('completed')}
                                    disabled={isSaving}
                                >
                                    <Text style={styles.buttonText}>Complete</Text>
                                </Pressable>
                            </View>
                        )
                    )}
                </>}
            />
        </SafeAreaView>
    );
}
