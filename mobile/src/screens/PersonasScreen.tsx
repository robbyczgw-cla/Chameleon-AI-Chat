/**
 * Personas Screen
 * Select AI personality
 */

import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { Card } from 'react-native-paper'
import { PERSONAS } from '@chameleon/shared/constants/personas'

export function PersonasScreen() {
  const handlePersonaSelect = (personaId: string) => {
    // TODO: Save selected persona to storage
    console.log('Selected persona:', personaId)
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={PERSONAS}
        keyExtractor={item => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.personaCard}
            onPress={() => handlePersonaSelect(item.id)}
          >
            <Card>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 8,
  },
  personaCard: {
    flex: 1,
    margin: 8,
  },
  cardContent: {
    alignItems: 'center',
    padding: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
})
