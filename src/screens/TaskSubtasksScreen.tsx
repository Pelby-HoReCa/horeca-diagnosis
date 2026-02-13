import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import { Task } from '../utils/recommendationEngine';
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey } from '../utils/userDataStorage';
import { palette, spacing } from '../styles/theme';

export default function TaskSubtasksScreen({ route, navigation }: { route?: any; navigation?: any }) {
  const task: Task | undefined = route?.params?.task;
  const [taskCheckboxEmptySvg, setTaskCheckboxEmptySvg] = useState<string>('');
  const [taskCheckboxCheckedSvg, setTaskCheckboxCheckedSvg] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [showSubtaskEditor, setShowSubtaskEditor] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState('');

  const getTaskKey = (inputTask?: Task) => {
    const baseId = (inputTask as any)?.id || inputTask?.title || 'task';
    const blockId = (inputTask as any)?.blockId || inputTask?.blockId || 'block';
    return `${baseId}__${blockId}`;
  };

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const empty = Asset.fromModule(require('../../assets/images/select-box-blank-circle-line (1).svg'));
        const checked = Asset.fromModule(require('../../assets/images/checkbox-checked.svg'));
        await empty.downloadAsync();
        await checked.downloadAsync();
        if (empty.localUri) {
          const response = await fetch(empty.localUri);
          setTaskCheckboxEmptySvg(await response.text());
        }
        if (checked.localUri) {
          const response = await fetch(checked.localUri);
          setTaskCheckboxCheckedSvg(await response.text());
        }
      } catch (error) {
        console.log('Ошибка загрузки иконок подзадач:', error);
      }
    };
    loadIcons();
  }, []);

  const loadSubtasks = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      const venueId = await getSelectedVenueId(userId);
      const subtasksKey = getVenueScopedKey('actionPlanSubtasks', userId, venueId);
      const subtasksJson = await AsyncStorage.getItem(subtasksKey);
      const subtasksParsed = subtasksJson ? JSON.parse(subtasksJson) : {};
      const list = subtasksParsed?.[getTaskKey(task)] || [];
      setSubtasks(list);
    } catch (error) {
      console.log('Ошибка загрузки подзадач:', error);
    }
  }, [task]);

  useFocusEffect(
    useCallback(() => {
      loadSubtasks();
    }, [loadSubtasks])
  );

  const saveSubtasks = async (nextList: Array<{ id: string; title: string; completed: boolean }>) => {
    const userId = await getCurrentUserId();
    const venueId = await getSelectedVenueId(userId);
    const subtasksKey = getVenueScopedKey('actionPlanSubtasks', userId, venueId);
    const existingJson = await AsyncStorage.getItem(subtasksKey);
    const existing = existingJson ? JSON.parse(existingJson) : {};
    const next = { ...existing, [getTaskKey(task)]: nextList };
    await AsyncStorage.setItem(subtasksKey, JSON.stringify(next));
    setSubtasks(nextList);
  };

  const addSubtask = async () => {
    const title = subtaskDraft.trim();
    if (!title) return;
    const newItem = { id: `subtask_${Date.now()}`, title, completed: false };
    await saveSubtasks([...(subtasks || []), newItem]);
    setSubtaskDraft('');
  };

  const toggleSubtask = async (subtaskId: string) => {
    const nextList = (subtasks || []).map((item) =>
      item.id === subtaskId ? { ...item, completed: !item.completed } : item
    );
    await saveSubtasks(nextList);
  };

  const deleteSubtask = async (subtaskId: string) => {
    const nextList = (subtasks || []).filter((item) => item.id !== subtaskId);
    await saveSubtasks(nextList);
  };

  const taskTitle = task?.title || task?.description || 'Подзадачи';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0A0D14" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мои подзадачи</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.taskTitle}>{taskTitle}</Text>

        {subtasks.length === 0 ? (
          <View style={styles.subtaskEmptyState}>
            <Text style={styles.subtaskEmptyTitle}>У вас пока нет подзадач</Text>
            <Text style={styles.subtaskEmptyText}>
              Добавьте первую, чтобы начать работу над улучшением блока.
            </Text>
          </View>
        ) : (
          <View style={styles.subtasksList}>
            {subtasks.map((subtask) => (
              <View key={subtask.id} style={styles.subtaskRow}>
                <TouchableOpacity
                  style={styles.subtaskCheckbox}
                  onPress={() => toggleSubtask(subtask.id)}
                >
                  {subtask.completed ? (
                    taskCheckboxCheckedSvg ? (
                      <SvgXml xml={taskCheckboxCheckedSvg} width={20} height={20} />
                    ) : (
                      <View style={styles.taskCheckboxFallbackActive} />
                    )
                  ) : taskCheckboxEmptySvg ? (
                    <SvgXml xml={taskCheckboxEmptySvg} width={20} height={20} />
                  ) : (
                    <View style={styles.taskCheckboxFallback} />
                  )}
                </TouchableOpacity>
                <Text style={[styles.subtaskText, subtask.completed && styles.subtaskTextCompleted]}>
                  {subtask.title}
                </Text>
                <TouchableOpacity style={styles.subtaskDelete} onPress={() => deleteSubtask(subtask.id)}>
                  <Ionicons name="trash-outline" size={18} color="#DF1C41" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <AnimatedPressable
          style={styles.addSubtaskButton}
          onPress={() => {
            setSubtaskDraft('');
            setShowSubtaskEditor(true);
          }}
        >
          <Text style={styles.addSubtaskButtonText}>+ Добавить подзадачу</Text>
        </AnimatedPressable>
      </ScrollView>

      <Modal
        visible={showSubtaskEditor}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubtaskEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subtaskEditorContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Добавьте подзадачу</Text>
              <TouchableOpacity
                onPress={() => setShowSubtaskEditor(false)}
                style={styles.modalCloseButton}
              >
                <Text style={{ fontSize: 18, color: '#525866' }}>×</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.subtaskInput}
              placeholder="Опишите подзадачу..."
              value={subtaskDraft}
              onChangeText={setSubtaskDraft}
              multiline
            />
            <AnimatedPressable
              style={styles.subtaskSaveButton}
              onPress={async () => {
                await addSubtask();
                setShowSubtaskEditor(false);
              }}
            >
              <Text style={styles.subtaskSaveButtonText}>Добавить</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
  },
  headerRight: {
    width: 32,
    height: 32,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
    marginBottom: spacing.md,
  },
  subtaskEmptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  subtaskEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
    marginBottom: 6,
  },
  subtaskEmptyText: {
    fontSize: 14,
    color: '#525866',
    textAlign: 'center',
  },
  subtasksList: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  subtaskCheckbox: {
    marginRight: 10,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#0A0D14',
  },
  subtaskTextCompleted: {
    color: '#868C98',
  },
  subtaskDelete: {
    paddingLeft: 6,
  },
  addSubtaskButton: {
    marginTop: 14,
    alignSelf: 'center',
  },
  addSubtaskButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#191BDF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtaskEditorContent: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  subtaskSaveButton: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#191BDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  taskCheckboxFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#868C98',
  },
  taskCheckboxFallbackActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#38C793',
  },
});
