import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ResultType = "healing" | "reflection" | "hope" | "adventure" | "change";

const questions: {
  text: string;
  choices: string[];
  types: ResultType[];
}[] = [
    {
      text: "ふと足を止めて、思わず見入ってしまうのはどれ？",
      choices: [
        "揺れる炎や夕日の光",
        "波や雨、水面のゆらぎ",
        "人の表情や仕草",
        "静かな街並みや建物",
      ],
      types: ["adventure", "healing", "hope", "reflection"],
    },
    {
      text: "思わず耳を傾けたくなるのはどれ？",
      choices: [
        "パチパチとはぜる火の音",
        "雨や波の音",
        "人の笑い声や話し声",
        "静けさそのもの",
      ],
      types: ["adventure", "healing", "hope", "reflection"],
    },
    {
      text: "今、触れていたいと思う感覚はどれ？",
      choices: [
        "じんわりした温かさ",
        "やわらかく包まれる感覚",
        "風が抜けるような軽さ",
        "重みのある安心感",
      ],
      types: ["healing", "change", "adventure", "reflection"],
    },
    {
      text: "疲れた日に、自然と手が伸びる味はどれ？",
      choices: [
        "スパイスや刺激のある味",
        "はちみつやミルクのような甘さ",
        "ハーブや炭酸のような爽やかさ",
        "コーヒーやビターな苦味",
      ],
      types: ["change", "healing", "hope", "reflection"],
    },
    {
      text: "思わず深呼吸したくなる香りはどれ？",
      choices: [
        "焚き火や木の香り",
        "雨上がりの香り",
        "草や森の香り",
        "本屋や喫茶店の香り",
      ],
      types: ["adventure", "change", "healing", "reflection"],
    },
  ];

