import { View } from "react-native";

function buildWebMapEmbedUrl(latitude, longitude) {
  const latitudeDelta = 0.02;
  const longitudeDelta = 0.02;
  const bbox = [
    longitude - longitudeDelta,
    latitude - latitudeDelta,
    longitude + longitudeDelta,
    latitude + latitudeDelta,
  ].join("%2C");

  const marker = `${latitude}%2C${longitude}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
}

export default function LocationPreviewMap({ latitude, longitude }) {
  return (
    <View style={{ height: 240, marginTop: 8, overflow: "hidden", borderRadius: 10, borderWidth: 1 }}>
      <iframe
        title="Location map preview"
        src={buildWebMapEmbedUrl(latitude, longitude)}
        style={{ border: 0, width: "100%", height: "100%" }}
      />
    </View>
  );
}
