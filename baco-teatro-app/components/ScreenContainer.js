import React from 'react';
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import colors from '../theme/colors';
import GlobalActions from './GlobalActions';

export default function ScreenContainer({ 
  children, 
  scrollable = true, 
  style, 
  showActions = true,
  refreshing = false,
  onRefresh = null
}) {
  const content = (
    <>
      {showActions && <GlobalActions />}
      {children}
    </>
  );

  const Wrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const wrapperProps = Platform.OS === 'ios' ? { behavior: 'padding', style: { flex: 1 } } : { style: { flex: 1 } };

  if (scrollable) {
    return (
      <Wrapper {...wrapperProps}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={[styles.content, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={colors.secondary} 
                colors={[colors.secondary]} 
              />
            ) : null
          }
        >
          {content}
        </ScrollView>
      </Wrapper>
    );
  }

  return <View style={[styles.container, styles.content, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 100, // Extra space for mobile browsers
  },
});
