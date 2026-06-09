import React, { createContext, useContext, useEffect, useState } from 'react'
import * as Location from 'expo-location'

interface LocationState {
  coords: { latitude: number; longitude: number } | null
  permissionGranted: boolean
  loading: boolean
}

const LocationContext = createContext<LocationState>({
  coords: null, permissionGranted: false, loading: true,
})

// Default: Antananarivo city center
export const DEFAULT_COORDS = { latitude: -18.9137, longitude: 47.5361 }

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocationState>({ coords: null, permissionGranted: false, loading: true })

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        setState({ coords: null, permissionGranted: false, loading: false })
        return
      }
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(loc => {
        setState({ coords: loc.coords, permissionGranted: true, loading: false })
      }).catch(() => {
        setState({ coords: null, permissionGranted: true, loading: false })
      })
    })
  }, [])

  return <LocationContext.Provider value={state}>{children}</LocationContext.Provider>
}

export const useLocation = () => useContext(LocationContext)
export const useCoords = () => useContext(LocationContext).coords ?? DEFAULT_COORDS
