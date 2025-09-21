import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Question = {
  text: string;
  answers: string[];
  correctIndex: number;
  points?: number;
};

export default function SetupScreen() {
  const [teams, setTeams] = useState<string[]>(['Team 1', 'Team 2']);
  const [questions, setQuestions] = useState<Question[]>([
    {
      text: 'Example: What is 2 + 2?',
      answers: ['3', '4', '5', '6'],
      correctIndex: 1,
      points: 50,
    },
  ]);
  const [timePerQuestion, setTimePerQuestion] = useState('15');
  const router = useRouter();

  const addTeam = () => {
    if (teams.length < 4) {
      setTeams([...teams, `Team ${teams.length + 1}`]);
    }
  };

  const updateTeam = (idx: number, name: string) => {
    const updated = [...teams];
    updated[idx] = name;
    setTeams(updated);
  };

  const addQuestion = () => {
    if (questions.length < 4) {
      setQuestions([
        ...questions,
        { text: '', answers: ['', ''], correctIndex: 0, points: 50 },
      ]);
    }
  };

  const updateQuestionText = (qIdx: number, text: string) => {
    const updated = [...questions];
    updated[qIdx].text = text;
    setQuestions(updated);
  };

  const updateAnswer = (qIdx: number, aIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].answers[aIdx] = value;
    setQuestions(updated);
  };

  const addAnswer = (qIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].answers.length < 4) {
      updated[qIdx].answers.push('');
      setQuestions(updated);
    }
  };

  const setCorrect = (qIdx: number, aIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correctIndex = aIdx;
    setQuestions(updated);
  };

  const saveQuiz = async () => {
    const quizData = {
      teams: teams.map((t) => ({ name: t, points: 0 })),
      questions,
      timePerQuestion: parseInt(timePerQuestion) || 15,
    };

    await AsyncStorage.setItem('quizData', JSON.stringify(quizData));
    console.log('Saved quizData:', quizData);
    router.push('/game');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Setup Quiz</Text>

      <Text style={styles.section}>Teams</Text>
      {teams.map((t, idx) => (
        <TextInput
          key={idx}
          style={styles.input}
          value={t}
          onChangeText={(val) => updateTeam(idx, val)}
        />
      ))}
      {teams.length < 4 && (
        <TouchableOpacity style={styles.button} onPress={addTeam}>
          <Text style={styles.buttonText}>+ Add Team</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.section}>Questions</Text>
      {questions.map((q, qIdx) => (
        <View key={qIdx} style={styles.questionBox}>
          <TextInput
            style={styles.input}
            placeholder="Question"
            value={q.text}
            onChangeText={(val) => updateQuestionText(qIdx, val)}
          />

          {q.answers.map((a, aIdx) => (
            <TouchableOpacity
              key={aIdx}
              style={[
                styles.answerBox,
                q.correctIndex === aIdx && styles.correctAnswer,
              ]}
              onPress={() => setCorrect(qIdx, aIdx)}
            >
              <TextInput
                style={styles.answerInput}
                placeholder={`Answer ${aIdx + 1}`}
                value={a}
                onChangeText={(val) => updateAnswer(qIdx, aIdx, val)}
              />
              {q.correctIndex === aIdx && (
                <Text style={styles.correctTag}>✔</Text>
              )}
            </TouchableOpacity>
          ))}

          {q.answers.length < 4 && (
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => addAnswer(qIdx)}
            >
              <Text style={styles.buttonText}>+ Add Answer</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {questions.length < 4 && (
        <TouchableOpacity style={styles.button} onPress={addQuestion}>
          <Text style={styles.buttonText}>+ Add Question</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.section}>Time per Question (sec)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={timePerQuestion}
        onChangeText={setTimePerQuestion}
      />

      <TouchableOpacity style={styles.startButton} onPress={saveQuiz}>
        <Text style={styles.startButtonText}>Start Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  section: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  smallButton: {
    backgroundColor: '#6c63ff',
    padding: 6,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  questionBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  answerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  answerInput: {
    flex: 1,
    padding: 8,
  },
  correctAnswer: {
    borderColor: 'green',
    backgroundColor: '#e6ffe6',
  },
  correctTag: {
    color: 'green',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  startButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
