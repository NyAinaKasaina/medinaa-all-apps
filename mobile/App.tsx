import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from '@/context/AuthContext'
import { LocationProvider } from '@/context/LocationContext'
import i18n from '@/i18n/index'
import { storage } from '@/lib/storage'
import RootNavigator from '@/navigation/RootNavigator'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
})

export default function App() {
  useEffect(() => {
    storage.getLanguage().then(lang => {
      if (lang) void i18n.changeLanguage(lang)
    })
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <RootNavigator />
          </LocationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
