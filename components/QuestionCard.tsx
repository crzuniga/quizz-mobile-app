import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';

interface QuestionCardProps {
  questionText: string;
  responses: string[];
  onSelect: (index: number) => void;
  statusArray: ('neutral' | 'correct' | 'wrong')[];
}

export default function QuestionCard({ questionText, responses, onSelect, statusArray }: QuestionCardProps) {
  return (
    <View style={{ padding: 16, borderRadius: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}>{questionText}</Text>
      {responses.map((r, idx) => (
        <TouchableOpacity
          key={idx}
          style={{
            padding: 12,
            marginVertical: 6,
            backgroundColor: COLORS[statusArray[idx]],
            borderRadius: 8,
            opacity: statusArray[idx] !== 'neutral' ? 0.7 : 1,
          }}
          disabled={statusArray[idx] !== 'neutral'}
          onPress={() => onSelect(idx)}
        >
          <Text style={{ fontSize: 18 }}>{r}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  responses: {
    width: '100%',
  },
  btn: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 18,
  },
});