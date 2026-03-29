import MapView, { Marker, Callout } from 'react-native-maps';
import { View, Text } from 'react-native';
import styles from '../stylesheet';

export default function DetailerMap({ initialRegion, markers = [], onCalloutPress }) {
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
                    const title = String(
                        marker.title ??
                        marker.request?.service ??
                        marker.request?.customerName ??
                        marker.request?.name ??
                        'Location'
                    );
                    const description = String(
                        marker.description ??
                        marker.request?.description ??
                        marker.request?.notes ??
                        marker.request?.details ??
                        marker.request?.service ??
                        'Tap for details'
                    );

                    return (
                        <Marker
                            key={marker.id}
                            coordinate={{
                                latitude: marker.lat ?? marker.latitude,
                                longitude: marker.lng ?? marker.longitude,
                            }}
                            title={title}
                        >
                            <Callout onPress={() => onCalloutPress?.(marker)}>
                                <View style={{ width: 220 }}>
                                    <Text style={{ fontWeight: '700', marginBottom: 4 }}>{title}</Text>
                                    <Text numberOfLines={2} style={{ marginBottom: 6 }}>
                                        {description}
                                    </Text>
                                    <Text style={{ color: marker.request ? '#007AFF' : '#666', fontWeight: '700' }}>
                                        {marker.request ? 'Tap for details' : 'Tap marker for info'}
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
