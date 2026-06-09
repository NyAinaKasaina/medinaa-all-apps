import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import HomeScreen from '@/screens/HomeScreen'
import SearchScreen from '@/screens/SearchScreen'
import MapScreen from '@/screens/MapScreen'
import ProfileScreen from '@/screens/ProfileScreen'

export type MainTabParamList = {
  Home: undefined
  Search: undefined
  Map: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<MainTabParamList>()

export default function MainTabNavigator() {
  const { t } = useTranslation()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline', Search: 'search-outline',
            Map: 'map-outline', Profile: 'person-outline',
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('home.nearYou') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: t('common.search') }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: t('map.title') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile.title') }} />
    </Tab.Navigator>
  )
}
