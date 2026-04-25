import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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

type Team = {
  name: string;
  points: number;
};

const BUZZ_COLORS = ['#C0392B', '#2980B9', '#27AE60', '#E67E22', '#8E44AD', '#16A085'];

export default function GameScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState(15);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [usedTeams, setUsedTeams] = useState<number[]>([]);

  // Royale-specific state
  const [buzzedTeam, setBuzzedTeam] = useState<number | null>(null);
  const [usedBuzzTeams, setUsedBuzzTeams] = useState<number[]>([]);

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const isLandscape = screenWidth > screenHeight;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const route = useRoute();

  const mode = (route.params as any)?.mode ?? 'classic';
  const isRoyale = mode === 'royale';

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const loadQuiz = async (quizId: string) => {
      const stored = await AsyncStorage.getItem('quizzes');
      if (stored) {
        const parsed = JSON.parse(stored);
        const allQuizzes = Array.isArray(parsed) ? parsed : [parsed];
        const quiz = allQuizzes.find((q: any) => q.id === quizId);
        if (quiz) {
          setTeams(quiz.teams.map((t: any) => ({ ...t, points: 0 })));
          setQuestions(quiz.questions);
          setTimePerQuestion(quiz.timePerQuestion || 15);
          setTimeLeft(quiz.timePerQuestion || 15);
        }
      }
    };
    const quizId = (route.params as any)?.id;
    if (quizId) loadQuiz(quizId);
  }, []);

  useEffect(() => {
    if (showCorrect) return;
    if (timeLeft <= 0) {
      handleWrongAnswer();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, showCorrect]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleBuzzIn = (teamIndex: number) => {
    setBuzzedTeam(teamIndex);
    setCurrentTeamIndex(teamIndex);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || showCorrect) return;
    setSelectedAnswer(index);

    if (!isRoyale) {
      setUsedTeams(prev => [...prev, currentTeamIndex]);
    }

    const correct = index === currentQuestion.correctIndex;
    if (correct) {
      const updatedTeams = [...teams];
      updatedTeams[currentTeamIndex].points += currentQuestion.points || 50;
      setTeams(updatedTeams);
      setShowCorrect(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setTimeout(() => handleWrongAnswer(), 1500);
    }
  };

  const handleWrongAnswer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isRoyale) {
      const currentBuzzed = buzzedTeam;

      if (currentBuzzed === null) {
        // Timer expired with nobody buzzing in
        setShowCorrect(true);
        setTimeLeft(0);
        return;
      }

      const newUsedBuzz = [...usedBuzzTeams, currentBuzzed];
      const hasRemaining = teams.some((_, idx) => !newUsedBuzz.includes(idx));

      if (hasRemaining) {
        setTimeout(() => {
          setUsedBuzzTeams(newUsedBuzz);
          setBuzzedTeam(null);
          setSelectedAnswer(null);
        }, 1500);
      } else {
        setUsedBuzzTeams(newUsedBuzz);
        setShowCorrect(true);
        setTimeLeft(0);
      }
    } else {
      const nextTeamIndex = teams.findIndex(
        (_, idx) => !usedTeams.includes(idx) && idx !== currentTeamIndex
      );

      if (nextTeamIndex !== -1) {
        setTimeout(() => {
          setCurrentTeamIndex(nextTeamIndex);
          setSelectedAnswer(null);
          setTimeLeft(timePerQuestion);
        }, 500);
      } else {
        setShowCorrect(true);
        setTimeLeft(0);
      }
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentTeamIndex(0);
      setSelectedAnswer(null);
      setShowCorrect(false);
      setUsedTeams([]);
      setTimeLeft(timePerQuestion);
      setBuzzedTeam(null);
      setUsedBuzzTeams([]);
    } else {
      saveResultsAndFinish();
    }
  };

  const saveResultsAndFinish = async () => {
    await AsyncStorage.setItem('results', JSON.stringify({ teams }));
    router.push('/final');
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading quiz...</Text>
      </View>
    );
  }

  // --- Royale: buzz-in phase ---
  if (isRoyale && buzzedTeam === null && !showCorrect) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.modeBadge}>BATTLE ROYALE</Text>

        <Text style={styles.timer}>⏱ {timeLeft}s</Text>

        <Text style={styles.question}>{currentQuestion.text}</Text>

        {currentQuestion.image ? (
          <Image
            source={{ uri: currentQuestion.image }}
            style={{
              width: screenWidth - 40,
              height: isLandscape ? Math.min(screenHeight * 0.6, 300) : 180,
              borderRadius: 10,
              marginBottom: 20,
            }}
            resizeMode="contain"
          />
        ) : null}

        <Text style={styles.buzzPrompt}>BUZZ IN!</Text>

        <View style={styles.buzzGrid}>
          {teams.map((team, idx) => {
            const eliminated = usedBuzzTeams.includes(idx);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.buzzBtn,
                  { backgroundColor: eliminated ? '#444' : BUZZ_COLORS[idx % BUZZ_COLORS.length] },
                ]}
                onPress={() => handleBuzzIn(idx)}
                disabled={eliminated}
              >
                <Text style={styles.buzzBtnText}>{team.name}</Text>
                {eliminated && <Text style={styles.buzzElimText}>✗</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.scoreboardTitle}>Scoreboard</Text>
        {teams.map((t, idx) => (
          <Text key={idx} style={styles.scoreText}>
            {t.name}: {t.points} pts
          </Text>
        ))}
      </ScrollView>
    );
  }

  // --- Royale: answer phase / Classic: answer phase / showCorrect ---
  const headerLabel = isRoyale
    ? buzzedTeam !== null
      ? `${teams[buzzedTeam]?.name} buzzed in!`
      : 'Revealing answer...'
    : `Team Turn: ${teams[currentTeamIndex]?.name}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isRoyale && <Text style={styles.modeBadge}>BATTLE ROYALE</Text>}

      <Text style={styles.title}>{headerLabel}</Text>

      <Text style={styles.timer}>⏱ {timeLeft}s</Text>

      <Text style={styles.question}>{currentQuestion.text}</Text>

      {currentQuestion.image ? (
        <Image
          source={{ uri: currentQuestion.image }}
          style={{
            width: screenWidth - 40,
            height: isLandscape ? Math.min(screenHeight * 0.6, 300) : 180,
            borderRadius: 10,
            marginBottom: 20,
          }}
          resizeMode="contain"
        />
      ) : null}

      <View
        style={{
          flexDirection: isLandscape ? 'row' : 'column',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {currentQuestion.answers.map((answer, idx) => {
          let bg = '#1B4242';
          if (showCorrect) {
            if (idx === currentQuestion.correctIndex) bg = '#5C8374';
            else if (idx === selectedAnswer) bg = 'red';
          } else if (idx === selectedAnswer) bg = 'red';

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.answerBtn, { backgroundColor: bg, flex: isLandscape ? 0.45 : 1 }]}
              onPress={() => handleAnswer(idx)}
              disabled={selectedAnswer !== null || showCorrect}
            >
              <Text style={styles.answerText}>{answer}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showCorrect && (
        <TouchableOpacity style={styles.nextBtn} onPress={goToNextQuestion}>
          <Text style={styles.nextText}>Next Question ➡️</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.scoreboardTitle}>Scoreboard</Text>
      {teams.map((t, idx) => (
        <Text key={idx} style={styles.scoreText}>
          {t.name}: {t.points} pts
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#092635',
    flexGrow: 1,
    alignItems: 'center',
  },
  modeBadge: {
    color: '#C39BD3',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#9EC8B9',
    textAlign: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
    marginVertical: 15,
  },
  question: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#9EC8B9',
  },
  buzzPrompt: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#C39BD3',
    letterSpacing: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  buzzGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  buzzBtn: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buzzBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buzzElimText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    marginTop: 4,
  },
  answerBtn: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5C8374',
    marginVertical: 8,
    marginHorizontal: 4,
  },
  answerText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#fff',
  },
  nextBtn: {
    backgroundColor: '#5C8374',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scoreboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#9EC8B9',
  },
  scoreText: {
    fontSize: 18,
    color: '#9EC8B9',
  },
});
