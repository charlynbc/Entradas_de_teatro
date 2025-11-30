import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import colors from '../theme/colors';
import GlobalActions from './GlobalActions';

export default function ScreenContainer({ children, scrollable = true, style, showActions = true }) {
  const content = (
    <>
      {showActions && <GlobalActions />}
      {children}
    </>
  );

  if (scrollable) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, style]}>
        {content}
      </ScrollView>
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
  },
});
