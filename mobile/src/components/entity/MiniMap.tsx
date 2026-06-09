import React from 'react'
import { StyleSheet, View } from 'react-native'
import MapLibreGL from '@maplibre/maplibre-react-native'
import theme from '@/theme/theme'

MapLibreGL.setAccessToken(null)

interface MiniMapProps {
  lat: number
  lng: number
  name?: string
}

export default function MiniMap({ lat, lng }: MiniMapProps) {
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
})
