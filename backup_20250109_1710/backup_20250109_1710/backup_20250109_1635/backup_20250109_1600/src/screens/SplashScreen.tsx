import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { palette } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const splashIconSvg = `
<svg width="73" height="70" viewBox="0 0 73 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.23 34.9899C26.2189 32.3356 27.2494 29.8225 29.133 27.9144C31.0166 26.0063 33.5266 24.9304 36.2016 24.886C38.8759 24.842 41.395 25.8331 43.294 27.679C45.1934 29.5239 46.2458 32.0025 46.2564 34.6562C46.2721 38.3968 44.1922 41.6964 41.1138 43.4427C39.6829 44.2544 38.0366 44.7311 36.2848 44.7601C33.6105 44.8041 31.0914 43.813 29.1924 41.9671C27.293 40.1222 26.2406 37.6436 26.23 34.9899ZM6.48672 55.4851C6.99855 55.8432 7.60123 56.0273 8.22986 56.016C9.18062 56.0009 10.079 55.53 10.6318 54.7583L21.0567 40.2213L21.1993 65.8525C21.2081 67.4747 22.5466 68.7735 24.1858 68.7457C24.9805 68.7328 25.7236 68.4117 26.2817 67.8458C26.8399 67.278 27.1448 66.5324 27.1397 65.7451L27.0414 48.009L42.3386 68.4723C42.8988 69.2223 43.7994 69.6611 44.7475 69.6448C45.3795 69.6343 45.9836 69.4282 46.492 69.05C47.1306 68.5758 47.5486 67.885 47.6684 67.106C47.7887 66.326 47.596 65.549 47.1257 64.9215L36.5406 50.7617L61.1492 58.2403C61.4474 58.3302 61.7555 58.3739 62.0661 58.3687C63.3576 58.3461 64.4902 57.5081 64.8829 56.2801C65.3801 54.7249 64.5146 53.0751 62.9541 52.6009L45.9262 47.426L70.4476 39.0635C72.0019 38.5297 72.8488 36.852 72.3351 35.3145C71.8203 33.7784 70.1361 32.9586 68.5805 33.4886L51.6139 39.2765L66.68 18.2655C67.1426 17.6207 67.3271 16.8386 67.1988 16.063C67.0701 15.2867 66.6443 14.612 66.0004 14.1606C64.6699 13.2291 62.8114 13.5556 61.8553 14.8874L51.429 29.4252L51.2871 3.79359C51.2775 2.17002 49.9401 0.87155 48.3002 0.899693C47.5058 0.913319 46.7628 1.23438 46.205 1.79926C45.6468 2.36698 45.342 3.11257 45.3463 3.90037L45.4446 21.6365L30.1475 1.17312C29.6772 0.543903 28.9873 0.137081 28.2025 0.0280986C27.5432 -0.0630391 26.8837 0.0643671 26.3109 0.389301C26.2023 0.450933 26.0966 0.519659 25.9944 0.596127C25.3555 1.06961 24.9367 1.76085 24.8172 2.54048C24.697 3.32053 24.8908 4.09604 25.3607 4.72459L35.9465 18.884L11.336 11.4055C10.5805 11.176 9.77609 11.2526 9.0707 11.6228C8.36341 11.9896 7.84402 12.612 7.60314 13.3654C7.36226 14.1187 7.43062 14.916 7.7945 15.6108C8.15876 16.3064 8.77575 16.8153 9.53122 17.0449L26.5599 22.2194L2.03846 30.582C1.28629 30.8421 0.673874 31.371 0.317358 32.079C-0.0384179 32.7865 -0.0978584 33.5875 0.152047 34.3312C0.556995 35.541 1.69552 36.3392 2.98437 36.3172C3.29833 36.3127 3.60918 36.2579 3.90621 36.1564L20.8729 30.3702L5.80606 51.3799C5.3434 52.0247 5.15928 52.8075 5.28762 53.5831C5.41669 54.3583 5.84206 55.0341 6.48672 55.4851Z" fill="white"/>
</svg>
`;

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );

    const progressAnimation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.ease,
      useNativeDriver: false,
    });

    rotateAnimation.start();
    progressAnimation.start();

    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      rotateAnimation.stop();
      clearTimeout(timer);
    };
  }, [onFinish]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ rotate }] }]}>
        <SvgXml xml={splashIconSvg} width={80} height={77} />
      </Animated.View>

      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 100,
    width: 180,
    height: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: palette.white,
    borderRadius: 4,
  },
});
