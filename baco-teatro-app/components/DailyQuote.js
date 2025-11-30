import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRandomQuote } from '../utils/quotes';
import colors from '../theme/colors';

export default function DailyQuote({ style, variant = 'default' }) {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  if (!quote) return null;

  const isCard = variant === 'card';

  return (
    <View style={[styles.container, isCard && styles.cardContainer, style]}>
      {isCard && <Text style={styles.title}>Frase del día</Text>}
      <Text style={[styles.text, isCard && styles.cardText]}>«{quote.text}»</Text>
      <Text style={[styles.author, isCard && styles.cardAuthor]}>— {quote.author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    color: colors.text,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
  },
  author: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardAuthor: {
    color: colors.secondary,
    marginTop: 8,
  },
});
