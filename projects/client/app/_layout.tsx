import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="parent-login" />
      <Stack.Screen name="parent-dashboard" />
    </Stack>
  );
}
