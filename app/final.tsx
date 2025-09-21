import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Team = {
  name: string;
  points: number;
};

export default function FinalScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadResults = async () => {
      try {
        const stored = await AsyncStorage.getItem('results');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.teams) {
            setTeams(parsed.teams);
          }
        }
      } catch (e) {
        console.error('Failed to load results', e);
      }
    };
    loadResults();
  }, []);

  if (teams.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No results found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
          <Text style={styles.buttonText}>Back to Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const maxPoints = Math.max(...teams.map(t => t.points));
  const winners = teams.filter(t => t.points === maxPoints);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏆 Final Results 🏆</Text>

      {winners.length > 1 ? (
        <Text style={styles.winnerText}>It's a tie between:</Text>
      ) : (
        <Text style={styles.winnerText}>Winner:</Text>
      )}

      {winners.map((w, idx) => (
        <Text key={idx} style={styles.winnerName}>
          {w.name} ({w.points} pts)
        </Text>
      ))}

      <Text style={styles.subtitle}>All Teams</Text>
      {teams.map((t, idx) => (
        <View
          key={idx}
          style={[
            styles.teamBox,
            t.points === maxPoints && styles.winnerBox
          ]}
        >
          <Text style={styles.teamText}>
            {t.name} — {t.points} pts
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/')}
      >
        <Text style={styles.buttonText}>Restart Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  winnerText: {
    fontSize: 20,
    marginBottom: 5,
  },
  winnerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 10,
  },
  teamBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 5,
    width: '80%',
    alignItems: 'center',
  },
  winnerBox: {
    backgroundColor: '#d4f7d4',
    borderColor: 'green',
  },
  teamText: {
    fontSize: 18,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },
});
