import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Question = {
  text: string;
  answers: string[];
  correctIndex: number;
  points?: number;
};

type Team = {
  name: string;
  points: number;
};

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Load quiz setup
  useEffect(() => {
    const loadQuiz = async () => {
      const stored = await AsyncStorage.getItem("quizData");
      if (stored) {
        const parsed = JSON.parse(stored);
        setTeams(parsed.teams.map((t: any) => ({ ...t, points: 0 })));
        setQuestions(parsed.questions);
        setTimePerQuestion(parsed.timePerQuestion || 15);
        setTimeLeft(parsed.timePerQuestion || 15);
      }
    };
    loadQuiz();
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (showCorrect) return;

    if (timeLeft <= 0) {
      handleWrongAnswer(); // timeout acts like a wrong answer
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, showCorrect]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || showCorrect) return;

    setSelectedAnswer(index);
    setUsedTeams((prev) => [...prev, currentTeamIndex]);

    const correct = index === currentQuestion.correctIndex;

    if (correct) {
      // ✅ correct
      const updatedTeams = [...teams];
      updatedTeams[currentTeamIndex].points += currentQuestion.points || 50;
      setTeams(updatedTeams);
      setShowCorrect(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      // ❌ wrong
      setTimeout(() => {
        handleWrongAnswer();
      }, 1500);
    }
  };

  const handleWrongAnswer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // mark current team as having used their chance (even if time expired)
    setUsedTeams((prev) => [...prev, currentTeamIndex]);

    const nextTeamIndex = teams.findIndex(
      (_, idx) => !usedTeams.includes(idx) && idx !== currentTeamIndex
    );

    if (nextTeamIndex !== -1) {
      // Another team still has a chance
      setTimeout(() => {
        setCurrentTeamIndex(nextTeamIndex);
        setSelectedAnswer(null);
        setTimeLeft(timePerQuestion);
      }, 500);
    } else {
      // 🚨 No teams left → reveal correct answer
      setShowCorrect(true);
      setTimeLeft(0);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentTeamIndex(0); // restart from team 1
      setSelectedAnswer(null);
      setShowCorrect(false);
      setUsedTeams([]);
      setTimeLeft(timePerQuestion);
    } else {
      saveResultsAndFinish();
    }
  };

  const saveResultsAndFinish = async () => {
    await AsyncStorage.setItem("results", JSON.stringify({ teams }));
    router.push("/final");
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading quiz...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Team Turn: {teams[currentTeamIndex]?.name}
      </Text>
      <Text style={styles.timer}>⏱ {timeLeft}s</Text>

      <Text style={styles.question}>{currentQuestion.text}</Text>

      <View style={styles.answers}>
        {currentQuestion.answers.map((answer, idx) => {
          let bg = "#eee";

          if (showCorrect) {
            // ✅ show correct answer only at the end
            if (idx === currentQuestion.correctIndex) {
              bg = "green";
            } else if (idx === selectedAnswer) {
              bg = "red";
            }
          } else if (idx === selectedAnswer) {
            // ❌ mark only the chosen option as red during the turn
            bg = "red";
          }

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.answerBtn, { backgroundColor: bg }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  timer: {
    fontSize: 20,
    color: "red",
    marginBottom: 20,
  },
  question: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  answers: {
    marginTop: 10,
    marginBottom: 20,
  },
  answerBtn: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 8,
  },
  answerText: {
    fontSize: 18,
    textAlign: "center",
  },
  nextBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  nextText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  scoreboardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  scoreText: {
    fontSize: 18,
  },
});
