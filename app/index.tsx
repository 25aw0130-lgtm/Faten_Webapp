import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ONBOARDING_KEY = "has_seen_onboarding";
const HAS_USED_APP_KEY = "has_used_app";

// DEV-ONLY: the first time this module loads in a fresh JS bundle
// (i.e. every time you restart `npx expo start` and reload/rescan the
// QR code), clear the onboarding + usage flags so you can re-test the
// first-launch flow. This flag lives at module scope, so navigating
// back to this screen within the same running session (e.g. pressing
// the home icon) does NOT re-clear it — only a full bundle reload does.
let hasResetDevFlags = false;

const TRAIL_COUNT = 5;
const DOTS_PER_TRAIL = 12;
const RADIUS_X = 130;
const RADIUS_Y = 55;
const STEPS = 200;

function makeOrbitInterpolate(
  anim: Animated.Value,
  offsetRatio: number,
  radiusX: number,
  radiusY: number,
  axis: "x" | "y",
) {
  const inputRange = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);

  const outputRange = inputRange.map((t) => {
    const angle = (t + offsetRatio) * 2 * Math.PI;
    return axis === "x" ? Math.sin(angle) * radiusX : Math.cos(angle) * radiusY;
  });

  return anim.interpolate({ inputRange, outputRange });
}

function OrbitTrail({ trailIndex }: { trailIndex: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const baseOffset = trailIndex / TRAIL_COUNT;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  return (
    <>
      {Array.from({ length: DOTS_PER_TRAIL }, (_, dotIndex) => {
        const trailOffset = (dotIndex / DOTS_PER_TRAIL) * 0.2;
        const dotRatio = baseOffset - trailOffset;

        const opacity = 0.15 + (dotIndex / DOTS_PER_TRAIL) * 0.85;
        const size = 2 + (dotIndex / DOTS_PER_TRAIL) * 8;

        const translateX = makeOrbitInterpolate(
          anim,
          dotRatio,
          RADIUS_X,
          RADIUS_Y,
          "x",
        );

        const translateY = makeOrbitInterpolate(
          anim,
          dotRatio,
          RADIUS_X,
          RADIUS_Y,
          "y",
        );

        const isHead = dotIndex === DOTS_PER_TRAIL - 1;

        return (
          <Animated.View
            key={dotIndex}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isHead ? "#FFF7C2" : "#E5BE63",
              opacity,
              shadowColor: "#FFE566",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: isHead ? 18 : 8,
              elevation: isHead ? 18 : 8,
              transform: [
                { translateX },
                { translateY },
                { translateY: 45 },
                { rotateZ: "-18deg" },
              ],
            }}
          />
        );
      })}
    </>
  );
}

function Stardust() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const stars = [
    { x: -120, y: 120, size: 5, delay: 0 },
    { x: 95, y: 130, size: 4, delay: 0.15 },
    { x: -75, y: 170, size: 3, delay: 0.3 },
    { x: 125, y: 190, size: 5, delay: 0.45 },
    { x: 0, y: 205, size: 3, delay: 0.6 },
  ];

  return (
    <>
      {stars.map((star, index) => {
        const inputRange = [0, star.delay, 1];
        const translateX = anim.interpolate({
          inputRange,
          outputRange: [star.x, star.x, 0],
        });

        const translateY = anim.interpolate({
          inputRange,
          outputRange: [star.y, star.y, 40],
        });

        const opacity = anim.interpolate({
          inputRange: [0, star.delay, 0.75, 1],
          outputRange: [0, 0, 1, 0],
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0.5, 1.2, 0.4],
        });

        return (
          <Animated.Text
            key={index}
            style={[
              styles.star,
              {
                fontSize: star.size * 4,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          >
            ✦
          </Animated.Text>
        );
      })}
    </>
  );
}

function ShootingStar() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
      ]),
    ).start();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 180],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 130],
  });

