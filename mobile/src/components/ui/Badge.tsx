import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import theme from '@/theme/theme'

interface BadgeProps {
  label: string
  color?: string
  bgColor?: string
  style?: ViewStyle
}

export default function Badge({
  label,
  color = theme.colors.primary,
  bgColor = theme.colors.primaryLight,
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
})
