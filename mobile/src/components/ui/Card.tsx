import React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'
import theme from '@/theme/theme'

export default function Card({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.base,
    ...theme.shadow.md,
  },
})
