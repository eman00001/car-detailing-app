import MapView, { Marker, Callout } from 'react-native-maps';
import { View, Text } from 'react-native';
import styles from '../stylesheet';
import { statusColors } from '../constants';

export default function DetailerMap({ initialRegion, markers = [], onCalloutPress, showStatus = false }) {
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
                {markers.map((marker) => {

                    return (
                        <Marker
                            key={marker.id}
                            coordinate={{
                                latitude: marker.lat,
                                longitude: marker.lng,
                            }}
                            title={marker.title}
                        >
                            <Callout onPress={() => onCalloutPress?.(marker)}>
                                <View style={{ width: 220 }}>
                                    <Text style={{ fontWeight: '700', marginBottom: 4 }}>{marker.title}</Text>
                                    <Text style={{ marginBottom: 6 }}>{marker.description}</Text>
                                    {showStatus && <Text style={[styles.status, statusColors[marker.status]]}>{marker.status.toUpperCase()}</Text>}
                                    <Text style={{ color: marker.request ? '#007AFF' : '#666', fontWeight: '700' }}>
                                        {'Tap for details'}
                                    </Text>
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}
            </MapView>
        </View>
    );
}
