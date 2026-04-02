import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, Pressable, Alert, Image } from "react-native";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { firebase_auth, db } from "../../firebaseConfig";
import styles from "../../stylesheet";

export default function DetailerDashboardScreen() {
  const user = firebase_auth.currentUser;
  const [openRequests, setOpenRequests] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "requests"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setOpenRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const accept = async (id) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, "requests", id), {
        status: "accepted",
        acceptedByUid: user.uid,
        acceptedByName: user.displayName ?? "Detailer",
      });
      Alert.alert("Accepted", "This job is now in your jobs list.");
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Could not accept job.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12, flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Detailer Dashboard</Text>

        <FlatList
          data={openRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>{item.serviceType}</Text>
              <Text>Customer: {item.customerName}</Text>
              {item.photoUrl ? (
                <Image
                  source={{ uri: item.photoUrl }}
                  style={{ width: "100%", height: 180, borderRadius: 10, marginVertical: 10 }}
                  resizeMode="cover"
                />
              ) : null}
              <Text numberOfLines={2}>{item.description}</Text>
              <Text>Location: {item.locationText}</Text>
              <Text>Availability: {item.availabilityText ?? item.preferredTime}</Text>

              <Pressable
                onPress={() =>
                  Alert.alert("Accept job?", "Do you want to accept this request?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Accept", onPress: () => accept(item.id) },
                  ])
                }
                style={{ ...styles.button, ...styles.buttonPlain, marginTop: 8 }}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text>No open requests right now.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}
