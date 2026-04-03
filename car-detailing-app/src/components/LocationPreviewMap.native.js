import MapView, { Marker } from "react-native-maps";

export default function LocationPreviewMap({ region, latitude, longitude, label, onRegionChangeComplete }) {
  return (
    <MapView
      style={{ height: 240, borderRadius: 10, marginTop: 8 }}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        title="Selected Location"
        description={label}
      />
    </MapView>
  );
}
