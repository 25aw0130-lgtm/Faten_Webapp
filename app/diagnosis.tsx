import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ResultType = "healing" | "reflection" | "hope" | "adventure" | "change";

const questions: {
  text: string;
  choices: string[];
  types: ResultType[];
}[] = [
  {
    text: "今、耳をすませたとき、一番心地よく脳に馴染む「音」はどれ？",
    choices: [
      "パチパチと静かにはじける、焚き火の音",
      "優しく寄せては返す、深夜の波の音",
      "カサカサと木の葉を揺らす、おだやかな夜の風の音",
      "深い森の奥で、しんしんと雪が降り積もるような静寂",
    ],
    types: ["adventure", "healing", "hope", "reflection"],
  },
  {
    text: "疲れた夜、今の自分を満たしてくれそうな「味」は？",
    choices: [
      "レモンやスパイスの効いた、刺激的な味",
      "ミルクやはちみつのような、やさしい甘さ",
      "炭酸水やハーブのような、透き通る爽やかさ",
      "深煎りコーヒーやビターチョコのような、静かな苦み",
    ],
    types: ["change", "healing", "hope", "reflection"],
  },
  {
    text: "もし今、ひとつの景色に溶け込めるなら、どこへ行きたい？",
    choices: [
      "太陽が燃えるように照らす、真夏の海",
      "木漏れ日が揺れる、静かな森の小道",
      "夕焼けがゆっくり沈む風の通る海辺",
      "雨上がりに光る、深夜の街並み",
    ],
    types: ["adventure", "reflection", "hope", "change"],
  },
  {
    text: "今の自分が、触れていたい感触は？",
    choices: [
      "熱を持った陶器のぬくもり",
      "水に溶けるような、なめらかさ",
      "風がすり抜けるような軽さ",
      "毛布みたいな、重たい安心感",
    ],
    types: ["change", "hope", "adventure", "reflection"],
  },
  {
    text: "今の自分が、思わず深呼吸したくなる香りは？",
    choices: [
      "焚き火の香り",
      "雨上がりの香り",
      "草や森の香り",
      "本屋さんの香り",
    ],
    types: ["adventure", "change", "healing", "reflection"],
  },
];

export default function DiagnosisScreen() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isNextPressed, setIsNextPressed] = useState(false);
  const [isBackPressed, setIsBackPressed] = useState(false);

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
        params: { type: resultType },
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

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <TouchableOpacity onPress={goBack} style={styles.backIcon}>
          <Text style={styles.backIconText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${((current + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <Text style={styles.count}>
        {current + 1} / {questions.length}
      </Text>

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

        <TouchableOpacity
          activeOpacity={1}
          style={[styles.nextButton, isNextPressed && styles.nextButtonPressed]}
          onPressIn={() => setIsNextPressed(true)}
          onPressOut={() => setIsNextPressed(false)}
          onPress={nextQuestion}
        >
          <Text
            style={[
              styles.nextButtonText,
              isNextPressed && styles.nextButtonTextPressed,
            ]}
          >
            {current === questions.length - 1 ? "結果へ ✦" : "次へ ✦"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  },

  backIcon: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  backIconText: {
    color: "white",
    fontSize: 54,
    lineHeight: 54,
  },

  progressBg: {
    flex: 1,
    height: 5,
    backgroundColor: "#3C3D55",
    borderRadius: 10,
  },

  progressFill: {
    height: 5,
    backgroundColor: "#F0C177",
    borderRadius: 10,
  },

  count: {
    color: "#D8D5E8",
    textAlign: "center",
    fontSize: 24,
    marginTop: 24,
    marginBottom: 58,
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
    color: "#F0C177",
    fontSize: 34,
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
    backgroundColor: "#111225",
  },

  selectedCard: {
    borderColor: "#F0C177",
    borderWidth: 2,
    backgroundColor: "#4A2F77",
    transform: [{ scale: 1.03 }],
    shadowColor: "#F0C177",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
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
    shadowColor: "#F0C177",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
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
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#201833",
    borderWidth: 1,
    borderColor: "#4A3A61",
  },

  nextButtonPressed: {
    backgroundColor: "#4A2F77",
    borderColor: "#F0C177",
    borderWidth: 1.5,
    shadowColor: "#F0C177",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
    transform: [{ scale: 1.03 }],
  },

  nextButtonText: {
    color: "#B8AECF",
    textAlign: "center",
    fontSize: 21,
    fontWeight: "bold",
  },

  nextButtonTextPressed: {
    color: "white",
  },
});
