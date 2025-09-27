import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
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
  image?: string;
};

export default function SetupScreen() {
  const { id } = useLocalSearchParams();
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizName, setQuizName] = useState('');
  const [teams, setTeams] = useState<string[]>(['Team 1', 'Team 2']);
  const [questions, setQuestions] = useState<Question[]>([
    {
      text: 'Example: What is 2 + 2?',
      answers: ['3', '4', '5', '6'],
      correctIndex: 1,
      points: 50,
      image: '',
    },
  ]);
  const [timePerQuestion, setTimePerQuestion] = useState('15');
  const router = useRouter();

  const addTeam = () => {
    if (teams.length < 4) setTeams([...teams, `Team ${teams.length + 1}`]);
  };

  const updateTeam = (idx: number, name: string) => {
    const updated = [...teams];
    updated[idx] = name;
    setTeams(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', answers: ['', ''], correctIndex: 0, points: 50, image: '' },
    ]);
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

  const updateQuestionImage = (qIdx: number, imageUrl: string) => {
    const updated = [...questions];
    updated[qIdx].image = imageUrl;
    setQuestions(updated);
  };

  // ✅ New function to pick a local image
  const pickLocalImage = async (qIdx: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) updateQuestionImage(qIdx, result.assets[0].uri);
  };

  const saveQuiz = async () => {
    const newQuiz = {
      id: quizId || Date.now().toString(), // 👈 reuse old id if editing
      name: quizName || "Untitled Quiz",
      teams: teams.map((t) => ({ name: t, points: 0 })),
      questions,
      timePerQuestion: parseInt(timePerQuestion) || 15,
    };

    const stored = await AsyncStorage.getItem("quizzes");
    let allQuizzes = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        allQuizzes = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        allQuizzes = [];
      }
    }

    // Remove old quiz with same id if editing
    const filtered = allQuizzes.filter((q: any) => q.id !== newQuiz.id);

    await AsyncStorage.setItem("quizzes", JSON.stringify([...filtered, newQuiz]));

    router.push(`/game?id=${newQuiz.id}`);
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].answers.length > 2) { // 👈 at least 2 answers required
      updated[qIdx].answers.splice(aIdx, 1);

      // adjust correctIndex if needed
      if (updated[qIdx].correctIndex === aIdx) {
        updated[qIdx].correctIndex = 0; // reset to first answer
      } else if (updated[qIdx].correctIndex > aIdx) {
        updated[qIdx].correctIndex--; // shift left
      }

      setQuestions(updated);
    }
  };

  useEffect(() => {
    const loadQuiz = async () => {
      if (!id) return; // not editing
      const stored = await AsyncStorage.getItem("quizzes");
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored);
        const allQuizzes = Array.isArray(parsed) ? parsed : [parsed];
        const existing = allQuizzes.find((q: any) => q.id === id);
        if (existing) {
          setQuizId(existing.id);
          setQuizName(existing.name);
          setTeams(existing.teams.map((t: any) => t.name));
          setQuestions(existing.questions);
          setTimePerQuestion(existing.timePerQuestion.toString());
        }
      } catch (e) {
        console.warn("Failed to parse stored quizzes", e);
      }
    };
    loadQuiz();
  }, [id]);

  const removeQuestion = (qIdx: number) => {
    const updated = [...questions];
    if (updated.length > 1) { // 👈 ensure at least 1 question remains
      updated.splice(qIdx, 1);
      setQuestions(updated);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Setup Quiz</Text>

      {/* Quiz Name */}
      <Text style={styles.section}>Quiz Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter quiz name"
        value={quizName}
        onChangeText={setQuizName}
      />

      {/* Teams */}
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

      {/* Questions */}
      <Text style={styles.section}>Questions</Text>
      {questions.map((q, qIdx) => (
        <View key={qIdx} style={styles.questionBox}>
          {/* Question input */}
          <TextInput
            style={styles.input}
            placeholder="Question"
            value={q.text}
            onChangeText={(val) => updateQuestionText(qIdx, val)}
          />

          {/* Image URL */}
          <TextInput
            style={styles.input}
            placeholder="Image URL (optional)"
            value={q.image?.startsWith('http') ? q.image : ''}
            onChangeText={(val) => updateQuestionImage(qIdx, val)}
          />

          {/* Pick local image */}
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => pickLocalImage(qIdx)}
          >
            <Text style={styles.buttonText}>Pick Local Image</Text>
          </TouchableOpacity>

          {/* Preview image */}
          {q.image ? (
            <Image
              source={{ uri: q.image }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}

          {/* Answers */}
          {q.answers.map((a, aIdx) => (
            <View
              key={aIdx}
              style={[
                styles.answerBox,
                q.correctIndex === aIdx && styles.correctAnswer,
              ]}
            >
              {/* Answer input */}
              <TextInput
                style={styles.answerInput}
                placeholder={`Answer ${aIdx + 1}`}
                value={a}
                onChangeText={(val) => updateAnswer(qIdx, aIdx, val)}
              />

              {/* Correct ✔ button */}
              <TouchableOpacity onPress={() => setCorrect(qIdx, aIdx)}>
                <Text style={styles.correctTag}>✔</Text>
              </TouchableOpacity>

              {/* Remove ✖ button (only if > 2 answers remain) */}
              {q.answers.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeAnswer(qIdx, aIdx)}
                >
                  <Text style={styles.removeText}>✖</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add Answer */}
          {q.answers.length < 4 && (
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => addAnswer(qIdx)}
            >
              <Text style={styles.buttonText}>+ Add Answer</Text>
            </TouchableOpacity>
          )}

          {/* Remove Question */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeQuestion(qIdx)}
          >
            <Text style={styles.removeText}>✖ Remove Question</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Question */}
      <TouchableOpacity style={styles.button} onPress={addQuestion}>
        <Text style={styles.buttonText}>+ Add Question</Text>
      </TouchableOpacity>

      {/* Time per Question */}
      <Text style={styles.section}>Time per Question (sec)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={timePerQuestion}
        onChangeText={setTimePerQuestion}
      />

      {/* Start Quiz */}
      <TouchableOpacity style={styles.startButton} onPress={saveQuiz}>
        <Text style={styles.startButtonText}>Start Quiz</Text>
      </TouchableOpacity>

      {/* Save & Go Back */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={async () => {
          await saveQuiz();
          router.push('/quizlist');
        }}
      >
        <Text style={styles.startButtonText}>Save & Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#092635' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#9EC8B9',
  },
  section: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#9EC8B9',
  },
  input: {
    borderWidth: 1,
    borderColor: '#5C8374',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    color: '#fff',
  },
  button: {
    backgroundColor: '#5C8374',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  smallButton: {
    backgroundColor: '#1B4242',
    padding: 6,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: { color: '#fff', fontSize: 16 },
  questionBox: {
    borderWidth: 1,
    borderColor: '#1B4242',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  answerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#5C8374',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  answerInput: { flex: 1, padding: 8, color: '#fff' },
  correctAnswer: { borderColor: '#9EC8B9', backgroundColor: '#1B4242' },
  correctTag: { color: '#9EC8B9', fontSize: 18, fontWeight: 'bold', marginLeft: 5 },
  startButton: {
    backgroundColor: '#5C8374',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  previewImage: { width: '100%', height: 150, marginVertical: 10, borderRadius: 8 },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  removeText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
