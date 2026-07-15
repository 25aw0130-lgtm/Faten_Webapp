import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ---- theme: warm gold palette, tiered for clear hierarchy ----
const COLORS = {
  cream: "#FFF6E0", // brightest — main titles, message text
  gold: "#FFD76A", // primary accent — stars, arrows, section titles, JP subtitles
  goldBright: "#FFE9A8", // keywords, secondary buttons
  goldDim: "rgba(255, 215, 106, 0.78)", // muted labels
  goldFaint: "rgba(255, 215, 106, 0.4)", // dividers, borders, numbering
};

// ---- data/content: kept from my own code ----
const cardResults = {
  STAR: {
    name: "The Star（星）",
    keyword: "希望・癒し・再生",
    image: require("../assets/images/star_card.png"),
    shortMessage: "希望の光が差し込み、心が癒されていく時期です。",
    meaning:
      "星は、希望・癒し・再生を表すカードです。\n\n今はまだ不安や迷いが残っていたとしても、少しずつ心が回復し、未来へ向かう光が見え始めています。\n\n焦らなくても大丈夫です。あなたの歩く道には、新しい可能性が待っています。",
    personalMessage:
      "あなたはこれまで、たくさんのことを頑張ってきました。\n\n今は自分を責めるよりも、少しだけ心を休ませる時間が必要です。\n\nこの本が、あなたの心を優しく照らし、前へ進む力を届けてくれますように。",
  },

  SUN: {
    name: "The Sun（太陽）",
    keyword: "前向き・喜び・成功",
    image: require("../assets/images/sun_card.png"),
    shortMessage: "明るい光が、あなたの背中をそっと押してくれます。",
    meaning:
      "太陽は、喜び・成功・前向きなエネルギーを表すカードです。\n\n心を曇らせていたものが少しずつ晴れ、自分らしく輝ける時期が近づいています。\n\n素直な気持ちを大切にすることで、新しい楽しさや発見に出会えるでしょう。",
    personalMessage:
      "今のあなたには、気持ちを明るくしてくれる物語が似合っています。\n\n小さな幸せに目を向けることで、見える景色が少し変わるかもしれません。\n\nこの本が、あなたの毎日に温かな光を届けますように。",
  },

  MOON: {
    name: "The Moon（月）",
    keyword: "不安・感情・本音",
    image: require("../assets/images/moon_card.png"),
    shortMessage: "まだ見えない気持ちや不安が、あなたの中にあるようです。",
    meaning:
      "月は、不安・迷い・本音を表すカードです。\n\nまだ言葉にできない気持ちや、心の奥にしまっている感情が静かに揺れているのかもしれません。\n\n今は無理に答えを出そうとせず、自分の心と向き合う時間を大切にしましょう。",
    personalMessage:
      "答えが見つからなくても大丈夫です。\n\n今感じている不安や迷いも、あなたにとって大切な感情のひとつです。\n\nこの本が、あなたの気持ちを少しずつ整理するきっかけになりますように。",
  },

  HERMIT: {
    name: "The Hermit（隠者）",
    keyword: "内省・静けさ・探求",
    image: require("../assets/images/hermit_card.png"),
    shortMessage: "一人の時間の中で、大切な答えが見つかりそうです。",
    meaning:
      "隠者は、内省・探求・静けさを表すカードです。\n\n周りの声よりも、今は自分自身の心の声に耳を傾けることが大切な時期かもしれません。\n\n静かな時間の中に、あなたが探している答えが隠れています。",
    personalMessage:
      "今のあなたには、ゆっくり考える時間が必要です。\n\n無理に前へ進もうとしなくても、立ち止まることで見えるものがあります。\n\nこの本が、あなた自身を見つめ直す時間を優しく支えてくれますように。",
  },

  WHEEL: {
    name: "Wheel of Fortune（運命の輪）",
    keyword: "変化・運命・転機",
    image: require("../assets/images/wheel_of_fortune_card.png"),
    shortMessage: "運命が動き出し、新しい流れが訪れようとしています。",
    meaning:
      "運命の輪は、変化・転機・新しい流れを表すカードです。\n\n今まで止まっていたものが動き始め、新しい出会いや出来事が訪れようとしています。\n\n変化を恐れず受け入れることで、新しい可能性が広がるでしょう。",
    personalMessage:
      "人生には、思い通りにならないこともあります。\n\nしかしその変化の中にこそ、新しいチャンスが隠れています。\n\nこの本が、あなたの背中をそっと押してくれますように。",
  },

  TEMPERANCE: {
    name: "Temperance（節制）",
    keyword: "調和・バランス・回復",
    image: require("../assets/images/temperance_card.png"),
    shortMessage: "心のバランスを整える、やさしい時間が必要です。",
    meaning:
      "節制は、調和・バランス・回復を表すカードです。\n\n今は無理に前へ進むよりも、自分の心と体のペースを整えることが大切な時期かもしれません。\n\n焦らず、一歩ずつ進むことで、穏やかな流れが戻ってくるでしょう。",
    personalMessage:
      "今のあなたには、穏やかでやさしい物語が必要です。\n\n誰かと比べたり、結果を急いだりしなくても大丈夫。\n\nこの本が、あなたの心に小さな休息と安心を届けてくれますように。",
  },
};

