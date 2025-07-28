import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import './nativewind-env.d.ts';

function App(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1">
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            E-Commerce Mobile
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-8">
            React Native application for iOS and Android
          </Text>

          <View className="space-y-4">
            <View className="bg-blue-50 p-4 rounded-lg">
              <Text className="text-lg font-semibold text-blue-900 mb-2">
                Cross-Platform
              </Text>
              <Text className="text-blue-700">
                Single codebase for both iOS and Android platforms
              </Text>
            </View>

            <View className="bg-green-50 p-4 rounded-lg">
              <Text className="text-lg font-semibold text-green-900 mb-2">
                Shared Logic
              </Text>
              <Text className="text-green-700">
                Shared types and API logic with web application
              </Text>
            </View>

            <View className="bg-purple-50 p-4 rounded-lg">
              <Text className="text-lg font-semibold text-purple-900 mb-2">
                Native Performance
              </Text>
              <Text className="text-purple-700">
                Optimized for mobile performance and user experience
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
