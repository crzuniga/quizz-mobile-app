import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Quiz = {
  id: string;
  name: string;
  teams: { name: string; points: number }[];
  questions: any[];
  timePerQuestion: number;
};

export default function QuizListScreen() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Load quizzes from AsyncStorage
  useEffect(() => {
    const loadQuizzes = async () => {
      const stored = await AsyncStorage.getItem('quizzes');
      if (stored) {
      const parsed = JSON.parse(stored);
      setQuizzes(Array.isArray(parsed) ? parsed : []);
    } else {
      setQuizzes([]);
    }
    };
    loadQuizzes();
  }, []);

  const handlePlay = (id: string) => {
    router.push(`/game?id=${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/setup?id=${id}`);
  };

  const handleNewQuiz = () => {
    router.push('/setup'); // no id = new quiz
  };

  const handleRemove = async (id: string) => {
    const filtered = quizzes.filter((q) => q.id !== id);
    setQuizzes(filtered);
    await AsyncStorage.setItem('quizzes', JSON.stringify(filtered));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quizzes</Text>

      {quizzes.length === 0 && <Text style={styles.emptyText}>No quizzes found. Create a new one!</Text>}

      {quizzes.map((q) => (
        <View key={q.id} style={styles.quizBox}>
          <Text style={styles.quizName}>{q.name}</Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.playBtn} onPress={() => handlePlay(q.id)}>
              <Text style={styles.btnText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(q.id)}>
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(q.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.newBtn} onPress={handleNewQuiz}>
        <Text style={styles.newBtnText}>+ New Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#092635',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#9EC8B9',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9EC8B9',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  quizBox: {
    backgroundColor: '#1B4242',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  quizName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9EC8B9',
    marginBottom: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15 
  },
  playBtn: {
    backgroundColor: '#5C8374',
    padding: 10,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#9EC8B9',
    padding: 10,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  btnText: {
    color: '#092635',
    fontSize: 16,
    fontWeight: '600',
  },
  newBtn: {
    backgroundColor: '#5C8374',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  newBtnText: {
    color: '#092635',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeBtn: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
