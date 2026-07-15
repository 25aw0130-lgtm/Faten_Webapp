import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================================
// THEME
// ============================================================
const COLORS = {
  text: "rgba(248,247,255,0.95)",
  text2: "rgba(226,223,255,0.82)",
  text3: "rgba(198,192,255,0.65)",
  glow: "rgba(170,145,255,0.22)",
  glowStrong: "rgba(190,170,255,0.35)",
  border: "rgba(195,175,255,0.28)",
  line: "rgba(188,174,255,0.25)",
  star: "#ECE6FF",
  mistBlue: "rgba(105,155,255,0.16)",
  mistPurple: "rgba(178,120,255,0.16)",
  centerStar: "rgba(255, 245, 171, 0.8)",
  hint: "rgb(255, 214, 163)",
  cardOrange: "rgb(255, 214, 163)",
  cardOrangeDim: "rgba(255, 214, 163, 0.8)",
  cardOrangeSoft: "rgba(255, 214, 163, 0.65)",
};

// Card sizes for the "main" (top) card vs. the two smaller side cards
const CARD_SIZE = {
  main: { width: 150, height: 240, wrapWidth: 180 },
  side: { width: 126, height: 202, wrapWidth: 150 },
};

// Animation timing, named so intent is obvious at a glance
const TIMING = {
  float: 2400,
  glowPulse: 1800,
  ringSpin: 18000,
  starTwinkle: 1200,
  dustDrift: 4200,
  pressIn: 180,
  pressSettle: 160,
};

// ============================================================
// CONTENT
// ============================================================
type MoodType = "healing" | "reflection" | "hope" | "adventure" | "change";
type CardKey = keyof typeof TAROT_CARDS;

// Which 3 cards are offered for each mood result from the diagnosis quiz
const CARDS_BY_MOOD: Record<MoodType, CardKey[]> = {
  healing: ["STAR", "TEMPERANCE", "SUN"],
  reflection: ["MOON", "HERMIT", "STAR"],
  hope: ["SUN", "STAR", "TEMPERANCE"],
  adventure: ["SUN", "WHEEL", "MOON"],
  change: ["WHEEL", "MOON", "HERMIT"],
};

const TAROT_CARDS = {
  STAR: {
    name: "THE STAR",
    keyword: "癒し・希望",
    message: "希望の光が差し込み、心が癒されていく時期です。",
    image: require("../assets/images/star_card.png"),
  },
  SUN: {
    name: "THE SUN",
    keyword: "前向き・喜び",
    message: "明るい光が、あなたの背中をそっと押してくれます。",
    image: require("../assets/images/sun_card.png"),
  },
  MOON: {
    name: "THE MOON",
    keyword: "不安・感情",
    message: "まだ見えない気持ちや不安が、あなたの中にあるようです。",
    image: require("../assets/images/moon_card.png"),
  },
  HERMIT: {
    name: "THE HERMIT",
    keyword: "内省・静けさ",
    message: "一人の時間の中で、大切な答えが見つかりそうです。",
    image: require("../assets/images/hermit_card.png"),
  },
  WHEEL: {
    name: "WHEEL OF FORTUNE",
    keyword: "変化・運命",
    message: "運命が動き出し、新しい流れが訪れようとしています。",
    image: require("../assets/images/wheel_of_fortune_card.png"),
  },
  TEMPERANCE: {
    name: "TEMPERANCE",
    keyword: "調和・バランス",
    message: "心のバランスを整える、やさしい時間が必要です。",
    image: require("../assets/images/temperance_card.png"),
  },
};

// Screen copy, centralized so tone stays consistent and is easy to edit
const COPY = {
  title: "直感で惹かれる一枚を選んでください",
  subtitle: "今のあなたに寄り添う一冊へと導きます",
  hintSelect: "✦ カードをタップして選択 ✦",
  hintConfirm: "✦ もう一度タップして決定 ✦",
};

// Fixed positions for ambient background particles (teammate's design)
const STAR_DATA = [
  { top: 70, left: 35, size: 10, delay: 0 },
  { top: 120, left: 320, size: 13, delay: 400 },
  { top: 190, left: 60, size: 8, delay: 800 },
  { top: 260, left: 335, size: 10, delay: 1200 },
  { top: 350, left: 38, size: 14, delay: 1600 },
  { top: 470, left: 320, size: 9, delay: 2000 },
  { top: 585, left: 70, size: 12, delay: 2400 },
  { top: 675, left: 290, size: 10, delay: 2800 },
];

