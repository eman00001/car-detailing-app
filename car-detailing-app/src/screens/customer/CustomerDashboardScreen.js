import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Pressable, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { firebase_auth, db } from "../../firebaseConfig";
import styles from "../../stylesheet";

export default function CustomerDashboardScreen({ navigation }) {
  const user = firebase_auth.currentUser;
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "requests"),
      where("customerUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12, flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Customer Dashboard</Text>

        <Pressable
          onPress={() => navigation.navigate("Create Request")}
          style={{ ...styles.button, ...styles.buttonPlain }}
        >
          <Text style={styles.buttonText}>Create New Request</Text>
        </Pressable>

        <Text style={{ fontSize: 18, fontWeight: "700" }}>My Requests</Text>

        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>{item.serviceType}</Text>
              <Text numberOfLines={2}>{item.description}</Text>
              <Text>Location: {item.locationText}</Text>
              <Text>Time: {item.preferredTime}</Text>
              <Text style={{ fontWeight: "700" }}>Status: {item.status}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>No requests yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}