import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, Image } from "react-native";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { firebase_auth, db } from "../../firebaseConfig";
import styles from "../../stylesheet";

export default function DetailerJobsScreen() {
  const user = firebase_auth.currentUser;
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "requests"),
      where("acceptedByUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12, flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>My Jobs</Text>

        <FlatList
          data={jobs}
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
              <Text>Location: {item.locationText}</Text>
              <Text>Availability: {item.availabilityText ?? item.preferredTime}</Text>
              <Text style={{ fontWeight: "700" }}>Status: {item.status}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>No accepted jobs yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}
