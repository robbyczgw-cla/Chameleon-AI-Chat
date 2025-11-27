/**
 * Chat Screen
 * Main conversation interface
 */

import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput, Button } from 'react-native-paper'

export function ChatScreen({ route }: any) {
  const { chatId } = route.params
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState('')

  const handleSend = () => {
    if (!inputText.trim()) return

    // TODO: Implement using @chameleon/shared API
    const newMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
    }

    setMessages([...messages, newMessage])
    setInputText('')

    // TODO: Call OpenRouter API and stream response
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Start a conversation!</Text>
          </View>
        }
      />
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          style={styles.input}
          multiline
          maxLength={2000}
        />
        <Button
          mode="contained"
          onPress={handleSend}
          style={styles.sendButton}
          disabled={!inputText.trim()}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6366f1',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
})
