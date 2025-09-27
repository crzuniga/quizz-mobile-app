import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen name="quizlist" options={{ title: 'Quizzes', headerShown: false }} /> {/* new screen */}
      <Stack.Screen name="setup" options={{ title: 'Quiz Setup', headerShown: false }} />
      <Stack.Screen name="game" options={{ title: 'Quiz Game', headerShown: false }} />
      <Stack.Screen name="final" options={{ title: 'Results',headerShown: false }} />
    </Stack>
  );
}