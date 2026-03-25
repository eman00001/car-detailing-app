import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from '@react-navigation/elements';
import { addDoc, collection, Timestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { firebase_auth, db } from "../../firebaseConfig";
import LoadingScreen from "../LoadingScreen";
import styles from "../../stylesheet";

export default function CustomerCreateRequestScreen() {
    const navigation = useNavigation();
    const user = firebase_auth.currentUser;

    const navigationHeaderHeight = useHeaderHeight();

    // holds the detailing types stored in the database
    const [detailingTypes, setDetailingTypes] = useState(null);
    // stores whether the dropdown for the detailing types is currently open
    const [isDetailingTypesDropdownOpen, setIsDetailingTypesDropdownOpen] = useState(false); // dropdown closed on default

    const [serviceType, setServiceType] = useState("");
    const [description, setDescription] = useState("");
    const [locationText, setLocationText] = useState("");
    const [preferredTime, setPreferredTime] = useState("");

    // fetch the detailings types from the database
    useEffect(() => {
        const detailingTypesQuery = query(
            collection(db, 'detailingTypes'),
            orderBy('order', 'asc')
        );
        const unsubscribe = onSnapshot(detailingTypesQuery, (detailingTypesSnapshot) => {
            const detailingTypes = detailingTypesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setDetailingTypes(detailingTypes);
        });
        return unsubscribe;
    }, []);

    const submit = async () => {
        if (!user) return;

        if (!serviceType.trim() || !description.trim() || !locationText.trim() || !preferredTime.trim()) {
            Alert.alert("Missing info", "Please fill in all fields.");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "requests"), {
                customerUid: user.uid,
                customerName: user.displayName ?? "Customer",
                serviceType: serviceType.trim(),
                description: description.trim(),
                locationText: locationText.trim(),
                preferredTime: preferredTime.trim(),
                status: "draft",
                acceptedByUid: null,
                acceptedByName: null,
                createdAt: Timestamp.now(),
            });

            navigation.navigate('CarDetailsForm', { requestId: docRef.id }); // go to next step, passing ID of request

        } catch (e) {
            console.warn(e);
            Alert.alert("Error", "Could not submit request.");
        }
    };

    // render the detailing type dropdown
    const renderDetailingTypeDropdownPicker = () => {
        return (
            <View>
                <Text>
                    {detailingTypes?.find(type => type.name === serviceType)?.description}
                </Text>
                <DropDownPicker
                    schema={{ label: 'name', value: 'name' }}
                    listMode="SCROLLVIEW"
                    open={isDetailingTypesDropdownOpen}
                    items={detailingTypes}
                    value={serviceType}
                    placeholder="None selected"
                    setOpen={setIsDetailingTypesDropdownOpen}
                    setValue={setServiceType}
                />
            </View>
        );
    };

    if (detailingTypes == null) {
        return <LoadingScreen />
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior='padding'
                keyboardVerticalOffset={navigationHeaderHeight}
            >
                <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
                    <Text style={{ fontSize: 22, fontWeight: "700" }}>New Request</Text>

                    <Text style={styles.inputLabel}>Service Type</Text>
                    {renderDetailingTypeDropdownPicker()}

                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe what you want done..."
                        multiline
                        style={[styles.textInput, { minHeight: 90, textAlignVertical: "top" }]}
                    />

                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput
                        value={locationText}
                        onChangeText={setLocationText}
                        placeholder="Address or area"
                        style={styles.textInput}
                    />

                    <Text style={styles.inputLabel}>Preferred Time</Text>
                    <TextInput
                        value={preferredTime}
                        onChangeText={setPreferredTime}
                        placeholder="Weekend afternoon, etc."
                        style={styles.textInput}
                    />

                    <Pressable onPress={submit} style={{ ...styles.button, ...styles.buttonPlain }}>
                        <Text style={styles.buttonText}>Submit</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}