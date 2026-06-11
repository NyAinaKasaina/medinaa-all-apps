import React, { forwardRef, useCallback } from 'react'
import { StyleSheet } from 'react-native'
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import theme from '@/theme/theme'

interface BottomSheetProps {
  snapPoints?: (string | number)[]
  children: React.ReactNode
  onChange?: (index: number) => void
}

const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  ({ snapPoints = ['25%', '50%'], children, onChange }, ref) => {
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
      []
    )
    return (
      <GorhomBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bg}
        handleIndicatorStyle={styles.handle}
        onChange={onChange}
      >
        <BottomSheetView style={styles.content}>{children}</BottomSheetView>
      </GorhomBottomSheet>
    )
  }
)

BottomSheet.displayName = 'BottomSheet'
export default BottomSheet

const styles = StyleSheet.create({
  bg: { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl },
  handle: { backgroundColor: theme.colors.border, width: 40 },
  content: { flex: 1, padding: theme.spacing.base },
})
