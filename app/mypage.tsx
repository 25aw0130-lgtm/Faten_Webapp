import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DiagnosisEntry = {
  card: string;
  moodType: string;
  genre: string | null;
  date: number;
};

const cardDisplayNames: { [key: string]: string } = {
  STAR: "星",
  SUN: "太陽",
  MOON: "月",
  HERMIT: "隠者",
  WHEEL: "運命の輪",
  TEMPERANCE: "節制",
};

const cardFullNames: { [key: string]: string } = {
  STAR: "The Star（星）",
  SUN: "The Sun（太陽）",
  MOON: "The Moon（月）",
  HERMIT: "The Hermit（隠者）",
  WHEEL: "Wheel of Fortune（運命の輪）",
  TEMPERANCE: "Temperance（節制）",
};

const moodDisplayNames: { [key: string]: string } = {
  healing: "癒し",
  reflection: "内省",
  hope: "希望",
  adventure: "冒険",
  change: "変化",
};

const genreDisplayNames: { [key: string]: string } = {
  novel: "小説",
  essay: "エッセイ",
  selfhelp: "自己啓発",
  history: "歴史",
  philosophy: "哲学",
  art: "芸術",
};

// Returns the most frequent value in a list, or null if the list is empty.
function mostFrequent(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export default function MyPageScreen() {
  const [likedCount, setLikedCount] = useState(0);
  const [history, setHistory] = useState<DiagnosisEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [likedStored, historyStored] = await Promise.all([
        AsyncStorage.getItem("liked_books"),
        AsyncStorage.getItem("diagnosis_history"),
      ]);

      setLikedCount(likedStored ? JSON.parse(likedStored).length : 0);
      setHistory(historyStored ? JSON.parse(historyStored) : []);
    } catch (err) {
      console.error("Failed to load マイページ data:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Refresh every time this screen comes into focus, so stats stay
  // current after the user completes another diagnosis elsewhere.
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const topCard = mostFrequent(history.map((h) => h.card));
  const topMood = mostFrequent(history.map((h) => h.moodType));
  const topGenre = mostFrequent(
    history.map((h) => h.genre).filter((g): g is string => !!g)
  );

  const hasData = loaded && history.length > 0;

  const clearHistory = () => {
    Alert.alert(
      "診断履歴を削除しますか？",
      "この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除する",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("diagnosis_history");
              setHistory([]);
            } catch (err) {
              console.error("Failed to clear diagnosis history:", err);
            }
          },
        },
      ]
    );
  };

  return (
    <ImageBackground
      source={require("../assets/images/tarot-bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#F4D9A7" />
            </TouchableOpacity>
            <View style={styles.dummyBox} />
          </View>

          <Text style={styles.title}>マイページ</Text>
          <Text style={styles.subTitle}>あなたの読書の記録</Text>

          <View style={styles.starLine}>
            <View style={styles.line} />
            <Text style={styles.star}>✦</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{history.length}</Text>
              <Text style={styles.statLabel}>診断回数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{likedCount}</Text>
              <Text style={styles.statLabel}>保存した本</Text>
            </View>
          </View>

          {!hasData ? (
            <View style={styles.emptyBox}>
              <Ionicons name="sparkles-outline" size={44} color="#E8C989" />
              <Text style={styles.emptyText}>
                まだ診断の記録がありません
              </Text>
              <Text style={styles.emptySubText}>
                診断を行うと、あなたの傾向がここに表示されます。
              </Text>
            </View>
          ) : (
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>あなたの傾向</Text>

              <View style={styles.trendRow}>
                <Text style={styles.trendLabel}>よく引くカード</Text>
                <Text style={styles.trendValue}>
                  {topCard ? cardDisplayNames[topCard] || topCard : "—"}
                </Text>
              </View>

              <View style={styles.trendDivider} />

              <View style={styles.trendRow}>
                <Text style={styles.trendLabel}>よく選ぶ気分</Text>
                <Text style={styles.trendValue}>
                  {topMood ? moodDisplayNames[topMood] || topMood : "—"}
                </Text>
              </View>

              <View style={styles.trendDivider} />

              <View style={styles.trendRow}>
                <Text style={styles.trendLabel}>好きなジャンル</Text>
                <Text style={styles.trendValue}>
                  {topGenre ? genreDisplayNames[topGenre] || topGenre : "—"}
                </Text>
              </View>
            </View>
          )}

          {hasData && (
            <>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>診断履歴</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.clearButton}
                  onPress={clearHistory}
                >
                  <Ionicons name="trash-outline" size={14} color="#D8A9A9" />
                  <Text style={styles.clearButtonText}>すべて削除</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.historyList}>
                {[...history]
                  .sort((a, b) => b.date - a.date)
                  .slice(0, 10)
                  .map((entry, index) => (
                    <View key={`${entry.date}-${index}`} style={styles.historyItem}>
                      <View style={styles.historyIconCircle}>
                        <Text style={styles.historyIconText}>✦</Text>
                      </View>

                      <View style={styles.historyInfo}>
                        <Text style={styles.historyMain}>
                          {cardFullNames[entry.card] || entry.card}
                        </Text>
                        <Text style={styles.historyMoodLine}>
                          {moodDisplayNames[entry.moodType] || entry.moodType}
                        </Text>
                        <Text style={styles.historyMeta}>
                          {entry.genre
                            ? genreDisplayNames[entry.genre] || entry.genre
                            : "ジャンル未選択"}
                          {"  ·  "}
                          {new Date(entry.date).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Ionicons name="home-outline" size={28} color="#F4D9A7" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/liked-books")}>
            <Ionicons name="heart-outline" size={28} color="#F4D9A7" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="person" size={28} color="#F4D9A7" />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 5, 24, 0.64)",
  },

  container: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(244,217,167,0.5)",
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },

  dummyBox: { width: 42 },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 8,
  },

  subTitle: {
    color: "#D8D1E8",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },

  starLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  line: {
    width: 86,
    height: 1,
    backgroundColor: "rgba(232,201,137,0.45)",
  },

  star: {
    color: "#E8C989",
    fontSize: 22,
    marginHorizontal: 12,
  },

  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 26,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 22,
    borderRadius: 22,
    backgroundColor: "rgba(20, 17, 48, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.4)",
  },

  statNumber: {
    color: "#E8C989",
    fontSize: 32,
    fontWeight: "700",
  },

  statLabel: {
    color: "#D8D1E8",
    fontSize: 12,
    marginTop: 6,
  },

  trendCard: {
    borderRadius: 28,
    backgroundColor: "rgba(20, 17, 48, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.5)",
    padding: 22,
  },

  trendTitle: {
    color: "#E8C989",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },

  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  trendLabel: {
    color: "#D8D1E8",
    fontSize: 13,
  },

  trendValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  trendDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },

  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 6,
    textAlign: "center",
  },

  emptySubText: {
    color: "#D8D1E8",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 14,
  },

  historyTitle: {
    color: "#E8C989",
    fontSize: 16,
    fontWeight: "600",
  },

  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(216,169,169,0.35)",
    backgroundColor: "rgba(216,169,169,0.08)",
  },

  clearButtonText: {
    color: "#D8A9A9",
    fontSize: 11,
    fontWeight: "600",
  },

  historyList: {
    gap: 10,
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 17, 48, 0.7)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },

  historyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(232,201,137,0.12)",
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  historyIconText: {
    color: "#E8C989",
    fontSize: 15,
  },

  historyInfo: {
    flex: 1,
  },

  historyMain: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  historyMoodLine: {
    color: "#D8D1E8",
    fontSize: 12,
    marginTop: 2,
  },

  historyMeta: {
    color: "#B8AECF",
    fontSize: 11,
    marginTop: 4,
  },

  bottomNav: {
    position: "absolute",
    bottom: 18,
    left: 24,
    right: 24,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(8,8,34,0.95)",
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.35)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
});
