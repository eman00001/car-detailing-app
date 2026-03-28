import MapView, { Marker } from 'react-native-maps';
import { View } from 'react-native';
import styles from '../stylesheet';

export default function DetailerMap({ initialRegion, markers = [] }) {
    const defaultRegion = {
        latitude: 44.6488,
        longitude: -63.5752,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    const region = initialRegion
        ? {
              ...initialRegion,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
          }
        : markers.length > 0
        ? {
              latitude: markers[0].lat ?? markers[0].latitude,
              longitude: markers[0].lng ?? markers[0].longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
          }
        : defaultRegion;

    return (
        <View style={{ flex: 1 }}>
            <MapView style={styles.map} initialRegion={region}>
                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        coordinate={{
                            latitude: marker.lat ?? marker.latitude,
                            longitude: marker.lng ?? marker.longitude,
                        }}
                        title={marker.title}
                    />
                ))}
            </MapView>
        </View>
    );
}
