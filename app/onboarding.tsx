import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ONBOARDING_KEY = "has_seen_onboarding";

type Page = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  body: string;
  buttonLabel: string;
};

const pages: Page[] = [
  {
    icon: "book-outline",
    title: "このアプリについて",
    subtitle: "本との新しい出会い",
    body:
      "読みたい本が見つからない夜、ありませんか？\n\nこのアプリは、あなたの「今の気持ち」に寄り添う一冊を届けます。\nきっかけは、一枚のタロットカード。",
    buttonLabel: "次へ",
  },
  {
    icon: "sparkles-outline",
    title: "STEP 01",
    subtitle: "質問に答える",
    body:
      "直感で答えるだけの、簡単な5つの質問。\n\nあなたの気分にぴったりの一枚が、\nタロットカードの中から選ばれます。",
    buttonLabel: "次へ",
  },
  {
    icon: "moon-outline",
    title: "STEP 02",
    subtitle: "運命の一冊と出会う",
    body:
      "カードの意味から、あなたに合う本をご紹介。\n\nおすすめ理由やあらすじもすぐに確認でき、\n気になった本は保存していつでも見返せます。",
    buttonLabel: "さあ、始めよう",
  },
];

export default function OnboardingScreen() {
  const [pageIndex, setPageIndex] = useState(0);
  const page = pages[pageIndex];
  const isLastPage = pageIndex === pages.length - 1;

  const handleNext = async () => {
    if (!isLastPage) {
      setPageIndex(pageIndex + 1);
      return;
    }

    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (err) {
      console.error("Failed to save onboarding flag:", err);
    }

    router.replace("/");
  };

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
          { bottom: 260, left: 90, size: 8 },
          { bottom: 180, right: 80, size: 12 },
          { bottom: 120, left: 40, size: 10 },
        ].map((star, index) => (
          <Text
            key={index}
            style={{
              position: "absolute",
              color: "rgba(255,216,155,0.12)",
              fontSize: star.size,
              ...star,
            }}
          >
            {index % 2 === 0 ? "✦" : "✧"}
          </Text>
        ))}
      </View>

      <View style={styles.content}>
        <Ionicons
          name={page.icon}
          size={56}
          color="#F0C177"
          style={styles.icon}
        />

        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>

        <View style={styles.starLine}>
          <View style={styles.line} />
          <Text style={styles.lineStar}>✦</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.card}>
          <Text style={styles.body}>{page.body}</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === pageIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>{page.buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 90,
    paddingBottom: 50,
    justifyContent: "space-between",
  },

  starLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  content: {
    alignItems: "center",
  },

  icon: {
    marginBottom: 22,
  },

  title: {
    color: "#FFF5DA",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
  },

  subtitle: {
    color: "#F0C177",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 1,
  },

  starLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    marginBottom: 30,
    gap: 16,
  },

  line: {
    width: 70,
    height: 1,
    backgroundColor: "rgba(240,193,119,0.4)",
  },

  lineStar: {
    color: "#F0C177",
    fontSize: 16,
  },

  card: {
    width: "100%",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(240,193,119,0.35)",
    backgroundColor: "rgba(74, 47, 119, 0.18)",
    paddingVertical: 30,
    paddingHorizontal: 24,
  },

  body: {
    color: "#EDE7FF",
    fontSize: 15,
    lineHeight: 27,
    textAlign: "center",
  },

  bottom: {
    alignItems: "center",
  },

  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  dotActive: {
    width: 22,
    backgroundColor: "#F0C177",
  },

  nextButton: {
    width: "100%",
    paddingVertical: 16,
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

  nextButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