const DUST_DATA = [
  { top: 170, left: 90, delay: 0 },
  { top: 230, left: 270, delay: 400 },
  { top: 310, left: 55, delay: 800 },
  { top: 380, left: 330, delay: 1200 },
  { top: 470, left: 120, delay: 1600 },
  { top: 540, left: 260, delay: 2000 },
  { top: 635, left: 45, delay: 2400 },
  { top: 690, left: 315, delay: 2800 },
];

// ============================================================
// AMBIENT BACKGROUND PIECES
// ============================================================
function TwinkleStar({ top, left, size, delay }: (typeof STAR_DATA)[number]) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: TIMING.starTwinkle,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.8,
            duration: TIMING.starTwinkle,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.18,
            duration: TIMING.starTwinkle,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: TIMING.starTwinkle,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.starParticle,
        { top, left, fontSize: size, opacity, transform: [{ scale }] },
      ]}
    >
      ✦
    </Animated.Text>
  );
}

function DustParticle({ top, left, delay }: (typeof DUST_DATA)[number]) {
  const move = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(move, {
            toValue: 1,
            duration: TIMING.dustDrift,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.75,
            duration: TIMING.dustDrift / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(move, {
            toValue: 0,
            duration: TIMING.dustDrift,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.18,
            duration: TIMING.dustDrift / 2,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const translateY = move.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const translateX = move.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });

  return (
    <Animated.View
      style={[styles.dust, { top, left, opacity, transform: [{ translateY }, { translateX }] }]}
    />
  );
}

// ============================================================
// TAROT CARD (floating, glowing, tappable)
// ============================================================
type FloatingCardProps = {
  cardKey: CardKey;
  index: number;
  moodType: string;
  genre?: string;
  selectedCard: string | null;
  onSelect: (card: string) => void;
  main?: boolean;
};

function FloatingCard({
  cardKey,
  index,
  moodType,
  genre,
  selectedCard,
  onSelect,
  main = false,
}: FloatingCardProps) {
  const card = TAROT_CARDS[cardKey];
  const size = main ? CARD_SIZE.main : CARD_SIZE.side;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(index * 350),
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: TIMING.float,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: TIMING.float,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: TIMING.glowPulse,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: TIMING.glowPulse,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: TIMING.ringSpin,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const isDimmed = selectedCard !== null && selectedCard !== cardKey;

  // First tap: select this card. Second tap on the same card: continue to results.
  const handlePress = () => {
    if (selectedCard === cardKey) {
      router.push({
        pathname: "/result",
        params: { card: cardKey, type: moodType || "healing", genre },
      });
      return;
    }

    onSelect(cardKey);

    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 1.12,
        duration: TIMING.pressIn,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 1.04,
        duration: TIMING.pressSettle,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, main ? -14 : -10],
  });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.9] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const ringRotate = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const tilt = main ? "0deg" : index === 1 ? "-6deg" : "6deg";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <Animated.View
        style={[
          styles.cardWrap,
          main && styles.mainCardWrap,
          {
            opacity: isDimmed ? 0.25 : 1,
            transform: [{ translateY }, { scale: pressAnim }, { rotate: tilt }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.cardOuterGlow,
            main && styles.mainOuterGlow,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />

        <Animated.View
          style={[
            styles.magicRing,
            main && styles.mainMagicRing,
            { transform: [{ rotate: ringRotate }] },
          ]}
        >
          <View style={styles.ringLine} />
          <View style={[styles.ringLine, { transform: [{ rotate: "90deg" }] }]} />
          <Text style={styles.ringStarTop}>✦</Text>
          <Text style={styles.ringStarBottom}>✧</Text>
        </Animated.View>

        <View style={styles.cardLightBase} />

        <View style={styles.cardFrame}>
          <Image
            source={card.image}
            style={{ width: size.width, height: size.height }}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.cardName, main && styles.mainCardName]}>{card.name}</Text>
        <Text style={styles.keyword}>{card.keyword}</Text>
        <Text style={styles.cardMessage}>{card.message}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============================================================
// SCREEN
// ============================================================
export default function TarotScreen() {
  const { type, genre } = useLocalSearchParams();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const moodType = Array.isArray(type) ? type[0] : type;
  const genreParam = Array.isArray(genre) ? genre[0] : genre;
  const cards = (moodType && CARDS_BY_MOOD[moodType as MoodType]) || CARDS_BY_MOOD.healing;

  // Pulsing center star between the title and the cards
  const centerStarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerStarAnim, {
          toValue: 1,
          duration: TIMING.starTwinkle,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(centerStarAnim, {
          toValue: 0,
          duration: TIMING.starTwinkle,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const centerStarScale = centerStarAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const centerStarOpacity = centerStarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const centerStarRotate = centerStarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "18deg"],
  });

  return (
    <ImageBackground
      source={require("../assets/images/tarot-bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {STAR_DATA.map((star, i) => (
          <TwinkleStar key={`star-${i}`} {...star} />
        ))}
        {DUST_DATA.map((dust, i) => (
          <DustParticle key={`dust-${i}`} {...dust} />
        ))}

        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{COPY.title}</Text>
          <Text style={styles.subtitle}>{COPY.subtitle}</Text>

          <View style={styles.lineArea}>
            <View style={styles.moonLine} />
            <Animated.Text
              style={[
                styles.centerStar,
                {
                  opacity: centerStarOpacity,
                  transform: [{ scale: centerStarScale }, { rotate: centerStarRotate }],
                },
              ]}
            >
              ✦
            </Animated.Text>
            <View style={styles.moonLine} />
          </View>

          <View style={styles.cardArea}>
            <FloatingCard
              cardKey={cards[0]}
              index={0}
              moodType={moodType || "healing"}
              genre={genreParam}
              selectedCard={selectedCard}
              onSelect={setSelectedCard}
              main
            />

            <View style={styles.bottomRow}>
              <FloatingCard
                cardKey={cards[1]}
                index={1}
                moodType={moodType || "healing"}
                genre={genreParam}
                selectedCard={selectedCard}
                onSelect={setSelectedCard}
              />
              <FloatingCard
                cardKey={cards[2]}
                index={2}
                moodType={moodType || "healing"}
                genre={genreParam}
                selectedCard={selectedCard}
                onSelect={setSelectedCard}
              />
            </View>
          </View>

          <Text style={styles.hint}>
            {selectedCard ? COPY.hintConfirm : COPY.hintSelect}
          </Text>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  // --- layout shells ---
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(5, 4, 18, 0.58)", overflow: "hidden" },
  container: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 72,
    alignItems: "center",
  },

  // --- corner frame decoration ---
  cornerTL: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 52,
    height: 52,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: COLORS.border,
  },
  cornerTR: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 52,
    height: 52,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  cornerBL: {
    position: "absolute",
    bottom: 18,
    left: 18,
    width: 52,
    height: 52,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: COLORS.border,
  },
  cornerBR: {
    position: "absolute",
    bottom: 18,
    right: 18,
    width: 52,
    height: 52,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },

  // --- ambient particles ---
  starParticle: { position: "absolute", color: COLORS.star, zIndex: 5 },
  dust: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: "rgba(236,230,255,0.9)",
    zIndex: 4,
  },

  // --- header text ---
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.5,
    lineHeight: 22,
    textAlign: "center",
    textShadowColor: "rgba(188,174,255,0.65)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  subtitle: {
    color: COLORS.text2,
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 6,
    textAlign: "center",
  },

  // --- divider with center star ---
  lineArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
    marginBottom: 18,
  },
  moonLine: { width: 82, height: 1, backgroundColor: COLORS.line },
  centerStar: {
    color: COLORS.centerStar,
    fontSize: 25,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // --- card area ---
  cardArea: { width: "100%", alignItems: "center" },
  bottomRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  // --- individual card ---
  cardWrap: { width: 150, alignItems: "center", position: "relative" },
  mainCardWrap: { width: 180 },
  cardOuterGlow: {
    position: "absolute",
    top: 14,
    width: 150,
    height: 210,
    borderRadius: 40,
    backgroundColor: COLORS.mistBlue,
  },
  mainOuterGlow: { top: 8, width: 185, height: 260, backgroundColor: COLORS.mistBlue },
  magicRing: {
    position: "absolute",
    top: 80,
    width: 138,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mainMagicRing: { top: 96, width: 190, height: 86 },
  ringLine: { position: "absolute", width: 120, height: 1, backgroundColor: COLORS.line },
  ringStarTop: { position: "absolute", top: -12, color: COLORS.star, fontSize: 13 },
  ringStarBottom: { position: "absolute", bottom: -12, color: COLORS.text3, fontSize: 12 },
  cardLightBase: {
    position: "absolute",
    bottom: 54,
    width: 150,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.glow,
  },
  cardFrame: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#BCAEFF",
    shadowOpacity: 0.75,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },

  // --- card text ---
  cardName: {
    color: COLORS.cardOrange,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
    letterSpacing: 1.4,
  },
  mainCardName: { fontSize: 16 },
  keyword: { color: COLORS.cardOrangeDim, fontSize: 12, marginTop: 4, textAlign: "center" },
  cardMessage: {
    color: COLORS.cardOrangeSoft,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 6,
  },

  // --- footer hint ---
  hint: {
    color: COLORS.hint,
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 34,
    textAlign: "center",
  },
});
