import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import styles from "../../stylesheet";

export default function CustomerTakePhotoScreen({ navigation, route }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

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
        base64: Platform.OS === "web",
      });

      const uploadUri = photo?.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo?.uri || null;
      const previewUri = photo?.uri || uploadUri;

      if (!previewUri) {
        throw new Error("No image data was returned from the camera.");
      }

      setCapturedPhoto({
        ...photo,
        uri: previewUri,
        uploadUri,
      });
    } catch (error) {
      console.warn(error);
      Alert.alert("Camera error", error.message || "We couldn't capture a photo.");
    } finally {
      setIsCapturing(false);
    }
  };

  const usePhoto = async () => {
    if (!capturedPhoto?.uri) return;

    navigation.navigate("Customer Home", {
      screen: "Create Request",
      params: {
        draftRequest: route.params?.draftRequest ?? null,
        capturedPhoto: {
          localUri: capturedPhoto.uri,
          uploadUri: capturedPhoto.uploadUri ?? capturedPhoto.uri,
          uploadedUrl: null,
          publicId: null,
        },
      },
    });
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
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
