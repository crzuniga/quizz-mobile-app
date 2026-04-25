import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
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

const TEAM_COLORS = ['#C0392B', '#2980B9', '#27AE60', '#E67E22', '#8E44AD', '#16A085'];

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
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const [pendingAward, setPendingAward] = useState<number | null>(null);

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
      handleTimerExpired();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, showCorrect]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleTimerExpired = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isRoyale) {
      // Time's up — reveal correct answer, no points awarded
      setShowCorrect(true);
      setTimeLeft(0);
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

  const handleRoyaleAnswer = (index: number) => {
    if (wrongAnswers.includes(index) || showCorrect) return;

    if (index === currentQuestion.correctIndex) {
      setSelectedAnswer(index);
      setShowCorrect(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      setPendingAward(currentQuestion.points || 50);
    } else {
      setWrongAnswers(prev => [...prev, index]);
    }
  };

  const handleClassicAnswer = (index: number) => {
    if (selectedAnswer !== null || showCorrect) return;
    setSelectedAnswer(index);
    setUsedTeams(prev => [...prev, currentTeamIndex]);

    const correct = index === currentQuestion.correctIndex;
    if (correct) {
      const updatedTeams = [...teams];
      updatedTeams[currentTeamIndex].points += currentQuestion.points || 50;
      setTeams(updatedTeams);
      setShowCorrect(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setTimeout(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
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
      }, 1500);
    }
  };

  const awardPointsToTeam = (teamIndex: number) => {
    const updatedTeams = [...teams];
    updatedTeams[teamIndex].points += pendingAward!;
    setTeams(updatedTeams);
    setPendingAward(null);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentTeamIndex(0);
      setSelectedAnswer(null);
      setShowCorrect(false);
      setUsedTeams([]);
      setTimeLeft(timePerQuestion);
      setWrongAnswers([]);
      setPendingAward(null);
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

  const imageEl = currentQuestion.image ? (
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
  ) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isRoyale ? (
        <Text style={styles.modeBadge}>BATTLE ROYALE</Text>
      ) : (
        <Text style={styles.title}>Team Turn: {teams[currentTeamIndex]?.name}</Text>
      )}

      <Text style={styles.timer}>⏱ {timeLeft}s</Text>
      <Text style={styles.question}>{currentQuestion.text}</Text>
      {imageEl}

      <View style={styles.answersContainer}>
        {currentQuestion.answers.map((answer, idx) => {
          let bg = '#1B4242';

          if (isRoyale) {
            if (wrongAnswers.includes(idx)) bg = '#7B2020';
            if (showCorrect && idx === currentQuestion.correctIndex) bg = '#5C8374';
          } else {
            if (showCorrect) {
              if (idx === currentQuestion.correctIndex) bg = '#5C8374';
              else if (idx === selectedAnswer) bg = '#7B2020';
            } else if (idx === selectedAnswer) bg = '#7B2020';
          }

          const isDisabled = isRoyale
            ? wrongAnswers.includes(idx) || showCorrect
            : selectedAnswer !== null || showCorrect;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.answerBtn,
                { backgroundColor: bg },
                isLandscape && styles.answerBtnLandscape,
              ]}
              onPress={() => isRoyale ? handleRoyaleAnswer(idx) : handleClassicAnswer(idx)}
              disabled={isDisabled}
            >
              <Text style={styles.answerText}>{answer}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showCorrect && pendingAward === null && (
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

      {/* Team picker modal — shown after correct answer in Royale */}
      <Modal transparent animationType="fade" visible={pendingAward !== null}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Who answered correctly?</Text>
            <Text style={styles.modalSubtitle}>+{pendingAward} pts</Text>
            {teams.map((team, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.teamPickerBtn, { backgroundColor: TEAM_COLORS[idx % TEAM_COLORS.length] }]}
                onPress={() => awardPointsToTeam(idx)}
              >
                <Text style={styles.teamPickerText}>{team.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
    fontSize: 13,
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
  answersContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  answerBtn: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5C8374',
    marginVertical: 8,
  },
  answerBtnLandscape: {
    width: '48%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#1B4242',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#9EC8B9',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#5C8374',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  teamPickerBtn: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  teamPickerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
