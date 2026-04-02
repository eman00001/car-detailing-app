import { useRef, useState, useEffect } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import styles from "../../stylesheet";
import { useNavigation } from "@react-navigation/native";
import LoadingScreen from "../LoadingScreen";
import { uploadImages, CLOUDINARY_CUSTOMER_REQUEST_CAR_PHOTO_UPLOAD_PRESET } from "../../imageUploadUtils";
import { db } from "../../firebaseConfig";
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import CustomerRequestStepIndicator from "./CustomerRequestStepIndicator";

export default function CustomerTakePhotoScreen({ route }) {
    const navigation = useNavigation();
    const cameraRef = useRef(null);

    // remaing in loading state until finish fetching from database
    const [loading, setLoading] = useState(true);
    // holds the request draft so far
    const [request, setRequest] = useState(null);

    const [permission, requestPermission] = useCameraPermissions();
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

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
                if (request.photoUrl) setCapturedPhoto({ uri: request.photoUrl, isExisting: true });
            } else {
                setRequest(null);
            }
            setLoading(false); // finish loading
        });
        return unsubscribe;
    }, []);

    const takePhoto = async () => {
        if (!cameraRef.current || isCapturing || !cameraReady) {
            if (!cameraReady) {
                Alert.alert("Camera not ready", "Please wait a second for the camera preview to finish loading.");
            }
            return;
        }

        setIsCapturing(true);

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                skipProcessing: true,
            });

            if (!photo?.uri) {
                throw new Error("No image data was returned from the camera.");
            }

            setCapturedPhoto(photo);

        } catch (error) {
            console.warn(error);
            Alert.alert("Camera error", error.message || "We couldn't capture a photo.");
        } finally {
            setIsCapturing(false);
        }
    };

    const usePhoto = async () => {
        if (!capturedPhoto?.uri) return;

        // only upload photo if not existing
        if (!capturedPhoto.isExisting) {
            let photoUrl = null;

            try {
                ([photoUrl] = await uploadImages([capturedPhoto.uri], CLOUDINARY_CUSTOMER_REQUEST_CAR_PHOTO_UPLOAD_PRESET));
            } catch (photoError) {
                console.warn(photoError);
                Alert.alert("Photo upload failed", photoError.message);
                return;
            }

            const requestDoc = doc(db, 'requests', request.id);
            try {
                // add the URL to the captured photo to the database
                await updateDoc(requestDoc, { photoUrl });
            } catch (e) {
                console.error(e);
                return;
            }
        }
        
        // navigation to the next screen, which is the request confirmation screen
        navigation.navigate("ConfirmRequest", { requestId: request.id });
    };

    if (loading || !permission) {
        return <LoadingScreen />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16, gap: 12 }}>
                    <Text style={{ fontSize: 22, fontWeight: "700", textAlign: "center" }}>Camera Access Needed</Text>
                    <Text style={{ textAlign: "center" }}>
                        Allow camera access so customers can take a photo of the vehicle before submitting a request.
                    </Text>
                    <Pressable onPress={requestPermission} style={{ ...styles.button, ...styles.buttonPlain, width: "100%" }}>
                        <Text style={styles.buttonText}>Allow Camera Access</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1, padding: 16, gap: 12 }}>
                <CustomerRequestStepIndicator currentStep={3} />
                
                <Text style={{ fontSize: 22, fontWeight: "700" }}>Take Vehicle Photo</Text>

                {capturedPhoto ? (
                    <>
                        <Text>Your photo was captured. Review it below, then upload it to your request.</Text>
                        <Image
                            source={{ uri: capturedPhoto.uri }}
                            style={{ flex: 1, borderRadius: 12, backgroundColor: "#DDD" }}
                            resizeMode="cover"
                        />

                        <Pressable
                            onPress={() => setCapturedPhoto(null)}
                            style={{ ...styles.button, ...styles.buttonPlain }}
                        >
                            <Text style={styles.buttonText}>Retake Photo</Text>
                        </Pressable>

                        <Pressable onPress={usePhoto} style={{ ...styles.button, ...styles.buttonPlain }}>
                            <Text style={styles.buttonText}>Use This Photo</Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <CameraView
                            ref={cameraRef}
                            style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
                            facing="back"
                            onCameraReady={() => setCameraReady(true)}
                        />

                        <Text>
                            {cameraReady
                                ? "When you're ready, take a photo. You'll be able to review and upload it next."
                                : "Loading camera..."}
                        </Text>

                        <Pressable
                            onPress={takePhoto}
                            disabled={!cameraReady || isCapturing}
                            style={{
                                ...styles.button,
                                ...styles.buttonPlain,
                                opacity: !cameraReady || isCapturing ? 0.7 : 1,
                            }}
                        >
                            {isCapturing ? (
                                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 }}>
                                    <ActivityIndicator />
                                    <Text style={styles.buttonText}>Capturing Photo...</Text>
                                </View>
                            ) : (
                                <Text style={styles.buttonText}>Take Photo</Text>
                            )}
                        </Pressable>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}