export default function DiagnosisScreen() {
  // ---- params/logic: kept from my own code ----
  const { genre } = useLocalSearchParams();
  const genreParam = Array.isArray(genre) ? genre[0] : genre;

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isNextPressed, setIsNextPressed] = useState(false);
  const [isBackPressed, setIsBackPressed] = useState(false);

  // ---- animation refs: needed for teammate's design ----
  const trailAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const trailMoveX = trailAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -110],
  });

  const trailOpacity = trailAnim.interpolate({
    inputRange: [0, 0.2, 0.75, 1],
    outputRange: [0, 1, 0.65, 0],
  });

  const buttonScale = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });

  const buttonFloat = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const progressPercent = ((current + 1) / questions.length) * 100;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(trailAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(trailAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (selected === null) {
      buttonAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [selected]);

  // ---- logic: kept exactly from my own code ----
  const calculateResult = (finalAnswers: number[]) => {
    const score: Record<ResultType, number> = {
      healing: 0,
      reflection: 0,
      hope: 0,
      adventure: 0,
      change: 0,
    };

    finalAnswers.forEach((answerIndex, questionIndex) => {
      const question = questions[questionIndex];
      if (!question) return;
      const type = question.types[answerIndex];
      if (!type) return;
      score[type] += 1;
    });

    const resultType = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];

    console.log("answers:", finalAnswers);
    console.log("score:", score);
    console.log("resultType:", resultType);

    return resultType;
  };

  const nextQuestion = () => {
    if (selected === null) return;

    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      const resultType = calculateResult(newAnswers);

      router.push({
        pathname: "/tarot",
        params: { type: resultType, genre: genreParam },
      });
    }
  };

  const goBack = () => {
    if (current === 0) {
      router.back();
    } else {
      setCurrent(current - 1);
      setSelected(null);
      setAnswers((prev) => prev.slice(0, -1));
    }
  };

  // ---- JSX / design: kept from teammate's code ----
  return (
    <LinearGradient
      colors={["#07091A", "#0D1028", "#141B3D", "#1A1230", "#07091A"]}
      locations={[0, 0.25, 0.55, 0.8, 1]}
      style={styles.container}
    >
      <View style={styles.starLayer} pointerEvents="none">
        {[
          { top: 80, left: 30, size: 10 },
          { top: 140, right: 40, size: 14 },
          { top: 220, left: 80, size: 8 },
          { top: 320, right: 70, size: 12 },
          { top: 430, left: 25, size: 10 },
          { top: 520, right: 30, size: 14 },
          { bottom: 260, left: 90, size: 8 },
          { bottom: 180, right: 80, size: 12 },
          { bottom: 120, left: 40, size: 10 },
          { bottom: 90, right: 25, size: 14 },
        ].map((star, index) => (
          <Text
            key={index}
            style={{
              position: "absolute",
              color: "rgba(255,216,155,0.1)",
              fontSize: star.size,
              ...star,
            }}
          >
            {index % 2 === 0 ? "✦" : "✧"}
          </Text>
        ))}
      </View>

      <View style={styles.topArea}>
        <TouchableOpacity onPress={goBack} style={styles.backIcon}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>

        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />

            <Animated.View
              style={[
                styles.particleTrail,
                {
                  left: `${progressPercent}%`,
                  opacity: trailOpacity,
                  transform: [{ translateX: trailMoveX }],
                },
              ]}
            >
              {Array.from({ length: 20 }).map((_, i) => {
                const stars = ["✦", "✧", "✦", "✦", "✧", "·"];
                const spread = i * 0.8;

                return (
                  <Animated.Text
                    key={i}
                    style={[
                      styles.sparkleStar,
                      {
                        right: i * 10,
                        top: ((i % 5) - 2) * spread,
                        opacity: 1 - i * 0.04,
                        transform: [{ scale: 1 - i * 0.025 }],
                      },
                    ]}
                  >
                    {stars[i % stars.length]}
                  </Animated.Text>
                );
              })}
            </Animated.View>
          </View>

          <Text style={styles.progressText}>
            {current + 1} / {questions.length}
          </Text>
        </View>
      </View>

      <Text style={styles.question}>{questions[current].text}</Text>

      <View style={styles.starLine}>
        <View style={styles.line} />
        <Text style={styles.star}>✦</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.grid}>
        {questions[current].choices.map((choice, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            style={[
              styles.choiceCard,
              selected === index && styles.selectedCard,
            ]}
            onPress={() => setSelected(index)}
          >
            {selected === index && <Text style={styles.check}>✓</Text>}
            <Text style={styles.choiceText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.backButton, isBackPressed && styles.backButtonPressed]}
          onPressIn={() => setIsBackPressed(true)}
          onPressOut={() => setIsBackPressed(false)}
          onPress={goBack}
        >
          <Text
            style={[
              styles.backButtonText,
              isBackPressed && styles.backButtonTextPressed,
            ]}
          >
            戻る
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={{
            transform: [
              { translateY: selected !== null ? buttonFloat : 0 },
              { scale: selected !== null ? buttonScale : 1 },
            ],
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.nextButton,
              selected === null
                ? styles.nextButtonDisabled
                : styles.nextButtonActive,
              isNextPressed && styles.nextButtonPressed,
            ]}
            onPressIn={() => setIsNextPressed(true)}
            onPressOut={() => setIsNextPressed(false)}
            onPress={nextQuestion}
          >
            <Text
              style={[
                styles.nextButtonText,
                selected === null
                  ? styles.nextButtonTextDisabled
                  : styles.nextButtonTextActive,
                isNextPressed && styles.nextButtonTextPressed,
              ]}
            >
              {current === questions.length - 1 ? "結果へ ✦" : "次へ ✦"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07091A",
    paddingHorizontal: 28,
    paddingTop: 60,
  },

  topArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginBottom: 58,
  },

  backIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,216,155,0.32)",
    shadowColor: "#FFD89B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    zIndex: 1001,
  },
  backIconText: {
    color: "#FFF5DA",
    fontSize: 24,
    fontWeight: "600",
    marginLeft: -2,
  },
  progressRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  progressBg: {
    flex: 1,
    height: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(240,193,119,0.35)",
    overflow: "visible",
  },

  progressFill: {
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#E5BE63",
    shadowColor: "#E5BE63",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1,
  },
  particleTrail: {
    position: "absolute",
    top: 0,
    width: 240,
    height: 40,
    marginLeft: -240,
  },

  sparkleStar: {
    position: "absolute",
    color: "#FFD580",
    fontSize: 10,
    textShadowColor: "#FFD580",
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 8,
  },

  progressText: {
    color: "#FFD580",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 2,
  },

  question: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 28,
  },

  starLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    gap: 20,
  },

  line: {
    width: 80,
    height: 1,
    backgroundColor: "#3C3D55",
  },

  star: {
    color: "#FFD89B",
    fontSize: 22,
    textShadowColor: "#F0C177",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 22,
  },

  choiceCard: {
    width: "46%",
    height: 158,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#77728D",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#11122500",
  },
  starLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  selectedCard: {
    borderColor: "#F0C177",
    borderWidth: 2,
    backgroundColor: "#4A2F77",
    transform: [{ scale: 1.03 }],
    shadowColor: "#F0C177",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 12,
  },

  check: {
    position: "absolute",
    top: -9,
    right: -7,
    backgroundColor: "#F0C177",
    color: "#333",
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    fontWeight: "bold",
    lineHeight: 24,
  },

  choiceText: {
    color: "white",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },

  bottom: {
    position: "absolute",
    bottom: 80,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backButton: {
    width: 96,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#201833",
    borderWidth: 1,
    borderColor: "#3F335C",
  },

  backButtonPressed: {
    backgroundColor: "#4A2F77",
    borderColor: "#F0C177",
    borderWidth: 1.5,
    transform: [{ scale: 1.03 }],
  },

  backButtonText: {
    color: "#B8AECF",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },

  backButtonTextPressed: {
    color: "white",
  },

  nextButton: {
    width: 190,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "#2D1F4A",
    borderWidth: 1.5,
    borderColor: "#6B4F9A",
    shadowColor: "#9B7FD1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },

  nextButtonActive: {
    backgroundColor: "#291151",
    borderColor: "#caa762",
    borderWidth: 2.5,
  },

  nextButtonDisabled: {
    opacity: 0.55,
  },

  nextButtonPressed: {
    backgroundColor: "#5a3d8a51",
    borderColor: "#F0C177",
    borderWidth: 2,
    transform: [{ scale: 1.08 }],
  },

  nextButtonText: {
    color: "#E8DFFF",
    textAlign: "center",
    fontSize: 21,
    fontWeight: "bold",
    textShadowColor: "rgba(155, 127, 209, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  nextButtonTextActive: {
    color: "#FFFFFF",
    textShadowColor: "#F0C177",
    textShadowRadius: 8,
  },
  nextButtonTextDisabled: {
    color: "#8E86A3",
  },

  nextButtonTextPressed: {
    color: "#FFFFFF",
    textShadowColor: "#F0C177",
    textShadowRadius: 8,
  },
});
