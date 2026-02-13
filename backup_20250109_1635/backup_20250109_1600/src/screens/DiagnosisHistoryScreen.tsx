import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SvgXml } from 'react-native-svg';
import { DEFAULT_BLOCKS, DiagnosisBlock } from '../data/diagnosisBlocks';
import questionsData from '../data/questions.json';
import { palette, radii, spacing } from '../styles/theme';
import { getCurrentUserId, loadUserQuestionnaire } from '../utils/userDataStorage';

const initialCards = [
  { id: 'summary', type: 'summary' as const },
  { id: 'card-1', value: '88%', date: '22 ноября, 2025', color: '#38C793' },
  { id: 'card-2', value: '73%', date: '21 октября, 2025', color: '#F2AE40' },
  { id: 'card-3', value: '49%', date: '30 сентября, 2025', color: '#DF1C41' },
  { id: 'card-4', value: '36%', date: '1 сентября, 2025', color: '#DF1C41' },
  { id: 'card-5', value: '31%', date: '11 августа, 2025', color: '#DF1C41' },
];

export default function DiagnosisHistoryScreen({ navigation }: any) {
  const [backIconSvg, setBackIconSvg] = useState<string>('');
  const [menuIconSvg, setMenuIconSvg] = useState<string>('');
  const [projectAvatarUri, setProjectAvatarUri] = useState<string | null>(null);
  const [city, setCity] = useState<string>('город');
  const [cityIconSvg, setCityIconSvg] = useState<string>('');
  const [checkboxSvg, setCheckboxSvg] = useState<string>('');
  const [arrowDownSvg, setArrowDownSvg] = useState<string>('');
  const [deleteIconSvg, setDeleteIconSvg] = useState<string>('');
  const [directionsCloseIconSvg, setDirectionsCloseIconSvg] = useState<string>('');
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [modalBadgeWidth, setModalBadgeWidth] = useState<number | null>(null);
  const [modalHeaderInfo, setModalHeaderInfo] = useState<{ value: string; date: string; color: string } | null>(null);
  const [blockResults, setBlockResults] = useState<DiagnosisBlock[]>(
    DEFAULT_BLOCKS.map((block) => ({
      ...block,
      completed: false,
      efficiency: undefined,
    }))
  );
  const [coinsIconSvg, setCoinsIconSvg] = useState<string>('');
  const [colorsIconSvg, setColorsIconSvg] = useState<string>('');
  const [chartBarLineIconSvg, setChartBarLineIconSvg] = useState<string>('');
  const [fileIconSvg, setFileIconSvg] = useState<string>('');
  const [marketingIconSvg, setMarketingIconSvg] = useState<string>('');
  const [computerSettingsIconSvg, setComputerSettingsIconSvg] = useState<string>('');
  const [userMultipleIconSvg, setUserMultipleIconSvg] = useState<string>('');
  const [dishWasherIconSvg, setDishWasherIconSvg] = useState<string>('');
  const [legalDocumentIconSvg, setLegalDocumentIconSvg] = useState<string>('');
  const [chartIncreaseIconSvg, setChartIncreaseIconSvg] = useState<string>('');
  const [cards, setCards] = useState(initialCards);

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const renderRightActions = useCallback(
    () => (
      <View style={styles.deleteAction}>
        {deleteIconSvg && <SvgXml xml={deleteIconSvg} width={23} height={23} />}
      </View>
    ),
    [deleteIconSvg]
  );

  useFocusEffect(
    useCallback(() => {
      setCards(initialCards);
    }, [])
  );

  useEffect(() => {
    setCards(initialCards);
  }, []);

  useEffect(() => {
    const questions: Record<string, any[]> = {};
    (questionsData as any[]).forEach((block: any) => {
      questions[block.id] = block.questions;
    });

    const calculateBlockResults = async () => {
      try {
        const blocksData: DiagnosisBlock[] = [];

        for (const block of DEFAULT_BLOCKS) {
          const saved = await AsyncStorage.getItem(`diagnosis_answers_${block.id}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            const blockQuestions = questions[block.id] || [];
            let blockCorrect = 0;
            let blockIncorrect = 0;

            blockQuestions.forEach((question) => {
              const questionKey = `${block.id}_${question.id}`;
              const selectedAnswerId = parsed[questionKey];
              if (selectedAnswerId) {
                const selectedOption = question.options.find((opt: any) => opt.id === selectedAnswerId);
                if (selectedOption && selectedOption.value) {
                  if (selectedOption.correct) {
                    blockCorrect++;
                  } else {
                    blockIncorrect++;
                  }
                }
              }
            });

            const blockTotalAnswers = blockCorrect + blockIncorrect;
            const blockEfficiency = blockTotalAnswers > 0 ? Math.round((blockCorrect / blockTotalAnswers) * 100) : 0;

            blocksData.push({
              ...block,
              completed: true,
              efficiency: blockEfficiency,
            });
          } else {
            blocksData.push({
              ...block,
              completed: false,
              efficiency: undefined,
            });
          }
        }

        setBlockResults(blocksData);
      } catch (error) {
        console.error('Ошибка подсчета результатов блоков:', error);
      }
    };

    calculateBlockResults();
  }, []);

  const getBlockIconSvg = (blockId: string): string | null => {
    const iconMap: Record<string, string | null> = {
      'concept': colorsIconSvg,
      'finance': coinsIconSvg,
      'management': chartBarLineIconSvg,
      'menu': fileIconSvg,
      'marketing': marketingIconSvg,
      'operations': computerSettingsIconSvg,
      'client_experience': userMultipleIconSvg,
      'infrastructure': dishWasherIconSvg,
      'risks': legalDocumentIconSvg,
      'strategy': chartIncreaseIconSvg,
    };
    return iconMap[blockId] || null;
  };

  const getEfficiencyBadgeColors = (efficiency?: number): { bg: string; text: string } => {
    if (efficiency === undefined || efficiency === null) {
      return { bg: '#F6F8FA', text: '#525866' };
    }
    if (efficiency >= 78) {
      return { bg: '#CBF5E5', text: '#176448' };
    } else if (efficiency >= 38) {
      return { bg: '#FFDAC2', text: '#6E330C' };
    } else {
      return { bg: '#F8C9D2', text: '#710E21' };
    }
  };

  const sortedBlockResults = [...blockResults].sort((a, b) => {
    const aEfficiency = a.efficiency !== undefined ? a.efficiency : 0;
    const bEfficiency = b.efficiency !== undefined ? b.efficiency : 0;
    return aEfficiency - bEfficiency;
  });

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const backIconAsset = Asset.fromModule(require('../../assets/images/Frame 8 (3).svg'));
        await backIconAsset.downloadAsync();
        if (backIconAsset.localUri) {
          const response = await fetch(backIconAsset.localUri);
          const fileContent = await response.text();
          setBackIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG стрелки:', error);
      }

      try {
        const menuIconAsset = Asset.fromModule(require('../../assets/images/Frame 9.svg'));
        await menuIconAsset.downloadAsync();
        if (menuIconAsset.localUri) {
          const response = await fetch(menuIconAsset.localUri);
          const fileContent = await response.text();
          setMenuIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки меню:', error);
      }

      try {
        const cityIconAsset = Asset.fromModule(require('../../assets/images/arrow-down-city.svg'));
        await cityIconAsset.downloadAsync();
        if (cityIconAsset.localUri) {
          const response = await fetch(cityIconAsset.localUri);
          const fileContent = await response.text();
          setCityIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки города:', error);
      }

      try {
        const checkboxAsset = Asset.fromModule(require('../../assets/images/checkbox-checked.svg'));
        await checkboxAsset.downloadAsync();
        if (checkboxAsset.localUri) {
          const response = await fetch(checkboxAsset.localUri);
          const fileContent = await response.text();
          setCheckboxSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG галочки:', error);
      }

      try {
        const arrowAsset = Asset.fromModule(require('../../assets/images/вниз.svg'));
        await arrowAsset.downloadAsync();
        if (arrowAsset.localUri) {
          const response = await fetch(arrowAsset.localUri);
          const fileContent = await response.text();
          setArrowDownSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG стрелки вниз:', error);
      }

      try {
        const deleteAsset = Asset.fromModule(require('../../assets/images/delete-02.svg'));
        await deleteAsset.downloadAsync();
        if (deleteAsset.localUri) {
          const response = await fetch(deleteAsset.localUri);
          const fileContent = await response.text();
          setDeleteIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG корзины:', error);
      }

      try {
        const closeIconAsset = Asset.fromModule(require('../../assets/images/directions-close-icon.svg'));
        await closeIconAsset.downloadAsync();
        if (closeIconAsset.localUri) {
          const response = await fetch(closeIconAsset.localUri);
          const fileContent = await response.text();
          setDirectionsCloseIconSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG иконки закрытия направлений:', error);
      }

      const iconLoaders = [
        { path: require('../../assets/images/coins-icon.svg'), setter: setCoinsIconSvg },
        { path: require('../../assets/images/colors-icon.svg'), setter: setColorsIconSvg },
        { path: require('../../assets/images/chart-bar-line-icon.svg'), setter: setChartBarLineIconSvg },
        { path: require('../../assets/images/file-icon.svg'), setter: setFileIconSvg },
        { path: require('../../assets/images/marketing-icon.svg'), setter: setMarketingIconSvg },
        { path: require('../../assets/images/computer-settings-icon.svg'), setter: setComputerSettingsIconSvg },
        { path: require('../../assets/images/user-multiple-icon.svg'), setter: setUserMultipleIconSvg },
        { path: require('../../assets/images/dish-washer-icon.svg'), setter: setDishWasherIconSvg },
        { path: require('../../assets/images/legal-document-icon.svg'), setter: setLegalDocumentIconSvg },
        { path: require('../../assets/images/chart-increase-icon.svg'), setter: setChartIncreaseIconSvg },
      ];

      for (const loader of iconLoaders) {
        try {
          const asset = Asset.fromModule(loader.path);
          await asset.downloadAsync();
          if (asset.localUri) {
            const response = await fetch(asset.localUri);
            const fileContent = await response.text();
            loader.setter(fileContent);
          }
        } catch (error) {
          console.error('Ошибка загрузки иконки блока:', error);
        }
      }

    };

    loadIcons();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const questionnaireData = await loadUserQuestionnaire(userId);
          if (questionnaireData?.city) {
            setCity(questionnaireData.city);
          }
        }

        const savedProjectAvatar = await AsyncStorage.getItem('projectAvatar');
        if (savedProjectAvatar) {
          setProjectAvatarUri(savedProjectAvatar);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных профиля:', error);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const parent = navigation?.getParent?.();
    if (!parent) return;
    parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {backIconSvg && (
          <TouchableOpacity
            style={styles.iconButtonLeft}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
          >
            <SvgXml xml={backIconSvg} width={25} height={25} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>История диагностик</Text>
        {menuIconSvg && (
          <View style={styles.iconButtonRight}>
            <SvgXml xml={menuIconSvg} width={20} height={20} />
          </View>
        )}
      </View>
      <View style={styles.cardsContainer}>
        {cards.map((card, index) => (
          <View key={card.id}>
            {card.type === 'summary' ? (
              <View style={[styles.historyCard, styles.firstHistoryCard]}>
                <View style={styles.historyCardContent}>
                  <View style={styles.avatarContainer}>
                    {projectAvatarUri ? (
                      <Image source={{ uri: projectAvatarUri }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="business" size={32} color={palette.gray400} />
                      </View>
                    )}
                    {projectAvatarUri && checkboxSvg && (
                      <View style={styles.checkboxContainer}>
                        <SvgXml xml={checkboxSvg} width={18} height={18} />
                      </View>
                    )}
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>Проект</Text>
                    <View style={styles.cityContainer}>
                      <Text style={styles.cityText}>{city || 'город'}</Text>
                      <View style={styles.cityIconContainer}>
                        {cityIconSvg ? (
                          <SvgXml xml={cityIconSvg} width={16} height={16} />
                        ) : (
                          <View style={styles.cityIconPlaceholder} />
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>+24%</Text>
                    <Text style={styles.historyStatLabel}>за все время</Text>
                  </View>
                </View>
              </View>
            ) : (
              <Swipeable
                renderRightActions={renderRightActions}
                onSwipeableWillOpen={() => deleteCard(card.id)}
                rightThreshold={30}
                friction={1}
                overshootRight={false}
              >
                <View style={styles.historyCard}>
                  <View style={styles.historyCardContent}>
                    <View style={styles.historyStatLeft}>
                      <Text style={[styles.historyStatValue, { color: card.color }]}>{card.value}</Text>
                      <Text style={[styles.historyStatLabel, styles.historyStatLabelOffset]}>{card.date}</Text>
                    </View>
                    {arrowDownSvg && (
                      <TouchableOpacity
                        style={styles.historyArrow}
                        onPress={() => {
                          setModalHeaderInfo({
                            value: card.value,
                            date: card.date,
                            color: card.color,
                          });
                          setShowDirectionsModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <SvgXml xml={arrowDownSvg} width={25} height={25} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Swipeable>
            )}
            {index === 0 && <View style={styles.historyDivider} />}
          </View>
        ))}
      </View>
      <Modal
        visible={showDirectionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDirectionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text
                  style={[
                    styles.modalHeaderValue,
                    modalHeaderInfo ? { color: modalHeaderInfo.color } : null,
                  ]}
                  numberOfLines={1}
                >
                  {modalHeaderInfo?.value || '—'}
                </Text>
                <Text style={styles.modalHeaderDate} numberOfLines={1}>
                  {modalHeaderInfo?.date || ''}
                </Text>
              </View>
              {directionsCloseIconSvg && (
                <TouchableOpacity 
                  onPress={() => setShowDirectionsModal(false)}
                  style={styles.modalCloseButton}
                >
                  <SvgXml xml={directionsCloseIconSvg} width={22} height={22} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.directionsScrollContainer}>
              <View pointerEvents="none" style={styles.directionsDividerOverlay} />
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.directionsScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {sortedBlockResults.map((block, index) => {
                  const blockIconSvg = getBlockIconSvg(block.id);
                  const efficiencyColors = getEfficiencyBadgeColors(block.efficiency);
                  const efficiencyValue = block.efficiency !== undefined ? block.efficiency : 0;
                  const isLast = index === sortedBlockResults.length - 1;
                  return (
                    <View key={block.id} style={styles.directionsBlockItem}>
                      {blockIconSvg && (
                        <SvgXml xml={blockIconSvg} width={23} height={23} />
                      )}
                      <Text style={styles.directionsBlockTitle} numberOfLines={1}>
                        {block.title.replace(/\n/g, ' ')}
                      </Text>
                      <View
                        onLayout={isLast ? (e) => {
                          if (!modalBadgeWidth) setModalBadgeWidth(e.nativeEvent.layout.width + 1);
                        } : undefined}
                        style={[
                          styles.metricBadge,
                          { backgroundColor: efficiencyColors.bg, minWidth: 35, paddingHorizontal: 6 },
                          modalBadgeWidth ? { width: modalBadgeWidth } : undefined,
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={[
                            styles.modalBadgeText,
                            { color: efficiencyColors.text, flexShrink: 0, textAlign: 'center' },
                          ]}
                        >
                          {efficiencyValue}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
                <View style={[styles.modalDivider, { marginTop: 13, marginBottom: 0 }]} />
              </ScrollView>
            </View>
            <View style={styles.noteSection}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>Моя заметка</Text>
                <TouchableOpacity>
                  <Text style={styles.noteEditButton}>Редактировать</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.noteInputContainer}>
                <Text style={styles.noteInputText}>
                  Были некоторые проблемы с поставщиками продуктов, на данный момент решил эти вопросы.
                </Text>
              </View>
              <Text style={styles.noteHintText}>Текст заметки виден только вам</Text>
            </View>
            <View style={styles.swipeIndicator} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - spacing.md * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: spacing.md,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  header: {
    marginTop: 60,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  historyCard: {
    width: cardWidth,
    height: 80,
    backgroundColor: palette.white,
    borderRadius: 20,
    marginBottom: 17,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  firstHistoryCard: {
    marginBottom: 0,
  },
  historyDivider: {
    width: cardWidth - 4,
    height: 1,
    backgroundColor: '#E2E4E9',
    marginTop: 18,
    marginBottom: 18,
    alignSelf: 'center',
  },
  historyCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 2,
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.gray100,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    transform: [{ translateX: 10 }],
  },
  projectInfo: {
    flex: 1,
    alignSelf: 'center',
    marginLeft: 10,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '400',
    color: '#0A0D14',
    marginBottom: 2,
    marginTop: 0,
    marginLeft: -1,
    lineHeight: 22,
    minHeight: 22,
    minWidth: 60,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
    marginTop: 1,
  },
  cityText: {
    fontSize: 14,
    color: palette.gray600,
    marginRight: 2,
    minHeight: 16,
    minWidth: 40,
  },
  cityIconContainer: {
    marginLeft: 2,
    transform: [{ translateY: 1 }],
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityIconPlaceholder: {
    width: 16,
    height: 16,
  },
  historyStat: {
    alignItems: 'flex-end',
    marginRight: 6,
  },
  historyStatLeft: {
    alignItems: 'flex-start',
    marginLeft: 8,
  },
  historyArrow: {
    marginLeft: 'auto',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 0,
  },
  modalContent: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    marginTop: 100,
    flex: 1,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingRight: 10,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalHeaderValue: {
    fontSize: 22,
    fontWeight: '400',
    color: '#0A0D14',
  },
  modalHeaderDate: {
    fontSize: 16,
    fontWeight: '300',
    color: '#525866',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    marginRight: 0,
    marginTop: -5,
    transform: [{ translateX: 18 }],
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E4E9',
    alignSelf: 'stretch',
    marginHorizontal: 18,
    marginBottom: spacing.md,
    zIndex: 1,
    position: 'relative',
  },
  modalScrollView: {
    flex: 1,
  },
  directionsScrollContainer: {
    flex: 1,
    position: 'relative',
  },
  directionsDividerOverlay: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: '#E2E4E9',
    zIndex: 2,
  },
  directionsScrollContent: {
    paddingTop: spacing.md,
  },
  directionsBlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 6,
    paddingLeft: 0,
    paddingRight: 0,
  },
  directionsBlockTitle: {
    fontSize: 15,
    fontWeight: '300',
    color: '#0A0D14',
    flex: 1,
    marginLeft: spacing.sm,
  },
  metricBadge: {
    minWidth: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#710E21',
  },
  noteSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: 0,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
  },
  noteEditButton: {
    fontSize: 14,
    fontWeight: '400',
    color: '#525866',
  },
  noteInputContainer: {
    backgroundColor: '#F6F8FA',
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 80,
    marginHorizontal: 0,
  },
  noteInputText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#525866',
    lineHeight: 20,
  },
  noteHintText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#868C98',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#C7D4E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  historyStatValue: {
    fontSize: 22,
    fontWeight: '400',
    color: '#38C793',
    lineHeight: 22,
    marginBottom: 2,
  },
  historyStatLabel: {
    fontSize: 16,
    fontWeight: '300',
    color: '#525866',
    marginTop: 0,
  },
  historyStatLabelOffset: {
    marginTop: 2,
  },
  iconButtonLeft: {
    position: 'absolute',
    left: 0,
    height: 20,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonRight: {
    position: 'absolute',
    right: 0,
    height: 20,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#000000',
    fontSize: 23,
    fontWeight: '400',
    textAlign: 'center',
  },
});
