import { Asset } from 'expo-asset';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

import AnimatedPressable from '../components/AnimatedPressable';
import DashboardHeader from '../components/DashboardHeader';
import { askAiAssistant, type AiHistoryItem } from '../utils/aiService';

const SUGGESTIONS = [
  'С чего начать улучшение ресторана?',
  'Что делать, если показатели падают?',
  'Какие метрики важнее всего?',
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SuggestionHistoryItem = {
  id: string;
  question: string;
  answer: string;
  isTyping?: boolean;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const buildAiHistoryFromTurns = (turns: SuggestionHistoryItem[]): AiHistoryItem[] =>
  turns
    .flatMap((item) => {
      const parts: AiHistoryItem[] = [];
      const question = item.question.trim();
      const answer = item.answer.trim();
      if (question) parts.push({ role: 'user', text: question });
      if (answer) parts.push({ role: 'assistant', text: answer });
      return parts;
    })
    .slice(-10);

const toFriendlyAiError = (error: unknown): string => {
  const code = error instanceof Error ? error.message : 'unknown_error';

  if (code === 'ai_provider_not_configured') {
    return 'ИИ-ассистент временно не настроен на сервере. Попробуйте чуть позже.';
  }
  if (code === 'message_too_long') {
    return 'Сообщение слишком длинное. Отправьте вопрос короче.';
  }
  if (code === 'message_is_required') {
    return 'Введите вопрос, чтобы получить ответ.';
  }
  if (code === 'empty_reply') {
    return 'Не удалось получить ответ. Попробуйте переформулировать вопрос.';
  }
  if (code.startsWith('http_')) {
    return 'Сервер временно недоступен. Повторите попытку через минуту.';
  }
  if (code === 'Network request failed') {
    return 'Нет соединения с сервером. Проверьте интернет и повторите.';
  }
  return 'Не удалось получить ответ от AI. Попробуйте еще раз.';
};

export default function AIAssistantScreen() {
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');
  const [isAiBusy, setIsAiBusy] = useState(false);
  const [history, setHistory] = useState<SuggestionHistoryItem[]>([]);
  const [agentIconSvg, setAgentIconSvg] = useState('');
  const [voiceActiveIconSvg, setVoiceActiveIconSvg] = useState('');
  const [voiceInactiveIconSvg, setVoiceInactiveIconSvg] = useState('');
  const rotateAnim = useRef(new RNAnimated.Value(0)).current;
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  const isUnmountedRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const hasInput = input.trim().length > 0;
  const remainingSuggestions = useMemo(
    () => SUGGESTIONS.filter((item) => !history.some((entry) => entry.question === item)),
    [history]
  );
  const iconRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadSvgAsset = useCallback(async (assetModule: number) => {
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    if (!asset.localUri) return '';
    const response = await fetch(asset.localUri);
    return response.text();
  }, []);

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const [agentIcon, voiceActiveIcon, voiceInactiveIcon] = await Promise.all([
          loadSvgAsset(require('../../assets/images/Icon (1).svg')),
          loadSvgAsset(require('../../assets/images/Voice.svg')),
          loadSvgAsset(require('../../assets/images/Voice — копия.svg')),
        ]);

        setAgentIconSvg(agentIcon);
        setVoiceActiveIconSvg(voiceActiveIcon);
        setVoiceInactiveIconSvg(voiceInactiveIcon);
      } catch (error) {
        console.error('Ошибка загрузки ассетов AI-экрана:', error);
      }
    };

    loadIcons();
  }, [loadSvgAsset]);

  useEffect(() => {
    let rotateLoop: RNAnimated.CompositeAnimation | null = null;
    let pulseLoop: RNAnimated.CompositeAnimation | null = null;

    if (isAiBusy) {
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);

      rotateLoop = RNAnimated.loop(
        RNAnimated.timing(rotateAnim, {
          toValue: 1,
          duration: 7600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      pulseLoop = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(scaleAnim, {
            toValue: 1.16,
            duration: 620,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          RNAnimated.timing(scaleAnim, {
            toValue: 1,
            duration: 620,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      rotateLoop.start();
      pulseLoop.start();
    } else {
      rotateAnim.stopAnimation();
      scaleAnim.stopAnimation();
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
    }

    return () => {
      rotateLoop?.stop();
      pulseLoop?.stop();
    };
  }, [isAiBusy, rotateAnim, scaleAnim]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 30);

    return () => clearTimeout(timer);
  }, [history]);

  const typeAnswer = useCallback(async (messageId: string, fullAnswer: string) => {
    for (let index = 1; index <= fullAnswer.length; index += 1) {
      if (isUnmountedRef.current) return;

      setHistory((prev) =>
        prev.map((item) =>
          item.id === messageId ? { ...item, answer: fullAnswer.slice(0, index), isTyping: true } : item
        )
      );

      await wait(index % 18 === 0 ? 30 : 16);
    }
  }, []);

  const submitQuestion = useCallback(async (rawQuestion: string, clearInput: boolean) => {
    const question = rawQuestion.trim();
    if (!question || isAiBusy) return;

    const historySnapshot = history;
    const messageId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    setHistory((prev) => [
      ...prev,
      {
        id: messageId,
        question,
        answer: '',
        isTyping: true,
      },
    ]);
    if (clearInput) {
      setInput('');
    }
    setIsAiBusy(true);

    try {
      let fullAnswer = '';
      try {
        const result = await askAiAssistant(question, buildAiHistoryFromTurns(historySnapshot));
        fullAnswer = result.reply;
      } catch (error) {
        fullAnswer = toFriendlyAiError(error);
      }

      if (isUnmountedRef.current) return;
      await wait(220);
      if (isUnmountedRef.current) return;

      await typeAnswer(messageId, fullAnswer);
      if (isUnmountedRef.current) return;

      setHistory((prev) =>
        prev.map((item) =>
          item.id === messageId ? { ...item, answer: fullAnswer, isTyping: false } : item
        )
      );
    } finally {
      if (!isUnmountedRef.current) {
        setIsAiBusy(false);
      }
    }
  }, [history, isAiBusy, typeAnswer]);

  const handleSuggestionPress = useCallback(async (question: string) => {
    if (isAiBusy) return;
    await submitQuestion(question, false);
  }, [isAiBusy, submitQuestion]);

  const handleSendPress = useCallback(async () => {
    await submitQuestion(input, true);
  }, [input, submitQuestion]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <View style={styles.content}>
        <DashboardHeader
          navigation={navigation}
          onHeaderPress={() => {}}
          compact
          leftContent={
            <RNAnimated.View
              style={[
                styles.headerThinkingIconWrap,
                {
                  transform: [{ scale: scaleAnim }, { rotate: iconRotate }],
                },
              ]}
            >
              {agentIconSvg ? (
                <SvgXml xml={agentIconSvg} width={82} height={82} />
              ) : (
                <View style={styles.agentIconFallback} />
              )}
            </RNAnimated.View>
          }
        />

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {history.length === 0 ? (
            <View style={styles.welcomeBlock}>
              <Text style={styles.welcomeText}>Задайте любой вопрос о вашем бизнесе</Text>
              <Text style={styles.welcomeTitle}>Добро пожаловать в AI-агент Pelby</Text>
            </View>
          ) : null}

          {history.map((item) => (
            <View key={item.id} style={styles.chatItemBlock}>
              <View style={styles.chatQuestionRow}>
                <View style={styles.chatQuestionBubble}>
                  <Text style={styles.chatQuestionText}>{item.question}</Text>
                </View>
              </View>
              <View style={styles.chatAnswerRow}>
                <View style={styles.chatAnswerBubble}>
                  <Text style={styles.chatAnswerText}>{item.answer || (item.isTyping ? '...' : '')}</Text>
                </View>
              </View>
            </View>
          ))}

          {remainingSuggestions.length > 0 ? (
            <View style={styles.suggestionsBlock}>
              <Text style={styles.suggestionsTitle}>ПОДСКАЗКИ</Text>
              {remainingSuggestions.map((item) => (
                <AnimatedPressable
                  key={item}
                  style={styles.suggestionButton}
                  onPress={() => handleSuggestionPress(item)}
                  disabled={isAiBusy}
                >
                  <Text style={styles.suggestionButtonText}>{item}</Text>
                </AnimatedPressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Введите вопрос..."
            placeholderTextColor="#636A79"
            returnKeyType="done"
            onSubmitEditing={handleSendPress}
            editable={!isAiBusy}
          />
          <AnimatedPressable
            style={styles.sendButton}
            onPress={handleSendPress}
            disabled={!hasInput || isAiBusy}
          >
            {hasInput ? (
              voiceActiveIconSvg ? (
                <SvgXml xml={voiceActiveIconSvg} width={40} height={40} />
              ) : (
                <View style={styles.voiceFallbackActive} />
              )
            ) : voiceInactiveIconSvg ? (
              <SvgXml xml={voiceInactiveIconSvg} width={40} height={40} />
            ) : (
              <View style={styles.voiceFallbackInactive} />
            )}
          </AnimatedPressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  content: {
    flex: 1,
    paddingBottom: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 14,
  },
  headerThinkingIconWrap: {
    width: 82,
    height: 82,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  welcomeBlock: {
    marginTop: 0,
    marginBottom: 18,
  },
  agentIconFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#6E79F8',
  },
  welcomeText: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '300',
    color: '#31353F',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '400',
    color: '#0A0D14',
    maxWidth: 340,
  },
  suggestionsBlock: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  suggestionsTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: '#919191',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  suggestionButton: {
    alignSelf: 'flex-end',
    minHeight: 52,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopRightRadius: 2,
    backgroundColor: '#191BDF',
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginBottom: 10,
    maxWidth: '100%',
  },
  suggestionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '300',
  },
  chatItemBlock: {
    marginBottom: 14,
  },
  chatQuestionRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  chatQuestionBubble: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopRightRadius: 2,
    backgroundColor: 'rgba(25, 27, 223, 0.10)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  chatQuestionText: {
    color: '#191BDF',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '300',
  },
  chatAnswerRow: {
    width: '100%',
    alignItems: 'flex-start',
  },
  chatAnswerBubble: {
    backgroundColor: '#E5EBF0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '94%',
  },
  chatAnswerText: {
    color: '#20232D',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '300',
  },
  inputBar: {
    height: 64,
    width: SCREEN_WIDTH + 9,
    alignSelf: 'flex-start',
    marginLeft: -5,
    marginRight: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8DCE5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 0,
    marginBottom: 0,
    transform: [{ translateY: 3 }],
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 37 / 2,
    lineHeight: 47 / 2,
    fontWeight: '300',
    color: '#101420',
    paddingRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceFallbackActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#191BDF',
  },
  voiceFallbackInactive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CDD0D5',
  },
});
