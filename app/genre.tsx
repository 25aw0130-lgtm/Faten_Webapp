import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const GENRES: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "novel", label: "小説", icon: "book-outline" },
  { key: "essay", label: "エッセイ", icon: "create-outline" },
  { key: "selfhelp", label: "自己啓発", icon: "leaf-outline" },
  { key: "history", label: "歴史", icon: "time-outline" },
  { key: "philosophy", label: "哲学", icon: "planet-outline" },
  { key: "art", label: "芸術", icon: "color-palette-outline" },
];

export default function GenreScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const goBack = () => router.back();

  const handleNext = () => {
    if (!selected) return;
    router.push({
      pathname: "/diagnosis",
      params: { genre: selected },
    });
  };

  // NEW: lets the user skip genre selection entirely. No `genre` param
  // is passed at all, and the backend already treats a missing genre
  // as "no genre filter" (see /recommend: `genre ? filter(...) : allBooks`).
  const handleSkip = () => {
    router.push({
      pathname: "/diagnosis",
      params: {},
    });
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
      </View>

      <Text style={styles.title}>好きなジャンルは？</Text>
      <Text style={styles.subtitle}>
        気になるジャンルを一つ選んでください
      </Text>

      <View style={styles.starLine}>
        <View style={styles.line} />
        <Text style={styles.star}>✦</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.grid}>
        {GENRES.map((genre) => {
          const isSelected = selected === genre.key;
          return (
            <TouchableOpacity
              key={genre.key}
              activeOpacity={0.85}
              style={[styles.genreCard, isSelected && styles.selectedCard]}
              onPress={() => setSelected(genre.key)}
            >
              {isSelected && <Text style={styles.check}>✓</Text>}
              <Ionicons
                name={genre.icon}
                size={30}
                color={isSelected ? "#FFF5DA" : "#F0C177"}
              />
              <Text style={styles.genreLabel}>{genre.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.nextButton,
            selected === null
              ? styles.nextButtonDisabled
              : styles.nextButtonActive,
          ]}
          onPress={handleNext}
        >
          <Text
            style={[
              styles.nextButtonText,
              selected === null
                ? styles.nextButtonTextDisabled
                : styles.nextButtonTextActive,
            ]}
          >
            次へ ✦
          </Text>
        </TouchableOpacity>

        {/* NEW: skip button — lets the user proceed without choosing a genre */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Ionicons name="sparkles-outline" size={15} color="#F0C177" />
          <Text style={styles.skipButtonText}>どのジャンルでもいい</Text>
        </TouchableOpacity>
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

  starLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  topArea: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
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
  },

  backIconText: {
    color: "#FFF5DA",
    fontSize: 24,
    fontWeight: "600",
    marginLeft: -2,
  },

  title: {
    color: "white",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },

  subtitle: {
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 24,
  },

  starLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
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

  genreCard: {
    width: "46%",
    height: 130,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#77728D",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#11122500",
    gap: 8,
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

  genreLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  bottom: {
    position: "absolute",
    bottom: 70,
    left: 28,
    right: 28,
    alignItems: "center",
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

  nextButtonActive: {
    backgroundColor: "#291151",
    borderColor: "#caa762",
    borderWidth: 2.5,
  },

  nextButtonDisabled: {
    opacity: 0.55,
  },

  nextButtonText: {
    color: "#E8DFFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },

  nextButtonTextActive: {
    color: "#FFFFFF",
    textShadowColor: "#F0C177",
    textShadowRadius: 8,
  },

  nextButtonTextDisabled: {
    color: "#8E86A3",
  },

  // NEW: styles for the skip button — pill outline matching the app's
  // gold/purple theme, so it reads as a real secondary action rather
  // than a plain text link
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(240,193,119,0.4)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  skipButtonText: {
    color: "#F0C177",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
