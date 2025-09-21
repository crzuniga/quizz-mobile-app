import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Quizzer</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/setup')}>
        <Text style={styles.btnText}>Create / Start Quiz</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 40, textAlign: 'center' },
  btn: { padding: 16, backgroundColor: '#007aff', borderRadius: 10 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 18 },
});