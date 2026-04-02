import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, Pressable, Alert, FlatList, ActivityIndicator, ScrollView, Image } from "react-native";
import { useEffect, useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import * as Location from "expo-location";
import { firebase_auth, db } from "../../firebaseConfig";
import LocationPreviewMap from "../../components/LocationPreviewMap";
import { uploadImageToCloudinary } from "../../imageUploadUtils";
import styles from "../../stylesheet";

function buildLocationLabel(parts) {
  if (!parts) return "";

  const segments = [
    parts.name,
    parts.street,
    parts.city || parts.district || parts.subregion,
    parts.region,
    parts.postalCode,
    parts.country,
  ].filter(Boolean);

  return [...new Set(segments)].join(", ");
}

async function reverseGeocodeCoords(latitude, longitude) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(
      latitude
    )}&lon=${encodeURIComponent(longitude)}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.display_name || "";
}

export default function CustomerCreateRequestScreen({ navigation, route }) {
  const user = firebase_auth.currentUser;

  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationResults, setLocationResults] = useState([]);
  const [availabilityText, setAvailabilityText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [photoData, setPhotoData] = useState(null);

  const updateMapRegion = (latitude, longitude) => {
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  useEffect(() => {
    if (route.params?.draftRequest) {
      const draft = route.params.draftRequest;
      setServiceType(draft.serviceType ?? "");
      setDescription(draft.description ?? "");
      setLocationQuery(draft.locationQuery ?? "");
      setSelectedLocation(draft.selectedLocation ?? null);
      setAvailabilityText(draft.availabilityText ?? "");
      setShowMap(Boolean(draft.selectedLocation));
      setPhotoData(draft.photoData ?? null);

      if (draft.selectedLocation?.latitude && draft.selectedLocation?.longitude) {
        updateMapRegion(draft.selectedLocation.latitude, draft.selectedLocation.longitude);
      }

      navigation.setParams({ draftRequest: undefined });
    }
  }, [navigation, route.params?.draftRequest]);

  useEffect(() => {
    if (route.params?.capturedPhoto) {
      setPhotoData(route.params.capturedPhoto);
      navigation.setParams({ capturedPhoto: undefined });
    }
  }, [navigation, route.params?.capturedPhoto]);

  useEffect(() => {
    const trimmedQuery = locationQuery.trim();

    if (!trimmedQuery || trimmedQuery.length < 3) {
      setLocationResults([]);
      setIsSearching(false);
      return;
    }

    if (selectedLocation?.label === trimmedQuery) {
      setLocationResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(
            trimmedQuery
          )}`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Language": "en",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        const results = await response.json();
        if (!cancelled) {
          setLocationResults(
            results.map((item) => ({
              id: `${item.place_id}`,
              label: item.display_name,
              latitude: Number(item.lat),
              longitude: Number(item.lon),
            }))
          );
        }
      } catch (error) {
        console.warn(error);
        if (!cancelled) {
          setLocationResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [locationQuery, selectedLocation]);

  const resolveTypedLocation = async () => {
    const trimmedQuery = locationQuery.trim();
    if (!trimmedQuery) return null;

    const matches = await Location.geocodeAsync(trimmedQuery);
    if (!matches.length) {
      return null;
    }

    return {
      label: trimmedQuery,
      latitude: matches[0].latitude,
      longitude: matches[0].longitude,
      source: "typed",
    };
  };

  const useCurrentLocation = async () => {
    setIsFetchingLocation(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow location access to use your current location.");
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let label = "";

      try {
        label = await reverseGeocodeCoords(
          currentPosition.coords.latitude,
          currentPosition.coords.longitude
        );
      } catch (reverseError) {
        console.warn(reverseError);
      }

      if (!label) {
        const [reverseGeocoded] = await Location.reverseGeocodeAsync({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        });

        label =
          buildLocationLabel(reverseGeocoded) ||
          `${currentPosition.coords.latitude.toFixed(5)}, ${currentPosition.coords.longitude.toFixed(5)}`;
      }

      setLocationQuery(label);
      setSelectedLocation({
        label,
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        source: "device",
      });
      updateMapRegion(currentPosition.coords.latitude, currentPosition.coords.longitude);
      setShowMap(true);
      setLocationResults([]);
    } catch (error) {
      console.warn(error);
      Alert.alert("Location error", "We couldn't get your current location.");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const chooseLocation = (item) => {
    setLocationQuery(item.label);
    setSelectedLocation({
      label: item.label,
      latitude: item.latitude,
      longitude: item.longitude,
      source: "autocomplete",
    });
    updateMapRegion(item.latitude, item.longitude);
    setShowMap(true);
    setLocationResults([]);
  };

  const submit = async () => {
    if (!user) return;

    if (!serviceType.trim() || !description.trim() || !locationQuery.trim() || !availabilityText.trim()) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      const resolvedLocation = selectedLocation ?? (await resolveTypedLocation());
      if (!resolvedLocation) {
        Alert.alert(
          "Location needed",
          "Use your current location or choose a suggested place so we can locate the request."
        );
        return;
      }

      let uploadedPhoto = photoData;
      let photoUploadWarning = "";

      if (photoData?.localUri && !photoData?.uploadedUrl) {
        try {
          const cloudinaryPhoto = await uploadImageToCloudinary(photoData.uploadUri ?? photoData.localUri);
          uploadedPhoto = {
            ...photoData,
            uploadedUrl: cloudinaryPhoto.url,
            publicId: cloudinaryPhoto.publicId,
          };
          setPhotoData((currentPhoto) =>
            currentPhoto
              ? {
                  ...currentPhoto,
                  uploadedUrl: cloudinaryPhoto.url,
                  publicId: cloudinaryPhoto.publicId,
                }
              : currentPhoto
          );
        } catch (photoError) {
          console.warn(photoError);
          photoUploadWarning = photoError.message || "Photo upload failed, but the request will still be saved.";
          uploadedPhoto = null;
        }
      }

      await addDoc(collection(db, "requests"), {
        customerUid: user.uid,
        customerName: user.displayName ?? "Customer",
        serviceType: serviceType.trim(),
        description: description.trim(),
        locationText: resolvedLocation.label,
        locationCoords: {
          latitude: resolvedLocation.latitude,
          longitude: resolvedLocation.longitude,
        },
        locationSource: resolvedLocation.source,
        availabilityText: availabilityText.trim(),
        photoUrl: uploadedPhoto?.uploadedUrl ?? uploadedPhoto?.url ?? null,
        photoPublicId: uploadedPhoto?.publicId ?? null,
        status: "open",
        acceptedByUid: null,
        acceptedByName: null,
        createdAt: Timestamp.now(),
      });

      setServiceType("");
      setDescription("");
      setLocationQuery("");
      setSelectedLocation(null);
      setLocationResults([]);
      setAvailabilityText("");
      setShowMap(false);
      setMapRegion(null);
      setPhotoData(null);

      if (typeof navigation.popToTop === "function") {
        navigation.popToTop();
      } else {
        navigation.navigate("Home");
      }

      if (photoUploadWarning) {
        Alert.alert("Posted", `Your request was saved. ${photoUploadWarning}`);
      } else {
        Alert.alert("Posted", "Your request is now visible to detailers.");
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", e.message || "Could not submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
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
        <Pressable
          onPress={useCurrentLocation}
          disabled={isFetchingLocation}
          style={{
            ...styles.button,
            ...styles.buttonPlain,
            opacity: isFetchingLocation ? 0.7 : 1,
          }}
        >
          {isFetchingLocation ? (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 }}>
              <ActivityIndicator />
              <Text style={styles.buttonText}>Getting Current Location...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Use Current Location</Text>
          )}
        </Pressable>

        <TextInput
          value={locationQuery}
          onChangeText={(text) => {
            setLocationQuery(text);
            setSelectedLocation((currentSelection) =>
              currentSelection?.label === text ? currentSelection : null
            );
          }}
          placeholder="Search an address or area"
          style={styles.textInput}
        />
        <Text style={{ color: "#444" }}>
          Start typing for suggestions, or tap the button above to use your current location.
        </Text>

        {isSearching ? <Text>Searching places...</Text> : null}

        {locationResults.length > 0 ? (
          <FlatList
            data={locationResults}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 180, borderWidth: 1, borderRadius: 5 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => chooseLocation(item)}
                style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: "#DDD" }}
              >
                <Text>{item.label}</Text>
              </Pressable>
            )}
          />
        ) : null}

        {selectedLocation ? (
          <Pressable
            onPress={() => setShowMap((current) => !current)}
            style={{ ...styles.button, ...styles.buttonPlain }}
          >
            <Text style={styles.buttonText}>{showMap ? "Hide Map" : "Show Map"}</Text>
          </Pressable>
        ) : null}

        {showMap && mapRegion ? (
          <View>
            <Text style={styles.inputLabel}>Map Preview</Text>
            <LocationPreviewMap
              region={mapRegion}
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              label={selectedLocation.label}
              onRegionChangeComplete={setMapRegion}
            />
          </View>
        ) : null}

        <Text style={styles.inputLabel}>Vehicle Photo</Text>
        {photoData?.localUri ? (
          <>
            <Image
              source={{ uri: photoData.localUri }}
              style={{ width: "100%", height: 220, borderRadius: 12, backgroundColor: "#DDD" }}
              resizeMode="cover"
            />
            <Text style={{ color: "#444" }}>
              This photo will upload to Cloudinary when you submit the request.
            </Text>
          </>
        ) : (
          <Text style={{ color: "#444" }}>No photo attached yet.</Text>
        )}

        <Pressable
          onPress={() =>
            navigation.navigate("TakePhoto", {
              draftRequest: {
                serviceType,
                description,
                locationQuery,
                selectedLocation,
                availabilityText,
                photoData,
              },
            })
          }
          style={{ ...styles.button, ...styles.buttonPlain }}
        >
          <Text style={styles.buttonText}>{photoData ? "Retake / Replace Photo" : "Take Photo"}</Text>
        </Pressable>

        <Text style={styles.inputLabel}>When are you available?</Text>
        <TextInput
          value={availabilityText}
          onChangeText={setAvailabilityText}
          placeholder="Weekend afternoon, etc."
          style={styles.textInput}
        />

        <Pressable
          onPress={submit}
          disabled={isSubmitting}
          style={{
            ...styles.button,
            ...styles.buttonPlain,
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
