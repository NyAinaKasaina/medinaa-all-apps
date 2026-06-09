import React from 'react'
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import theme from '@/theme/theme'

interface MiniMapProps {
  lat: number
  lng: number
  name?: string
}

export default function MiniMap({ lat, lng, name }: MiniMapProps) {
  if (Platform.OS === 'web') {
    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
    return (
      <Pressable onPress={() => Linking.openURL(osmUrl)} style={styles.webFallback}>
        <Text style={styles.webIcon}>📍</Text>
        <Text style={styles.webLabel}>{lat.toFixed(5)}, {lng.toFixed(5)}</Text>
        <Text style={styles.webLink}>Voir sur OpenStreetMap →</Text>
      </Pressable>
    )
  }

  const MapLibreGL = require('@maplibre/maplibre-react-native').default
  MapLibreGL.setAccessToken(null)

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          zoomLevel={14}
          centerCoordinate={[lng, lat]}
          animationDuration={0}
        />
        <MapLibreGL.ShapeSource
          id="pin"
          shape={{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: {},
          } as any}
        >
          <MapLibreGL.CircleLayer
            id="pinCircle"
            style={{
              circleRadius: 8,
              circleColor: theme.colors.primary,
              circleStrokeWidth: 2,
              circleStrokeColor: theme.colors.surface,
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.base,
  },
  map: { flex: 1 },
  webFallback: {
    height: 120,
    borderRadius: theme.radius.lg,
    marginTop: theme.spacing.base,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  webIcon: { fontSize: 32 },
  webLabel: { fontSize: theme.typography.fontSize.sm, color: theme.colors.text },
  webLink: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary, fontWeight: theme.typography.fontWeight.semibold },
})
