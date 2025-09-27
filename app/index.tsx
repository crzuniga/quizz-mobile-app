import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Quizzer</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('/quizlist')}
      >
        <Text style={styles.btnText}>Create / Start Quiz</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#092635',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 40,
    textAlign: 'center',
    color: '#9EC8B9',
  },
  btn: {
    padding: 16,
    backgroundColor: '#5C8374',
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  btnText: {
    color: '#092635',
    fontWeight: '700',
    fontSize: 18,
  },
});
