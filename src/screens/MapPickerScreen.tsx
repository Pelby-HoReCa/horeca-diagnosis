import { Asset } from 'expo-asset';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from '../components/AnimatedPressable';
import { palette, spacing } from '../styles/theme';

interface MapPickerScreenProps {
  onBack?: () => void;
  onConfirm?: (address: string) => void;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.6) + 50;
const YANDEX_MAPS_API_KEY = 'd54ee7de-414b-4803-acae-6c3f72d850bd';

const DEFAULT_CENTER = { lat: 55.751244, lon: 37.618423 };
const LAST_KNOWN_OPTIONS = {
  maxAge: 10 * 60 * 1000,
  requiredAccuracy: 100,
} as const;

const getMapHtml = (lat: number, lon: number) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
    </style>
    <script src="https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var mapInstance = null;
      function postMessageToApp(type) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(type);
        }
      }
      ymaps.ready(function () {
        mapInstance = new ymaps.Map('map', {
          center: [${lat}, ${lon}],
          zoom: 16,
          controls: []
        });
        mapInstance.events.add('actionbegin', function () {
          postMessageToApp('hideAddress');
        });
        mapInstance.events.add('actionend', function () {
          if (!mapInstance || !ymaps.geocode) {
            return;
          }
          var center = mapInstance.getCenter();
          ymaps.geocode(center).then(function (res) {
            var first = res && res.geoObjects ? res.geoObjects.get(0) : null;
            var address = first ? first.getAddressLine() : '';
            postMessageToApp('address:' + address);
            postMessageToApp('showAddress');
          }).catch(function () {});
        });
        mapInstance.events.add('balloonopen', function () {
          postMessageToApp('hidePin');
        });
        mapInstance.geoObjects.events.add('balloonopen', function () {
          postMessageToApp('hidePin');
        });
        mapInstance.events.add('actionbegin', function () {
          postMessageToApp('showPin');
        });

        var observer = new MutationObserver(function () {
          var balloon = document.querySelector('.ymaps-2-1-79-balloon, .ymaps-2-1-79-card');
          if (balloon) {
            postMessageToApp('hidePin');
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });

      window.setMapCenter = function(lat, lon, zoom) {
        if (mapInstance) {
          mapInstance.setCenter([lat, lon], zoom || 16, { duration: 300 });
        }
      };
    </script>
  </body>
</html>
`;

export default function MapPickerScreen({ onBack, onConfirm }: MapPickerScreenProps) {
  const [basicInputSvg, setBasicInputSvg] = useState<string>('');
  const [basicInputRightSvg, setBasicInputRightSvg] = useState<string>('');
  const [centerPinSvg, setCenterPinSvg] = useState<string>('');
  const [mapPinSvg, setMapPinSvg] = useState<string>('');
  const [address, setAddress] = useState('');
  const [showCenterPin, setShowCenterPin] = useState(true);
  const [showAddressBadge, setShowAddressBadge] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [initialCenter] = useState<{ lat: number; lon: number }>(DEFAULT_CENTER);
  const [isMapReady, setIsMapReady] = useState(false);
  const webViewRef = React.useRef<WebView>(null);
  const pendingCenterRef = useRef<{ lat: number; lon: number } | null>(null);
  const autoCenteredRef = useRef(false);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const addressBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressAddressBadgeRef = useRef(false);
  const bestAccuracyRef = useRef<number | null>(null);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const keyboardHeightRef = useRef(0);

  const animateSheet = (value: number, duration = 200) => {
    Animated.timing(sheetTranslateY, {
      toValue: value,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const centerMap = (lat: number, lon: number, zoom = 16) => {
    pendingCenterRef.current = { lat, lon };
    if (isMapReady) {
      webViewRef.current?.injectJavaScript(`window.setMapCenter(${lat}, ${lon}, ${zoom}); true;`);
    }
  };

  const centerFromLastKnown = async () => {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync(LAST_KNOWN_OPTIONS);
      if (lastKnown) {
        centerMap(lastKnown.coords.latitude, lastKnown.coords.longitude, 16);
        return true;
      }
    } catch (error) {
      console.warn('Ошибка получения последней геопозиции:', error);
    }
    return false;
  };

  const getCurrentLocation = async (
    accuracy: Location.Accuracy = Location.Accuracy.Balanced,
    timeout = 2000
  ) => {
    const position = await Location.getCurrentPositionAsync({
      accuracy,
      maximumAge: 0,
      timeout,
    });
    centerMap(position.coords.latitude, position.coords.longitude, 17);
    return position;
  };

  const startLocationWatch = async () => {
    locationWatchRef.current?.remove();
    locationWatchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 500,
        distanceInterval: 1,
      },
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (accuracy !== null) {
          if (bestAccuracyRef.current === null || accuracy < bestAccuracyRef.current) {
            bestAccuracyRef.current = accuracy;
            centerMap(latitude, longitude, 17);
          }
          if (accuracy <= 25) {
            locationWatchRef.current?.remove();
            locationWatchRef.current = null;
          }
        }
      },
      (error) => {
        console.warn('Ошибка подписки на геопозицию:', error);
      }
    );
  };

  useEffect(() => {
    const loadBasicInputIcon = async () => {
      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/Basic Input.svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setBasicInputSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG Basic Input:', error);
      }

      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/вBasic Input (1).svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setBasicInputRightSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG Basic Input (1):', error);
      }

      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/Group 3362237 (1).svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setCenterPinSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG маркера центра:', error);
      }

      try {
        const iconAsset = Asset.fromModule(require('../../assets/images/map-pin-line (1).svg'));
        await iconAsset.downloadAsync();
        if (iconAsset.localUri) {
          const response = await fetch(iconAsset.localUri);
          const fileContent = await response.text();
          setMapPinSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG map-pin-line:', error);
      }
    };

    loadBasicInputIcon();
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const keyboardHeight = event.endCoordinates?.height ?? 0;
      keyboardHeightRef.current = keyboardHeight;
      animateSheet(-Math.max(keyboardHeight, 0), Platform.OS === 'ios' ? event.duration ?? 250 : 200);
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      keyboardHeightRef.current = 0;
      animateSheet(0, Platform.OS === 'ios' ? event.duration ?? 250 : 200);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [sheetTranslateY]);

  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        if (!isMounted) {
          return;
        }

        await centerFromLastKnown();
        try {
          await getCurrentLocation(Location.Accuracy.Balanced, 2000);
        } catch (error) {
          console.warn('Ошибка быстрого определения геопозиции:', error);
        }
        await startLocationWatch();
      } catch (error) {
        console.warn('Ошибка получения текущей геопозиции:', error);
      }
    };

    initLocation();
    return () => {
      isMounted = false;
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
      if (addressBadgeTimerRef.current) {
        clearTimeout(addressBadgeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || autoCenteredRef.current || !pendingCenterRef.current) {
      return;
    }
    centerMap(pendingCenterRef.current.lat, pendingCenterRef.current.lon, 16);
    autoCenteredRef.current = true;
  }, [isMapReady]);

  const handleLocatePress = async () => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      await centerFromLastKnown();
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    try {
      await centerFromLastKnown();
      await getCurrentLocation(Location.Accuracy.Balanced, 2000);
      await startLocationWatch();
    } catch (error) {
      console.warn('Ошибка определения геопозиции по кнопке:', error);
    }
  };

  const geocodeAddress = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return null;
    }
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_MAPS_API_KEY}&format=json&lang=ru_RU&geocode=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url);
    const data = await response.json();
    const member = data?.response?.GeoObjectCollection?.featureMember?.[0];
    const pos = member?.GeoObject?.Point?.pos;
    if (!pos) {
      return null;
    }
    const [lon, lat] = pos.split(' ').map(Number);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return null;
    }
    return { lat, lon };
  };

  const handleContinuePress = () => {
    if (isManualEntry && address.trim()) {
      geocodeAddress(address)
        .then((coords) => {
          if (!coords) {
            return;
          }
          centerMap(coords.lat, coords.lon, 16);
          setShowAddressBadge(true);
          setIsManualEntry(false);
          Keyboard.dismiss();
          animateSheet(0);
        })
        .catch((error) => {
          console.warn('Ошибка геокодирования адреса:', error);
        });
      return;
    }
    if (onConfirm) {
      onConfirm(address);
      return;
    }
    if (onBack) {
      onBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {initialCenter && (
          <WebView
            source={{ html: getMapHtml(initialCenter.lat, initialCenter.lon) }}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*', '']}
            onLoadEnd={() => {
              setIsMapReady(true);
              if (pendingCenterRef.current) {
                centerMap(pendingCenterRef.current.lat, pendingCenterRef.current.lon, 16);
              }
            }}
            onMessage={(event) => {
              const message = event.nativeEvent.data;
              if (message?.startsWith('address:')) {
                const nextAddress = message.replace('address:', '').trim();
                if (nextAddress) {
                  setAddress(nextAddress);
                  setIsManualEntry(false);
                }
                return;
              }
              if (message === 'hideAddress') {
                if (addressBadgeTimerRef.current) {
                  clearTimeout(addressBadgeTimerRef.current);
                }
                addressBadgeTimerRef.current = setTimeout(() => {
                  setShowAddressBadge(false);
                }, 400);
                return;
              }
              if (message === 'showAddress') {
                if (addressBadgeTimerRef.current) {
                  clearTimeout(addressBadgeTimerRef.current);
                }
                if (suppressAddressBadgeRef.current) {
                  return;
                }
                addressBadgeTimerRef.current = setTimeout(() => {
                  setShowAddressBadge(true);
                }, 400);
                return;
              }
              if (message === 'hidePin') {
                suppressAddressBadgeRef.current = true;
                if (addressBadgeTimerRef.current) {
                  clearTimeout(addressBadgeTimerRef.current);
                }
                setShowCenterPin(false);
                setShowAddressBadge(false);
              }
              if (message === 'showPin') {
                suppressAddressBadgeRef.current = false;
                setShowCenterPin(true);
              }
            }}
            ref={webViewRef}
          />
        )}
        <View pointerEvents="none" style={styles.overlay}>
          <Text style={styles.overlayText}>Двигайте карту для выбора адреса</Text>
        </View>
        {centerPinSvg && showCenterPin && (
          <View pointerEvents="none" style={styles.centerPin}>
            <SvgXml xml={centerPinSvg} width={70} height={70} />
          </View>
        )}
        {!!address && showAddressBadge && (
          <View pointerEvents="none" style={styles.addressBadgeWrapper}>
            <View style={styles.addressBadge}>
              <Text style={styles.addressBadgeText}>{address}</Text>
            </View>
          </View>
        )}
        {basicInputSvg && onBack && (
          <TouchableOpacity style={styles.basicInputIcon} onPress={onBack} activeOpacity={0.8}>
            <SvgXml xml={basicInputSvg} width={43} height={43} />
          </TouchableOpacity>
        )}
        {basicInputRightSvg && (
          <TouchableOpacity style={styles.basicInputIconRight} onPress={handleLocatePress} activeOpacity={0.8}>
            <SvgXml xml={basicInputRightSvg} width={43} height={43} />
          </TouchableOpacity>
        )}
      </View>
      <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: sheetTranslateY }] }]}>
        <View style={styles.restContainer}>
          <View style={styles.titleGroup}>
            <Text style={styles.sheetTitle}>Выберите адрес</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Адрес заведения</Text>
              <View style={styles.inputContainer}>
                {mapPinSvg && (
                  <View style={styles.inputIcon}>
                    <SvgXml xml={mapPinSvg} width={20} height={20} />
                  </View>
                )}
                <TextInput
                  style={[styles.input, address ? styles.inputFilled : styles.inputEmpty]}
                  placeholder="Краснодар, ул. Володи Головатого, 311"
                  placeholderTextColor="#868C98"
                  value={address}
                  onChangeText={(value) => {
                    setAddress(value);
                    setIsManualEntry(true);
                  }}
                  onFocus={() => {
                    if (keyboardHeightRef.current > 0) {
                      animateSheet(-Math.max(keyboardHeightRef.current, 0));
                      return;
                    }
                    animateSheet(-Math.round(SCREEN_HEIGHT * 0.45));
                  }}
                  onBlur={() => animateSheet(0)}
                />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.continueButtonContainer}>
          <AnimatedPressable style={styles.continueButton} onPress={handleContinuePress}>
            <Text style={styles.continueButtonText}>Продолжить</Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: palette.gray100,
    position: 'relative',
    zIndex: 2,
  },
  webView: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 70,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D14',
  },
  basicInputIcon: {
    position: 'absolute',
    left: spacing.md - 9,
    bottom: spacing.md + 20,
    width: 43,
    height: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  basicInputIconRight: {
    position: 'absolute',
    right: spacing.md - 9,
    bottom: spacing.md + 20,
    width: 43,
    height: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -35 }, { translateY: -40 }],
  },
  restContainer: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginTop: 0,
    position: 'relative',
    zIndex: 1,
  },
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: MAP_HEIGHT - 30,
    bottom: 0,
    zIndex: 3,
  },
  titleGroup: {
    transform: [{ translateY: 8 }],
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#0A0D14',
    position: 'relative',
    top: 15,
    marginBottom: spacing.lg + 10,
  },
  inputGroup: {
    marginTop: -5,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E4E9',
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputIcon: {
    marginLeft: -7,
    marginRight: spacing.sm - 7,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '300',
  },
  inputEmpty: {
    color: '#868C98',
  },
  inputFilled: {
    color: '#0A0D14',
  },
  addressBadge: {
    backgroundColor: palette.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#0A0D14',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    transform: [{ translateY: -110 }],
  },
  addressBadgeWrapper: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  addressBadgeText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#0A0D14',
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH * 0.6 - 40,
  },
  continueButtonContainer: {
    position: 'absolute',
    bottom: 57,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 3,
  },
  continueButton: {
    backgroundColor: '#191BDF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Manrope',
      android: 'Manrope',
      web: "'Manrope', sans-serif",
      default: 'Manrope',
    }),
    color: palette.white,
    textAlign: 'center',
  },
});
