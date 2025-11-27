/**
 * Settings Screen
 * App configuration
 */

import React, { useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { List, TextInput, Divider } from 'react-native-paper'

export function SettingsScreen() {
  const [apiKey, setApiKey] = useState('')

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>API Keys</List.Subheader>
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            label="OpenRouter API Key"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            placeholder="sk-or-v1-..."
          />
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Model Settings</List.Subheader>
        <List.Item
          title="Selected Model"
          description="x-ai/grok-4.1-fast"
          left={props => <List.Icon {...props} icon="robot" />}
          onPress={() => {}}
        />
        <List.Item
          title="Temperature"
          description="0.7"
          left={props => <List.Icon {...props} icon="thermometer" />}
          onPress={() => {}}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="0.1.0 (Alpha)"
          left={props => <List.Icon {...props} icon="information" />}
        />
      </List.Section>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
})
