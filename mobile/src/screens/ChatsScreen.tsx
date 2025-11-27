/**
 * Chats List Screen
 * Shows all conversations (similar to chat-sidebar on web)
 */

import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { Card, FAB } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

export function ChatsScreen({ navigation }: any) {
  // TODO: Load chats from storage using @chameleon/shared
  const chats = [
    { id: '1', title: 'Welcome Chat', updatedAt: Date.now(), messages: [] },
  ]

  const handleNewChat = () => {
    navigation.navigate('Chat', { chatId: 'new' })
  }

  const handleChatPress = (chatId: string) => {
    navigation.navigate('Chat', { chatId })
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleChatPress(item.id)}>
            <Card style={styles.chatCard}>
              <Card.Content>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatTitle}>{item.title}</Text>
                  <Icon name="chevron-right" size={20} color="#9ca3af" />
                </View>
                <Text style={styles.chatTime}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="chat-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>Tap + to start a new conversation</Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleNewChat}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  chatCard: {
    margin: 8,
    marginBottom: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chatTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
})
