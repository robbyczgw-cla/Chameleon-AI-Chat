/**
 * Chameleon AI Chat - Mobile App
 * React Native Application Entry Point
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PaperProvider } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'

import { MainNavigator } from './src/navigation/MainNavigator'
import { initStorage } from './src/utils/storage-adapter'

// Initialize AsyncStorage adapter for shared code
initStorage()

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
