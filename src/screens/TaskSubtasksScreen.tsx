import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import { Task } from '../utils/recommendationEngine';
import { getCurrentUserId, getSelectedVenueId, getVenueScopedKey } from '../utils/userDataStorage';
import { palette, spacing } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRIMARY_BUTTON_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const FRAME22_WIDTH = SCREEN_WIDTH - spacing.md * 2;

export default function TaskSubtasksScreen({ route, navigation }: { route?: any; navigation?: any }) {
  const insets = useSafeAreaInsets();
  const task: Task | undefined = route?.params?.task;
  const [taskCheckboxEmptySvg, setTaskCheckboxEmptySvg] = useState<string>('');
  const [taskCheckboxCheckedSvg, setTaskCheckboxCheckedSvg] = useState<string>('');
  const [emptyStateAvatarSvg, setEmptyStateAvatarSvg] = useState<string>('');
  const [backIconSvg, setBackIconSvg] = useState<string>('');
  const [menuIconSvg, setMenuIconSvg] = useState<string>('');
  const [modalCloseIconSvg, setModalCloseIconSvg] = useState<string>('');
  const [noteClearIconSvg, setNoteClearIconSvg] = useState<string>('');
  const [noteConfirmIconSvg, setNoteConfirmIconSvg] = useState<string>('');
  const [noteDeleteIconSvg, setNoteDeleteIconSvg] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [showSubtaskEditor, setShowSubtaskEditor] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const deletingSubtaskRef = useRef<string | null>(null);

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
        const emptyAvatar = Asset.fromModule(require('../../assets/images/Avatar [1.0] (2).svg'));
        const backIcon = Asset.fromModule(require('../../assets/images/Frame 8 (3).svg'));
        const menuIcon = Asset.fromModule(require('../../assets/images/Frame 9.svg'));
        const closeIconAsset = Asset.fromModule(require('../../assets/images/compact-button-icon.svg'));
        const clearAsset = Asset.fromModule(require('../../assets/images/Group 3362253.svg'));
        const confirmAsset = Asset.fromModule(require('../../assets/images/Checkbox [1.0] (2).svg'));
        const deleteAsset = Asset.fromModule(require('../../assets/images/delete-02.svg'));
        await empty.downloadAsync();
        await checked.downloadAsync();
        await emptyAvatar.downloadAsync();
        await backIcon.downloadAsync();
        await menuIcon.downloadAsync();
        await closeIconAsset.downloadAsync();
        await clearAsset.downloadAsync();
        await confirmAsset.downloadAsync();
        await deleteAsset.downloadAsync();
        if (empty.localUri) {
          const response = await fetch(empty.localUri);
          setTaskCheckboxEmptySvg(await response.text());
        }
        if (checked.localUri) {
          const response = await fetch(checked.localUri);
          setTaskCheckboxCheckedSvg(await response.text());
        }
        if (emptyAvatar.localUri) {
          const response = await fetch(emptyAvatar.localUri);
          setEmptyStateAvatarSvg(await response.text());
        }
        if (backIcon.localUri) {
          const response = await fetch(backIcon.localUri);
          setBackIconSvg(await response.text());
        }
        if (menuIcon.localUri) {
          const response = await fetch(menuIcon.localUri);
          setMenuIconSvg(await response.text());
        }
        if (closeIconAsset.localUri) {
          const response = await fetch(closeIconAsset.localUri);
          setModalCloseIconSvg(await response.text());
        }
        if (clearAsset.localUri) {
          const response = await fetch(clearAsset.localUri);
          setNoteClearIconSvg(await response.text());
        }
        if (confirmAsset.localUri) {
          const response = await fetch(confirmAsset.localUri);
          setNoteConfirmIconSvg(await response.text());
        }
        if (deleteAsset.localUri) {
          const response = await fetch(deleteAsset.localUri);
          setNoteDeleteIconSvg(await response.text());
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
      const rawList = subtasksParsed?.[getTaskKey(task)] || [];
      const normalizedList = Array.isArray(rawList)
        ? rawList
            .filter((item: any) => item && typeof item.title === 'string')
            .map((item: any, index: number) => ({
              id: item.id || `subtask_legacy_${Date.now()}_${index}`,
              title: item.title,
              completed: Boolean(item.completed),
            }))
        : [];
      setSubtasks(normalizedList);
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
    const normalizedList = (nextList || []).map((item, index) => ({
      id: item.id || `subtask_${Date.now()}_${index}`,
      title: item.title,
      completed: Boolean(item.completed),
    }));
    const next = { ...existing, [getTaskKey(task)]: normalizedList };
    await AsyncStorage.setItem(subtasksKey, JSON.stringify(next));
    setSubtasks(normalizedList);
  };

  const upsertSubtask = async () => {
    const title = subtaskDraft.trim();
    if (!title) return;
    if (editingSubtaskId) {
      const nextList = (subtasks || []).map((item) =>
        item.id === editingSubtaskId ? { ...item, title } : item
      );
      await saveSubtasks(nextList);
      setEditingSubtaskId(null);
    } else {
      const newItem = { id: `subtask_${Date.now()}`, title, completed: false };
      await saveSubtasks([...(subtasks || []), newItem]);
    }
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

  const renderDeleteAction = useCallback(
    () => (
      <View style={styles.noteDeleteActionWrap}>
        <View style={styles.noteDeleteAction}>
          {noteDeleteIconSvg ? <SvgXml xml={noteDeleteIconSvg} width={23} height={23} /> : null}
        </View>
      </View>
    ),
    [noteDeleteIconSvg]
  );

  const rawTaskTitle = task?.title || task?.description || '';
  const normalizedTaskTitle = rawTaskTitle.trim().toLowerCase();
  const shouldHideTaskTitle =
    normalizedTaskTitle === 'рекомендация' || normalizedTaskTitle === 'recommendation';
  const taskTitle = shouldHideTaskTitle ? '' : rawTaskTitle;
  const visibleSubtasks = Array.isArray(subtasks)
    ? subtasks.filter((item) => item && typeof item.title === 'string')
    : [];
  const showFixedHelpCard = true;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          {backIconSvg ? (
            <SvgXml xml={backIconSvg} width={24} height={24} />
          ) : (
            <Ionicons name="chevron-back" size={24} color="#0A0D14" />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мои подзадачи</Text>
        <TouchableOpacity style={styles.headerRight} activeOpacity={0.75}>
          {menuIconSvg ? (
            <SvgXml xml={menuIconSvg} width={24} height={24} />
          ) : (
            <Ionicons name="ellipsis-vertical" size={20} color="#868C98" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          visibleSubtasks.length === 0 ? styles.contentContainerEmpty : styles.contentContainerWithItems,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!!taskTitle && <Text style={styles.taskTitle}>{taskTitle}</Text>}

        {visibleSubtasks.length === 0 ? (
          <View style={styles.subtaskEmptyState}>
            {emptyStateAvatarSvg ? (
              <View style={styles.subtaskEmptyIcon}>
                <SvgXml xml={emptyStateAvatarSvg} width={55} height={55} />
              </View>
            ) : null}
            <Text style={styles.subtaskEmptyTitle}>У вас пока нет подзадач</Text>
            <Text style={styles.subtaskEmptyText}>
              Добавьте первую, чтобы начать работу над улучшением блока.
            </Text>
            <AnimatedPressable
              style={styles.addSubtaskButton}
              onPress={() => {
                setEditingSubtaskId(null);
                setSubtaskDraft('');
                setShowSubtaskEditor(true);
              }}
            >
              <View style={styles.addSubtaskButtonContent}>
                <Text style={styles.addSubtaskPlus}>+</Text>
                <Text style={styles.addSubtaskButtonText}>Добавить подзадачу</Text>
              </View>
            </AnimatedPressable>
          </View>
        ) : (
          <View style={styles.subtasksList}>
            {visibleSubtasks.map((subtask) => (
              <View key={subtask.id} style={styles.subtaskItem}>
                <Swipeable
                  renderRightActions={() => renderDeleteAction()}
                  rightThreshold={12}
                  friction={1}
                  overshootRight={false}
                  onSwipeableWillOpen={() => {
                    if (deletingSubtaskRef.current === subtask.id) return;
                    deletingSubtaskRef.current = subtask.id;
                    deleteSubtask(subtask.id).finally(() => {
                      deletingSubtaskRef.current = null;
                    });
                  }}
                >
                  <TouchableOpacity
                    style={styles.subtaskRow}
                    activeOpacity={0.85}
                    onPress={() => {
                      setEditingSubtaskId(subtask.id);
                      setSubtaskDraft(subtask.title);
                      setShowSubtaskEditor(true);
                    }}
                  >
                    <TouchableOpacity
                      style={styles.subtaskCheckbox}
                      onPress={() => toggleSubtask(subtask.id)}
                    >
                      {subtask.completed ? (
                        taskCheckboxCheckedSvg ? (
                          <SvgXml xml={taskCheckboxCheckedSvg} width={22} height={22} />
                        ) : (
                          <View style={styles.taskCheckboxFallbackActive} />
                        )
                      ) : taskCheckboxEmptySvg ? (
                        <SvgXml xml={taskCheckboxEmptySvg} width={22} height={22} />
                      ) : (
                        <View style={styles.taskCheckboxFallback} />
                      )}
                    </TouchableOpacity>
                    <Text style={[styles.subtaskText, subtask.completed && styles.subtaskTextCompleted]}>
                      {subtask.title}
                    </Text>
                  </TouchableOpacity>
                </Swipeable>
                <View style={styles.subtaskDivider} />
              </View>
            ))}
            <AnimatedPressable
              style={styles.addSubtaskInlineButton}
              onPress={() => {
                setEditingSubtaskId(null);
                setSubtaskDraft('');
                setShowSubtaskEditor(true);
              }}
            >
              <View style={styles.addSubtaskInlineContent}>
                <Text style={styles.addSubtaskInlinePlus}>+</Text>
                <Text style={styles.addSubtaskInlineText}>Добавить подзадачу</Text>
              </View>
            </AnimatedPressable>
          </View>
        )}

      </ScrollView>

      {showFixedHelpCard && (
        <View style={[styles.helpCardWrap, { bottom: Math.max(insets.bottom + 6, 20) }]}>
          <View style={styles.helpCardBackground}>
            <Image
              source={require('../../assets/images/Frame 22.png')}
              style={styles.helpCardImage}
              resizeMode="stretch"
            />
            <View style={styles.helpCardContent}>
              <Text style={styles.helpCardTitle}>Не знаете, какие шаги предпринять?</Text>
              <Text style={styles.helpCardSubtitle}>
                Мы поможем вам определить нужные задачи и подскажем, как их выполнить.
              </Text>
            </View>
            <AnimatedPressable
              style={styles.helpCardButton}
              onPress={() => navigation.navigate('Help')}
            >
              <Text style={styles.helpCardButtonText}>Получить помощь</Text>
            </AnimatedPressable>
          </View>
        </View>
      )}

      <Modal
        visible={showSubtaskEditor}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubtaskEditor(false)}
      >
        <View style={styles.noteEditOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowSubtaskEditor(false);
              setEditingSubtaskId(null);
              Keyboard.dismiss();
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.noteEditAvoider}
          >
            <View style={styles.noteEditCard}>
              <View style={[styles.noteHeaderEditing, { marginTop: 3, transform: [{ translateY: -10 }] }]}>
                <Text style={styles.noteTitleEditing}>Добавьте подзадачу</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowSubtaskEditor(false);
                    setEditingSubtaskId(null);
                    Keyboard.dismiss();
                  }}
                >
                  {modalCloseIconSvg ? <SvgXml xml={modalCloseIconSvg} width={22} height={22} /> : null}
                </TouchableOpacity>
              </View>

              <View style={[styles.noteInputContainer, styles.noteInputContainerEditing]}>
                <TextInput
                  style={styles.noteInputText}
                  value={subtaskDraft}
                  onChangeText={setSubtaskDraft}
                  placeholder="Решить проблему с поставками...."
                  placeholderTextColor="#868C98"
                  multiline
                />
                {noteClearIconSvg ? (
                  <TouchableOpacity
                    style={styles.noteClearButton}
                    onPress={() => setSubtaskDraft('')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <SvgXml xml={noteClearIconSvg} width={20} height={20} />
                  </TouchableOpacity>
                ) : null}
                {noteConfirmIconSvg ? (
                  <TouchableOpacity
                    style={styles.noteConfirmButton}
                    onPress={async () => {
                      await upsertSubtask();
                      setShowSubtaskEditor(false);
                      setEditingSubtaskId(null);
                      Keyboard.dismiss();
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <SvgXml xml={noteConfirmIconSvg} width={20} height={20} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.noteHintText}>Подзадачи видны только вам</Text>
            </View>
          </KeyboardAvoidingView>
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
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#0A0D14',
    marginTop: 15,
  },
  headerRight: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  content: {
    paddingHorizontal: spacing.md,
    marginTop: 0,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  contentContainerWithItems: {
    paddingTop: 10,
    paddingBottom: spacing.xl + 230,
  },
  contentContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    transform: [{ translateY: -80 }],
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D14',
    marginBottom: spacing.md,
  },
  subtaskEmptyState: {
    alignItems: 'center',
    marginTop: 0,
    transform: [{ translateY: 0 }],
    width: '100%',
  },
  subtaskEmptyIcon: {
    marginTop: 0,
    marginBottom: 18,
  },
  subtaskEmptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0A0D14',
    marginBottom: 10,
  },
  subtaskEmptyText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#525866',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 26,
  },
  subtasksList: {
    marginTop: -20,
    marginBottom: spacing.lg + 6,
    backgroundColor: 'transparent',
  },
  subtaskItem: {
    backgroundColor: 'transparent',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 18,
    backgroundColor: 'transparent',
  },
  subtaskDivider: {
    height: 1,
    backgroundColor: '#D9DCE2',
  },
  subtaskCheckbox: {
    marginRight: 12,
    marginTop: 0,
  },
  subtaskText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '300',
    color: '#0A0D14',
    lineHeight: 24,
    marginTop: -2,
  },
  subtaskTextCompleted: {
    color: '#868C98',
  },
  noteDeleteActionWrap: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  noteDeleteAction: {
    width: 56,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  addSubtaskButton: {
    width: PRIMARY_BUTTON_WIDTH - 30,
    height: 56,
    borderRadius: 99,
    backgroundColor: '#191BDF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  addSubtaskButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#EBF1FF',
  },
  addSubtaskButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSubtaskPlus: {
    fontSize: 20,
    fontWeight: '400',
    color: '#EBF1FF',
    marginRight: 8,
    marginLeft: -2,
    lineHeight: 20,
  },
  addSubtaskInlineButton: {
    marginTop: 14,
    marginBottom: 2,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  addSubtaskInlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSubtaskInlinePlus: {
    fontSize: 44 / 2,
    fontWeight: '400',
    color: '#0A0D14',
    marginRight: 10,
    lineHeight: 44 / 2,
  },
  addSubtaskInlineText: {
    fontSize: 19,
    fontWeight: '300',
    color: '#0A0D14',
    lineHeight: 30,
  },
  helpCardWrap: {
    width: FRAME22_WIDTH,
    height: 184,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 20,
  },
  helpCardBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  helpCardImage: {
    width: '100%',
    height: '100%',
  },
  helpCardContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    paddingTop: 17,
  },
  helpCardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    marginHorizontal: 20,
  },
  helpCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '200',
    lineHeight: 26,
    marginTop: 6,
    marginHorizontal: 20,
  },
  helpCardButton: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 23,
    height: 50,
    borderRadius: 99,
    backgroundColor: '#FD680A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCardButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '300',
  },
  noteEditOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 13, 20, 0.45)',
    justifyContent: 'flex-end',
  },
  noteEditAvoider: {
    width: '100%',
  },
  noteEditCard: {
    backgroundColor: '#F6F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.lg + 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    width: '100%',
    marginBottom: 0,
  },
  noteHeaderEditing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
    marginTop: 3,
    paddingHorizontal: 0,
  },
  noteTitleEditing: {
    fontSize: 21,
    fontWeight: '300',
    color: '#0A0D14',
  },
  noteInputContainer: {
    backgroundColor: '#F6F8FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5D8DD',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 30,
  },
  noteInputContainerEditing: {
    minHeight: 128,
  },
  noteInputText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
    minHeight: 82,
    textAlignVertical: 'top',
  },
  noteClearButton: {
    position: 'absolute',
    left: 10,
    bottom: 8,
  },
  noteConfirmButton: {
    position: 'absolute',
    right: 10,
    bottom: 8,
  },
  noteHintText: {
    marginTop: 8,
    fontSize: 17 / 2,
    fontWeight: '300',
    color: '#525866',
  },
  taskCheckboxFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#868C98',
  },
  taskCheckboxFallbackActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#38C793',
  },
});
