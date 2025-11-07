import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DiagnosisBlock } from '../data/diagnosisBlocks';

const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
  green: '#00AA00',
  red: '#FF0000',
};

interface BarChartProps {
  blocks: DiagnosisBlock[];
  isAuthenticated: boolean;
}

export default function BarChart({ blocks, isAuthenticated }: BarChartProps) {
  console.log('=== BarChart данные ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('Блоки:', blocks.map(b => ({ id: b.id, title: b.title, completed: b.completed, efficiency: b.efficiency })));
  
  // Показываем реальные данные: для пройденных блоков - эффективность, для непройденных - 0
  const displayData = blocks.map(block => ({
    ...block,
    efficiency: (block.completed && block.efficiency !== undefined) ? block.efficiency : 0,
  }));
  
  console.log('displayData:', displayData.map(b => ({ id: b.id, efficiency: b.efficiency })));

  const maxEfficiency = 100;
  const chartHeight = 150;

  const getBarColor = (efficiency: number) => {
    if (efficiency === 0 || efficiency === undefined) return COLORS.gray;
    if (efficiency >= 80) return COLORS.green;
    if (efficiency >= 60) return COLORS.blue;
    if (efficiency >= 40) return COLORS.orange;
    return COLORS.red;
  };

  const chartData = displayData.map(block => {
    const efficiency = block.efficiency ?? 0;
    const hasData = block.completed && block.efficiency !== undefined;
    const barHeight = hasData && efficiency > 0 ? (efficiency / maxEfficiency) * chartHeight : 0;
    const barColor = getBarColor(efficiency);
    return {
      block,
      efficiency,
      hasData,
      barHeight,
      barColor,
    };
  });

  // Генерируем линии сетки
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <View style={styles.container}>
      {/* Рамка диаграммы */}
      <View style={styles.chartFrame}>
        {/* Сетка */}
        <View style={styles.gridContainer}>
          {gridLines.map((line, index) => {
            const linePosition = (line / maxEfficiency) * chartHeight;
            return (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  {
                    bottom: linePosition,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Столбцы */}
        <View style={styles.chartContainer}>
          {chartData.map(({ block, hasData, barHeight, barColor }) => {
            
            return (
              <View key={block.id} style={styles.barWrapper}>
                <View style={[styles.barContainer, { minHeight: chartHeight }]}>
                  {hasData && barHeight > 0 && (
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  )}
                  {(!hasData || (hasData && barHeight === 0)) && (
                    <View style={styles.zeroBar}>
                      <View style={styles.zeroBarIndicator} />
                      {hasData && barHeight === 0 && <Text style={styles.zeroBarText}>0%</Text>}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Вертикальные линии сетки */}
        <View style={styles.verticalGridContainer}>
          {chartData.map(({ block }, index) => (
            <View
              key={`v-grid-${block.id}`}
              style={[
                styles.verticalGridLine,
                index === displayData.length - 1 && styles.verticalGridLineLast,
              ]}
            />
          ))}
        </View>

        {/* Значения над столбцами */}
        <View style={styles.valuesOverlay} pointerEvents="none">
          {chartData.map(({ block, efficiency, hasData, barHeight, barColor }) => (
            <View key={`val-${block.id}`} style={styles.valueWrapper}>
              {hasData && (
                <Text
                  style={[styles.barValue, {
                    color: barColor,
                    position: 'absolute',
                    bottom: barHeight + 8,
                  }]}
                >
                  {efficiency}%
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Подписи блоков */}
      <View style={styles.labelsContainer}>
        {chartData.map(({ block }) => (
          <View key={`label-${block.id}`} style={styles.labelWrapper}>
            <Text style={styles.barLabel} numberOfLines={2}>
              {block.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.blue,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chartFrame: {
    position: 'relative',
    height: 150,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
  verticalGridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1,
  },
  verticalGridLine: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray,
    opacity: 0.3,
  },
  verticalGridLineLast: {
    borderRightWidth: 0,
  },
  chartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingBottom: 2,
    zIndex: 2,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '75%',
    minHeight: 15,
    borderRadius: 4,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  zeroBar: {
    width: '75%',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
    borderStyle: 'dashed',
    position: 'relative',
    opacity: 0.5,
  },
  zeroBarIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.darkGray,
    marginLeft: -3,
    marginBottom: -3,
  },
  zeroBarText: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 4,
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  valueWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
    height: '100%',
    justifyContent: 'flex-end',
  },
  valuesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'stretch',
    paddingHorizontal: 4,
    zIndex: 3,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  labelWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barLabel: {
    fontSize: 8,
    color: COLORS.blue,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 11,
  },
});

