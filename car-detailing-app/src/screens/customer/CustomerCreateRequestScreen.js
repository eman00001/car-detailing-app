import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, Pressable, Alert, FlatList, ActivityIndicator, Image, KeyboardAvoidingView, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import DropDownPicker from 'react-native-dropdown-picker';
import { useHeaderHeight } from '@react-navigation/elements';
import { doc, collection, Timestamp, query, orderBy, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import * as Location from "expo-location";
import { db } from "../../firebaseConfig";
import LocationPreviewMap from "../../components/LocationPreviewMap";
import LoadingScreen from "../LoadingScreen";
import styles from "../../stylesheet";
import ErrorScreen from "../ErrorScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomerRequestStepIndicator from "./CustomerRequestStepIndicator";
import { useNavigation } from "@react-navigation/native";

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
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${
            encodeURIComponent(latitude)
        }&lon=${
            encodeURIComponent(longitude)
        }`,
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

export default function CustomerCreateRequestScreen({ route }) {
    const navigation = useNavigation();
    const navigationHeaderHeight = useHeaderHeight();
    
    // stores the message of any errors that occur on the screen
    const [errorMessage, setErrorMessage] = useState(null);

    // stores the user's ID from AsyncStorage
    const [userUid, setUserUid] = useState(null);
    const [userName, setUserName] = useState(null);

    // stores the existing request, if this request is already existing and this is an edit operation
    const [request, setRequest] = useState(null);

    // holds the detailing types stored in the database
    const [detailingTypes, setDetailingTypes] = useState(null);
    // stores whether the dropdown for the detailing types is currently open
    const [isDetailingTypesDropdownOpen, setIsDetailingTypesDropdownOpen] = useState(false); // dropdown closed on default

    const [serviceType, setServiceType] = useState("");
    const [description, setDescription] = useState("");

    const [availabilityText, setAvailabilityText] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [mapRegion, setMapRegion] = useState(null);

    const [locationQuery, setLocationQuery] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locationResults, setLocationResults] = useState([]);
    // stores whether the dropdown for the location autocomplete is currently open
    const [isLocationAutocompleteDropdownOpen, setIsLocationAutocompleteDropdownOpen] = useState(false); // dropdown closed on default
    
    const updateMapRegion = (latitude, longitude) => {
        setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    };

    // get user ID from async storage
    useEffect(() => {
        (async () => {
            try {
                const userUid = await AsyncStorage.getItem('userUid');
                const userName = await AsyncStorage.getItem('userName');
                setUserUid(userUid);
                setUserName(userName);
                if (userUid == null) { // user ID should not be null on this screen, so if is show error message
                    setErrorMessage('You must be signed in to view this screen');
                }
            } catch (e) {
                console.error(e);
                setErrorMessage('Something went wrong');
            }
        })();
    }, []);

    // handles getting the request from the database
    useEffect(() => {
        if (route.params?.requestId == null) { // if request not passed in navigation, cannot continue
            setRequest(null);
            return;
        }

        const { requestId } = route.params;
        const requestDoc = doc(db, 'requests', requestId);
        // listen for changes
        const unsubscribe = onSnapshot(requestDoc, async (requestDocSnapshot) => {
            // store request in state if existing
            if (requestDocSnapshot.exists()) {
                const request = { ...requestDocSnapshot.data(), id: requestDocSnapshot.id };
                setRequest(request);
                // set form values based on existing request data
                if (request.serviceType) setServiceType(request.serviceType);
                if (request.description) setDescription(request.description);
                if (request.locationText) {
                    setSelectedLocation({
                        id: -1, // special ID,
                        label: request.locationText,
                        latitude: request.locationCoords.latitude,
                        longitude: request.locationCoords.longitude,
                        source: request.locationSource,
                    });
                    updateMapRegion(request.locationCoords.latitude, request.locationCoords.longitude);
                    setShowMap(true); // show map if location is set
                }
                if (request.availabilityText) setAvailabilityText(request.availabilityText);
            } else {
                setRequest(null);
            }
        });
        return unsubscribe;
    }, []);

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

    useEffect(() => {
        const trimmedQuery = locationQuery.trim();

        if (!trimmedQuery || trimmedQuery.length < 3) {
            setLocationResults(selectedLocation ? [selectedLocation] : []); // if query too short, show only current if selected
            setIsSearching(false);
            return;
        }

        if (selectedLocation?.label === trimmedQuery) {
            setLocationResults([selectedLocation]); // so that selected location shows up in dropdown
            setIsSearching(false);
            return;
        }

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=20&q=${
                        encodeURIComponent(trimmedQuery)
                    }`,
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
                    const locationResults = results.map((item) => ({
                        id: `${item.place_id}`,
                        label: item.display_name,
                        latitude: Number(item.lat),
                        longitude: Number(item.lon),
                    }));
                    // add currently selected location to top of dropdown, removing if in search
                    if (selectedLocation != null) {
                        const selectedLocationIndex = locationResults.findIndex(location => location.id === selectedLocation.id);
                        if (selectedLocationIndex !== -1) {
                            locationResults.splice(selectedLocationIndex, 1);
                        }
                        locationResults.unshift(selectedLocation); // add to start
                    }

                    setLocationResults(locationResults);
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
        if (!matches.length) return null;

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
                id: -1, // special ID when device location used
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

    const chooseLocation = (itemId) => {
        if (typeof(itemId) === 'function') {
            itemId = itemId();
        }
        const item = locationResults.find(item => item.id === itemId);
        if (item == null) return;
        setLocationQuery(item.label);
        setSelectedLocation({
            ...item,
            source: "autocomplete",
        });
        updateMapRegion(item.latitude, item.longitude);
        setShowMap(true);
        setLocationResults([item]); // keep item in dropdown so preview works correctly
    };

    const submit = async (continueToNextStep) => {
        if (!userUid) return;

        if (!serviceType.trim() || !description.trim() || !selectedLocation?.label.trim() || !availabilityText.trim()) {
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

            const { requestId } = route.params;

            const docRef = doc(db, 'requests', requestId);
            const requestData = {
                customerUid: userUid,
                customerName: userName ?? "Customer",
                serviceType: serviceType.trim(),
                description: description.trim(),
                locationText: resolvedLocation.label,
                locationCoords: {
                    latitude: resolvedLocation.latitude,
                    longitude: resolvedLocation.longitude,
                },
                locationSource: resolvedLocation.source,
                availabilityText: availabilityText.trim(),
                status: "draft", // for now, there is still more info needed so is a draft
                acceptedByUid: null,
                acceptedByName: null,
                updatedAt: Timestamp.now(),
            };
            if (request == null) {
                await setDoc(docRef, requestData);
            } else {
                await updateDoc(docRef, requestData);
            }

            if (continueToNextStep) {
                navigation.navigate('CarDetailsForm', { requestId }); // go to next step, passing ID of request
            } else {
                // save as draft and go to drafts screen
                navigation.popTo('Home', { screen: 'CustomerDashboard', params: { screen: 'RequestDrafts' }});
            }

        } catch (e) {
            console.warn(e);
            Alert.alert("Error", e.message || "Could not submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // render the detailing type dropdown
    const renderDetailingTypeDropdownPicker = () => {
        return (
            <View>
                <Text style={{ marginBottom: 4 }}>
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

    const renderLocationAutocompleteDropdownPicker = () => {
        return (
            <View>
                <DropDownPicker
                    schema={{ label: 'label', value: 'id' }}
                    listMode="MODAL"
                    open={isLocationAutocompleteDropdownOpen}
                    items={locationResults}
                    value={selectedLocation?.id}
                    searchable={true}
                    disableLocalSearch={true}
                    searchPlaceholder="Search..."
                    placeholder="Search an address or area"
                    setOpen={setIsLocationAutocompleteDropdownOpen}
                    setValue={chooseLocation}
                    onChangeSearchText={setLocationQuery}
                    ListEmptyComponent={() => (
                        <View style={styles.containerCentered}>
                            {isSearching ? (
                                <ActivityIndicator />
                            ) : (
                                <Text>Type a location in the search bar to see results</Text>
                            )}
                        </View>
                    )}
                    flatListProps={{
                        ListHeaderComponent: (isSearching && locationResults.length > 0) ? (() => (
                            <View style={styles.paddedContainer}>
                                <ActivityIndicator />
                            </View>
                        )) : undefined,
                    }}
                />
            </View>
        )
    }

    // show any errors if present
    if (errorMessage != null) {
        return <ErrorScreen errorMessage={errorMessage} />
    }

    // show error if request ID not passed 
    if (route.params?.requestId == null) {
        return <ErrorScreen errorMessage="Unknown Request" />
    }

    // if any external data is still being fetched, load
    if (userUid == null || detailingTypes == null) {
        return <LoadingScreen />
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior='padding'
                keyboardVerticalOffset={navigationHeaderHeight}
            >
                <ScrollView
                    style={styles.paddedContainer}
                    contentContainerStyle={[styles.listContainer, styles.paddedScrollContainer]}
                >
                    <CustomerRequestStepIndicator currentStep={1} />

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
                    <Pressable
                        onPress={useCurrentLocation}
                        disabled={isFetchingLocation}
                        style={[
                            styles.button,
                            styles.buttonPlain,
                            { opacity: isFetchingLocation ? 0.7 : 1 },
                        ]}
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

                    {renderLocationAutocompleteDropdownPicker()}

                    {selectedLocation && (
                        <Pressable
                            onPress={() => setShowMap((current) => !current)}
                            style={[styles.button, styles.buttonPlain]}
                        >
                            <Text style={styles.buttonText}>{showMap ? "Hide Map" : "Show Map"}</Text>
                        </Pressable>
                    )}

                    {showMap && mapRegion && (
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
                    )}

                    <View>
                        <Text style={styles.inputLabel}>When are you available?</Text>
                        <Text>
                            Let us know around when you may be available. This could be a specific date,
                            or a periodic time such as every Tuesday from 5:00&ndash;7:00pm.
                        </Text>
                    </View>
                    <TextInput
                        value={availabilityText}
                        onChangeText={setAvailabilityText}
                        placeholder="Weekend afternoon, etc."
                        multiline
                        style={[styles.textInput, { minHeight: 90, textAlignVertical: "top" }]}
                    />

                    <View style={styles.row}>
                        <Pressable
                            onPress={() => submit(false)}
                            disabled={isSubmitting}
                            style={[
                                styles.button,
                                styles.buttonStretch,
                                isSubmitting ? styles.buttonDisabled : styles.buttonPlain,
                            ]}
                        >
                            <Text style={styles.buttonText}>Save as Draft</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => submit(true)}
                            disabled={isSubmitting}
                            style={[
                                styles.button,
                                styles.buttonStretch,
                                isSubmitting ? styles.buttonDisabled : styles.buttonPrimary,
                            ]}
                        >
                            <Text style={styles.buttonText}>Submit</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