const opacity = anim.interpolate({
  inputRange: [0, 0.2, 0.6, 1],
  outputRange: [0, 0.35, 0.25, 0],
});
  return (
    <Animated.View
      style={[
        styles.shootingStar,
        {
          opacity,
          transform: [{ translateX }, { translateY }, { rotateZ: "25deg" }],
        },
      ]}
    >
      <View style={styles.shootingLine} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  // ---- onboarding check: redirect to /onboarding only on first-ever launch ----
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [hasUsedApp, setHasUsedApp] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        if (__DEV__ && !hasResetDevFlags) {
          hasResetDevFlags = true;
          await AsyncStorage.multiRemove([ONBOARDING_KEY, HAS_USED_APP_KEY]);
        }

        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (seen !== "true") {
          router.replace("/onboarding");
          return;
        }

        const used = await AsyncStorage.getItem(HAS_USED_APP_KEY);
        setHasUsedApp(used === "true");
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
      }
      setCheckingOnboarding(false);
    };

    checkOnboarding();
  }, []);

  const goToDiagnosis = async () => {
    try {
      await AsyncStorage.setItem(HAS_USED_APP_KEY, "true");
    } catch (err) {
      console.error("Failed to save app-usage flag:", err);
    }
    router.push("/genre");
  };

  const smallTitleAnim = useRef(new Animated.Value(0)).current;
  const bigTitleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  const buttonScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const buttonFloat = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const smallTitleY = smallTitleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const bigTitleY = bigTitleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const buttonY = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const cardScale = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.06, 1],
  });

  const cardBrightness = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.88, 1, 0.88],
  });

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(smallTitleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(bigTitleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pressAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pressAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // While checking AsyncStorage (or if we're about to redirect to
  // onboarding), render nothing so the home screen doesn't flash
  // briefly before the redirect happens.
  if (checkingOnboarding) {
    return <View style={styles.blankLoading} />;
  }

  return (
    <ImageBackground
      source={require("../assets/images/top-bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <ShootingStar />

      <Animated.View
        style={[styles.cardArea, { transform: [{ translateY: floatY }] }]}
      >
        <View style={styles.glow} />

        <Stardust />

        {Array.from({ length: TRAIL_COUNT }, (_, i) => (
          <OrbitTrail key={i} trailIndex={i} />
        ))}

        <Animated.Image
          source={require("../assets/images/top-card.png")}
          style={[
            styles.cardImage,
            {
        
              transform: [{ scale: cardScale }],
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.smallTitle,
          {
            opacity: smallTitleAnim,
            transform: [{ translateY: smallTitleY }],
          },
        ]}
      >
        心が求める、
      </Animated.Text>

      <Animated.Text
        style={[
          styles.bigTitle,
          {
            opacity: bigTitleAnim,
            transform: [{ translateY: bigTitleY }],
          },
        ]}
      >
        物語へ。
      </Animated.Text>

      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            opacity: buttonAnim,
            transform: [{ translateY: buttonY }],
          },
        ]}
      >
        {!hasUsedApp ? (
          <Animated.View
            style={[
              styles.pressButtonOuter,
              {
                transform: [
                  { translateY: buttonFloat },
                  { scale: buttonScale },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.button}
              onPress={goToDiagnosis}
            >
              <Text style={styles.buttonText}>はじめる</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            <Animated.View
              style={[
                styles.pressButtonOuter,
                {
                  transform: [
                    { translateY: buttonFloat },
                    { scale: buttonScale },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.primaryButton}
                onPress={goToDiagnosis}
              >
                <Ionicons name="sparkles" size={18} color="#F0C177" />
                <Text style={styles.primaryButtonText}>はじめる</Text>
                <Ionicons name="chevron-forward" size={20} color="#F0C177" />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.secondaryButton}
              onPress={() => router.push("/liked-books")}
            >
              <View style={styles.secondaryIconCircle}>
                <Ionicons name="book-outline" size={16} color="#F0C177" />
              </View>
              <Text style={styles.secondaryButtonText}>保存した本を見る</Text>
              <Ionicons name="chevron-forward" size={20} color="#F0C177" />
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  blankLoading: {
    flex: 1,
    backgroundColor: "#07091A",
  },

  bg: {
    flex: 1,
    alignItems: "center",
    paddingTop: 90,
    overflow: "hidden",
  },

  cardArea: {
    position: "absolute",
    top: 220,
    alignItems: "center",
    justifyContent: "center",
    width: 280,
    height: 280,
  },

  glow: {
    position: "absolute",
    width: 220,
    height: 260,
    borderRadius: 140,
    shadowColor: "#C9A0FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 45,
    elevation: 20,
  },

  cardImage: {
    width: 90,
    height: 200,
    top: 10,
    borderRadius: 14,
    marginBottom: 35,
    elevation: 18,
  },

  star: {
    position: "absolute",
    color: "#FFF7C2",
    textShadowColor: "#FFE566",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  shootingStar: {
    position: "absolute",
    top: 160,
    width: 120,
    height: 4,
    zIndex: 5,
  },

shootingLine: {
  width: 180,
  height: 2,
  borderRadius: 10,
  backgroundColor: "rgba(255, 255, 255, 0.41)",
},

  smallTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: 2,
  },

  bigTitle: {
    color: "#E5BE63",
    fontSize: 56,
    fontWeight: "bold",
    marginTop: 10,
    letterSpacing: 3,
      zIndex: 2,
  },

  buttonWrapper: {
    position: "absolute",
    bottom: 70,
    width: "82%",
    alignItems: "center",
  },

  pressButtonOuter: {
    width: "100%",
    borderRadius: 35,
    shadowColor: "#a77302",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },

  button: {
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5BE63",
    backgroundColor: "rgba(54,34,86,0.8)",
    alignItems: "center",
  },

  buttonText: {
    color: "#E5BE63",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 2,
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5BE63",
    backgroundColor: "rgba(54,34,86,0.8)",
  },

  primaryButtonText: {
    color: "#F0C177",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(240,193,119,0.4)",
    backgroundColor: "rgba(10, 8, 28, 0.55)",
  },

  secondaryIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(240,193,119,0.15)",
  },

  secondaryButtonText: {
    color: "#F0C177",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
