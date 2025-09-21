import { Stack } from 'expo-router';
import React from 'react';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="setup" options={{ title: 'Quiz Setup' }} />
      <Stack.Screen name="game" options={{ title: 'Quiz Game' }} />
    </Stack>
  );
}