type CardKey = keyof typeof cardResults;

// ---- design: kept from teammate's code (floating stars) ----
const floatingStars = [
  { left: "12%", top: "12%", size: 18, delay: 0 },
  { left: "78%", top: "16%", size: 12, delay: 300 },
  { left: "64%", top: "28%", size: 20, delay: 700 },
  { left: "18%", top: "36%", size: 10, delay: 1000 },
  { left: "84%", top: "46%", size: 16, delay: 1300 },
  { left: "10%", top: "58%", size: 22, delay: 500 },
  { left: "72%", top: "66%", size: 11, delay: 900 },
  { left: "28%", top: "78%", size: 14, delay: 1500 },
  { left: "86%", top: "84%", size: 18, delay: 1800 },
];

function FloatingStar({ left, top, size, delay }: any) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 1],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.3],
  });

  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.floatingStar,
        {
          left,
          top,
          fontSize: size,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      ✦
    </Animated.Text>
  );
}

export default function ResultScreen() {
  // ---- params/logic: kept from my own code ----
  const { card, type, genre } = useLocalSearchParams();
  const [showDetail, setShowDetail] = useState(false);

  const cardKey =
    typeof card === "string" && card in cardResults
      ? (card as CardKey)
      : "STAR";

  const moodType = Array.isArray(type) ? type[0] : type || "healing";
  const genreParam = Array.isArray(genre) ? genre[0] : genre;

  const result = cardResults[cardKey];

  const splitName = result.name.split("（");
  const enName = splitName[0].toUpperCase();
  const jpName = splitName[1]?.replace("）", "") || "";

  // ---- animation refs: needed for teammate's design ----
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const detailAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const shineX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 320],
  });

  const runEntrance = () => {
    entranceAnim.setValue(0);

    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    runEntrance();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  // ---- logic: kept from my own code (handles back navigation) ----
  const handleBack = () => {
    setShowDetail(false);
    shineAnim.setValue(0);
    runEntrance();
  };

  const handleShowDetail = () => {
    detailAnim.setValue(0);
    setShowDetail(true);

    Animated.timing(detailAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return (
    <ImageBackground
      source={require("../assets/images/tarot-bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {floatingStars.map((star, index) => (
          <FloatingStar key={index} {...star} />
        ))}

        <View style={styles.container}>
          {showDetail ? (
            <Animated.View
              style={[
                styles.detailWrapper,
                {
                  opacity: detailAnim,
                  transform: [
                    {
                      translateY: detailAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [26, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.topStar}>✦</Text>
              <Text style={styles.detailEnTitle}>{enName}</Text>
              <Text style={styles.detailJpTitle}>{jpName}</Text>

              <View style={styles.keywordPill}>
                <Text style={styles.keyword}>{result.keyword}</Text>
              </View>

              <View style={styles.goldLineBox}>
                <View style={styles.line} />
                <Text style={styles.lineStar}>✦</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.number}>01</Text>
                <Text style={styles.sectionTitle}>カードの意味</Text>
                <Text style={styles.detailText}>{result.meaning}</Text>

                <View style={styles.divider} />

                <Text style={styles.number}>02</Text>
                <Text style={styles.sectionTitle}>あなたへのメッセージ</Text>
                <Text style={styles.detailText}>{result.personalMessage}</Text>
              </View>

              <TouchableOpacity
                style={styles.backTextButton}
                onPress={handleBack}
              >
                <Text style={styles.backText}>← 結果画面へ戻る</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.mainWrapper,
                {
                  opacity: entranceAnim,
                  transform: [
                    {
                      translateY: entranceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.topStar}>✦</Text>

              <Text style={styles.enTitle}>{enName}</Text>
              <Text style={styles.jpTitle}>{jpName}</Text>

              <View style={styles.goldLineBox}>
                <View style={styles.line} />
                <Text style={styles.lineStar}>✦</Text>
                <View style={styles.line} />
              </View>

              <Animated.View
                style={[
                  styles.cardFrame,
                  {
                    transform: [{ translateY: floatY }],
                  },
                ]}
              >
                <View style={styles.cardGlow} />
                <Image
                  source={result.image}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </Animated.View>

              <View style={styles.keywordPill}>
                <Text style={styles.keyword}>{result.keyword}</Text>
              </View>

              <View style={styles.messageBox}>
                <Text style={styles.messageLabel}>
                  今日あなたに届いたメッセージ
                </Text>
                <Text style={styles.messageText}>
                  「{result.shortMessage}」
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.nextButton}
                onPress={() =>
                  router.push({
                    pathname: "/book-result",
                    params: {
                      card: cardKey,
                      type: moodType,
                      genre: genreParam,
                    },
                  })
                }
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.buttonShine,
                    {
                      transform: [{ translateX: shineX }, { rotate: "18deg" }],
                    },
                  ]}
                />

                <Text style={styles.nextButtonStar}>✦</Text>
                <Text style={styles.nextButtonText}>運命の一冊を見る</Text>
                <Text style={styles.nextButtonStar}>✦</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.detailButton}
                onPress={handleShowDetail}
              >
                <Text style={styles.detailButtonText}>カードの意味を見る</Text>
                <Text style={styles.detailArrow}>→</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 4, 19, 0.78)",
  },

  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 34,
    paddingBottom: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  floatingStar: {
    position: "absolute",
    color: COLORS.gold,
  },

  mainWrapper: {
    width: "100%",
    alignItems: "center",
  },

  topStar: {
    color: COLORS.gold,
    fontSize: 22,
    marginBottom: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },

  enTitle: {
    color: COLORS.cream,
    fontSize: 29,
    letterSpacing: 4,
    textAlign: "center",
    textShadowColor: "rgba(188,174,255,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  jpTitle: {
    color: COLORS.gold,
    fontSize: 16,
    marginTop: 4,
    textAlign: "center",
    letterSpacing: 2,
  },

  goldLineBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 14,
    marginBottom: 14,
  },

  line: {
    width: 70,
    height: 1,
    backgroundColor: COLORS.goldFaint,
  },

  lineStar: {
    color: COLORS.gold,
    fontSize: 16,
  },

  cardFrame: {
    width: 184,
    height: 276,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  cardGlow: {
    position: "absolute",
    width: 194,
    height: 276,
    borderRadius: 24,
    backgroundColor: "rgba(255, 215, 106, 0.08)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 14,
  },

  cardImage: {
    width: 172,
    height: 266,
  },

  keywordPill: {
    paddingVertical: 7,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: "rgba(255, 215, 106, 0.1)",
    borderWidth: 1,
    borderColor: COLORS.goldFaint,
  },

  keyword: {
    color: COLORS.goldBright,
    fontSize: 14,
    letterSpacing: 1.6,
    textAlign: "center",
  },

  messageBox: {
    width: "100%",
    marginTop: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.goldFaint,
    alignItems: "center",
  },

  messageLabel: {
    color: COLORS.goldDim,
    fontSize: 12,
    letterSpacing: 1.8,
    marginBottom: 9,
  },

  messageText: {
    color: COLORS.cream,
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    letterSpacing: 1,
  },

  nextButton: {
    width: "100%",
    maxWidth: 320,
    height: 58,
    borderRadius: 999,
    marginTop: 18,
    overflow: "hidden",
    backgroundColor: "rgba(77, 35, 122, 0.9)",
    borderWidth: 1.6,
    borderColor: "#FFD76A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.72,
    shadowRadius: 18,
    elevation: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 26,
  },

  buttonShine: {
    position: "absolute",
    left: 0,
    top: -30,
    width: 52,
    height: 140,
    backgroundColor: "rgba(255,255,255,0.24)",
  },

  nextButtonText: {
    color: COLORS.cream,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 1.8,
    textAlign: "center",
    textShadowColor: "rgba(188,174,255,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  nextButtonStar: {
    color: COLORS.gold,
    fontSize: 20,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  detailButton: {
    width: "100%",
    maxWidth: 320,
    height: 44,
    marginTop: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.goldFaint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
  },

  detailButtonText: {
    color: COLORS.goldBright,
    fontSize: 14,
    letterSpacing: 1.5,
  },

  detailArrow: {
    color: COLORS.gold,
    fontSize: 20,
  },

  detailWrapper: {
    width: "100%",
    alignItems: "center",
  },

  detailEnTitle: {
    color: COLORS.cream,
    fontSize: 25,
    letterSpacing: 4,
    textAlign: "center",
  },

  detailJpTitle: {
    color: COLORS.gold,
    fontSize: 16,
    marginTop: 6,
    marginBottom: 12,
    letterSpacing: 2,
  },

  detailCard: {
    width: "100%",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: "rgba(22, 12, 42, 0.76)",
    borderWidth: 1,
    borderColor: COLORS.goldFaint,
  },

  number: {
    color: COLORS.goldFaint,
    fontSize: 11,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 6,
  },

  sectionTitle: {
    color: COLORS.gold,
    fontSize: 17,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 1.5,
  },

  detailText: {
    color: COLORS.cream,
    fontSize: 13,
    lineHeight: 23,
    textAlign: "center",
  },

  divider: {
    width: 130,
    height: 1,
    backgroundColor: COLORS.goldFaint,
    marginTop: 22,
    marginBottom: 20,
    alignSelf: "center",
  },

  backTextButton: {
    marginTop: 20,
  },

  backText: {
    color: COLORS.gold,
    fontSize: 15,
    letterSpacing: 1.5,
  },
});
