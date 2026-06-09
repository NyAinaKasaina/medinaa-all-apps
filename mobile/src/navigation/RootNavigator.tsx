import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { storage } from '@/lib/storage'
import MainTabNavigator from './MainTabNavigator'
import OnboardingScreen from '@/screens/OnboardingScreen'
import EntityDetailScreen from '@/screens/EntityDetailScreen'
import ClaimScreen from '@/screens/ClaimScreen'
import EditEntityScreen from '@/screens/EditEntityScreen'
import LoginScreen from '@/screens/auth/LoginScreen'
import RegisterScreen from '@/screens/auth/RegisterScreen'

export type RootStackParamList = {
  Onboarding: undefined
  MainTabs: undefined
  EntityDetail: { id: string }
  Claim: { entityId: string }
  EditEntity: { entityId: string }
  Login: undefined
  Register: { entityId?: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    storage.getOnboardingDone().then(setOnboardingDone)
  }, [])

  if (onboardingDone === null) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingDone ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        )}
        <Stack.Screen name="EntityDetail" component={EntityDetailScreen}
          options={{ headerShown: true, headerTitle: '', headerBackTitle: '' }} />
        <Stack.Screen name="Claim" component={ClaimScreen} />
        <Stack.Screen name="EditEntity" component={EditEntityScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
