import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { firebase_auth, db } from "../../firebaseConfig";
import styles from "../../stylesheet";

export default function CustomerCreateRequestScreen({ navigation }) {
  const user = firebase_auth.currentUser;

  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const submit = async () => {
    if (!user) return;

    if (!serviceType.trim() || !description.trim() || !locationText.trim() || !preferredTime.trim()) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }

    try {
      await addDoc(collection(db, "requests"), {
        customerUid: user.uid,
        customerName: user.displayName ?? "Customer",
        serviceType: serviceType.trim(),
        description: description.trim(),
        locationText: locationText.trim(),
        preferredTime: preferredTime.trim(),
        status: "open",
        acceptedByUid: null,
        acceptedByName: null,
        createdAt: Timestamp.now(),
      });

      Alert.alert("Posted", "Your request is now visible to detailers.");
      navigation.navigate("Customer Dashboard");
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Could not submit request.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>New Request</Text>

        <Text style={styles.inputLabel}>Service Type</Text>
        <TextInput
          value={serviceType}
          onChangeText={setServiceType}
          placeholder="Interior / Exterior / Full Detail..."
          style={styles.textInput}
        />

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
      </View>
    </SafeAreaView>
  );
}