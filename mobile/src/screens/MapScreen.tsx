import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import theme from '@/theme/theme'
import { api, MedicalEntity } from '@/lib/api'
import { useCoords } from '@/context/LocationContext'
import EntityCard from '@/components/entity/EntityCard'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

function MapScreenWeb() {
  return (
    <View style={styles.webFallback}>
      <Text style={styles.webIcon}>🗺️</Text>
      <Text style={styles.webTitle}>Carte disponible sur mobile</Text>
      <Text style={styles.webSub}>Installez l'app sur Android pour accéder à la carte interactive.</Text>
    </View>
  )
}

export default function MapScreen() {
  if (Platform.OS === 'web') return <MapScreenWeb />

  const MapLibreGL = require('@maplibre/maplibre-react-native').default
  const GorhomBottomSheet = require('@gorhom/bottom-sheet').default
  MapLibreGL.setAccessToken(null)

  const navigation = useNavigation<Nav>()
  const userCoords = useCoords()
  const bottomSheetRef = useRef<any>(null)
  const [selectedEntity, setSelectedEntity] = useState<MedicalEntity | null>(null)

  const { data } = useQuery({
    queryKey: ['places', 'all-for-map'],
    queryFn: () => api.places.list({ limit: 500 }),
  })

  const geoJson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: (data?.items ?? [])
        .filter((e) => e.lat != null && e.lng != null)
        .map((e) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [e.lng!, e.lat!] },
          properties: {
            id: e.id,
            name: e.name ?? '(Sans nom)',
            type: e.amenity ?? e.healthcare ?? '',
          },
        })),
    }),
    [data]
  )

  const handlePinPress = useCallback(
    (e: any) => {
      const feature = e?.features?.[0]
      if (!feature) return
      const entity = data?.items.find((i) => i.id === feature.properties.id)
      if (!entity) return
      setSelectedEntity(entity)
      bottomSheetRef.current?.expand()
    },
    [data]
  )

  const handleCardPress = useCallback(() => {
    if (!selectedEntity) return
    bottomSheetRef.current?.close()
    navigation.navigate('EntityDetail', { id: selectedEntity.id })
  }, [selectedEntity, navigation])

  return (  // native only — web handled above
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          zoomLevel={10}
          centerCoordinate={[userCoords.longitude, userCoords.latitude]}
          animationDuration={500}
        />
        <MapLibreGL.UserLocation visible renderMode="native" />
        <MapLibreGL.ShapeSource
          id="entities"
          shape={geoJson}
          cluster
          clusterRadius={40}
          clusterMaxZoomLevel={14}
          onPress={handlePinPress}
        >
          <MapLibreGL.CircleLayer
            id="clusteredCircle"
            filter={['has', 'point_count']}
            style={clusterCircleStyle}
          />
          <MapLibreGL.SymbolLayer
            id="clusterCount"
            filter={['has', 'point_count']}
            style={clusterCountStyle}
          />
          <MapLibreGL.CircleLayer
            id="unclustered"
            filter={['!', ['has', 'point_count']]}
            style={unclusteredStyle}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      <GorhomBottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['30%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      >
        {selectedEntity && (
          <View style={styles.sheet}>
            <EntityCard entity={selectedEntity} onPress={handleCardPress} />
          </View>
        )}
      </GorhomBottomSheet>
    </View>
  )
}

const clusterCircleStyle = {
  circleRadius: 20,
  circleColor: theme.colors.primary,
  circleOpacity: 0.85,
} as const

const clusterCountStyle = {
  textField: ['get', 'point_count'],
  textSize: 13,
  textColor: theme.colors.textOnPrimary,
} as const

const unclusteredStyle = {
  circleRadius: 8,
  circleColor: theme.colors.primary,
  circleStrokeWidth: 2,
  circleStrokeColor: theme.colors.surface,
} as const

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  sheet: { padding: theme.spacing.base },
  webFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, padding: theme.spacing['2xl'], backgroundColor: theme.colors.background },
  webIcon: { fontSize: 64 },
  webTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, textAlign: 'center' },
  webSub: { fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary, textAlign: 'center' },
})
