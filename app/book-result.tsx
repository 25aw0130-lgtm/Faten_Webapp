import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// On native, hostUri gives the Metro host's LAN IP so a physical device
// can reach this machine. On web there is no hostUri (the app already
// runs in the browser on this machine), so use the page's own hostname
// instead — falling back to "hostUri undefined" here previously built
// the literal string "http://undefined:3001", which fails instantly.
const backendHost =
  Platform.OS === "web"
    ? typeof window !== "undefined"
      ? window.location.hostname
      : "localhost"
    : Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";

const BACKEND_URL = `http://${backendHost}:3001`;

type Book = {
  title: string;
  author: string;
  description: string;
  image: string | null;
  amazonUrl: string | null;
};

const openAmazon = (url: string | null) => {
  if (!url) return;
  Linking.openURL(url).catch((err) =>
    console.error("Failed to open Amazon link:", err)
  );
};

const cardMap: { [key: string]: string } = {
  星: "STAR",
  太陽: "SUN",
  月: "MOON",
  隠者: "HERMIT",
  運命の輪: "WHEEL",
  節制: "TEMPERANCE",
  STAR: "STAR",
  SUN: "SUN",
  MOON: "MOON",
  HERMIT: "HERMIT",
  WHEEL: "WHEEL",
  TEMPERANCE: "TEMPERANCE",
};

// Reverse lookup: English key -> Japanese display name (for showing to the user)
const cardDisplayNames: { [key: string]: string } = {
  STAR: "星",
  SUN: "太陽",
  MOON: "月",
  HERMIT: "隠者",
  WHEEL: "運命の輪",
  TEMPERANCE: "節制",
};

export default function BookResultScreen() {
  // ---- params/logic: kept from my own code ----
  const { card, type, genre } = useLocalSearchParams();
  const navigation = useNavigation();

  const selectedCard = Array.isArray(card) ? card[0] : card;
  const moodType = Array.isArray(type) ? type[0] : type;
  const genreParam = Array.isArray(genre) ? genre[0] : genre;

  const apiCard = selectedCard
    ? cardMap[String(selectedCard).trim()] ||
      String(selectedCard).trim().toUpperCase()
    : "";

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [likedTitles, setLikedTitles] = useState<Set<string>>(new Set());

  // Record this diagnosis (card + mood + genre) to local history, once
  // per visit to this screen — powers the マイページ stats screen.
  const hasLoggedHistory = useRef(false);
  useEffect(() => {
    const logHistory = async () => {
      if (hasLoggedHistory.current) return;
      hasLoggedHistory.current = true;
      if (!apiCard || !moodType) return;

      try {
        const stored = await AsyncStorage.getItem("diagnosis_history");
        const history = stored ? JSON.parse(stored) : [];
        history.push({
          card: apiCard,
          moodType,
          genre: genreParam || null,
          date: Date.now(),
        });
        await AsyncStorage.setItem("diagnosis_history", JSON.stringify(history));
      } catch (err) {
        console.error("Failed to log diagnosis history:", err);
      }
    };
    logHistory();
  }, []);

  const mainBook = books[0];
  const otherBooks = books.slice(1);

  // Disable Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );
    return () => backHandler.remove();
  }, []);

  // Disable iOS swipe back gesture
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, []);

  // Load liked books from storage
  useEffect(() => {
    const loadLiked = async () => {
      try {
        const stored = await AsyncStorage.getItem("liked_books");
        if (stored) {
          const parsed: Book[] = JSON.parse(stored);
          setLikedTitles(new Set(parsed.map((b) => b.title)));
        }
      } catch (err) {
        console.error("Failed to load liked books:", err);
      }
    };
    loadLiked();
  }, []);

  useEffect(() => {
    if (!apiCard || !moodType) {
      setError("カード情報が見つかりませんでした。");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    fetch(`${BACKEND_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moodType: moodType,
        cardKey: apiCard,
        genre: genreParam,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooks(data.books);
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("本の取得に失敗しました。");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiCard, moodType, genreParam]);

  const toggleLike = async (book: Book) => {
    try {
      const stored = await AsyncStorage.getItem("liked_books");
      const current: Book[] = stored ? JSON.parse(stored) : [];
      const isLiked = likedTitles.has(book.title);

      let updated: Book[];
      if (isLiked) {
        updated = current.filter((b) => b.title !== book.title);
      } else {
        updated = [...current, book];
      }

      await AsyncStorage.setItem("liked_books", JSON.stringify(updated));
      setLikedTitles(new Set(updated.map((b) => b.title)));
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const mainSaved = mainBook ? likedTitles.has(mainBook.title) : false;

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
          <Text style={styles.title}>おすすめの一冊</Text>
          <Text style={styles.subTitle}>あなたのカードが導いた本</Text>

          <View style={styles.starLine}>
            <View style={styles.line} />
            <Text style={styles.star}>✦</Text>
            <View style={styles.line} />
          </View>

          {loading && (
            <Text style={styles.statusText}>本を探しています...</Text>
          )}
          {!loading && error !== "" && (
            <Text style={styles.statusText}>{error}</Text>
          )}
          {!loading && !error && books.length === 0 && (
            <Text style={styles.statusText}>おすすめの本がありません。</Text>
          )}

          {!loading && !error && mainBook && (
            <>
              <View style={styles.mainCard}>
                <View style={styles.badge}>
                  <Text style={styles.badgeSmall}>おすすめ</Text>
                  <Text style={styles.badgeBig}>No.1</Text>
                </View>

                <View style={styles.bookImageWrap}>
                  {mainBook.image ? (
                    <Image
                      source={{ uri: mainBook.image }}
                      style={styles.mainBookImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.mainNoImageBox}>
                      <Text style={styles.noImageText}>No Image</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.bookTitle}>{mainBook.title}</Text>
                <Text style={styles.author}>著者：{mainBook.author}</Text>

                <ScrollView style={styles.previewScroll} nestedScrollEnabled>
                  <Text style={styles.description}>
                    {mainBook.description}
                  </Text>
                </ScrollView>

                <View style={styles.textBox}>
                  <Text style={styles.sectionTitle}>なぜこの本？</Text>
                  <Text style={styles.sectionText}>
                    あなたが選んだ「{cardDisplayNames[apiCard] || apiCard}」の雰囲気と、今の気持ちに合わせて選びました。
                  </Text>

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>あらすじ</Text>
                  <ScrollView style={styles.synopsisScroll} nestedScrollEnabled>
                    <Text style={styles.sectionText}>
                      {mainBook.description}
                    </Text>
                  </ScrollView>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.likeButton, mainSaved && styles.likeButtonSaved]}
                  onPress={() => toggleLike(mainBook)}
                >
                  <Ionicons
                    name={mainSaved ? "heart" : "heart-outline"}
                    size={22}
                    color={mainSaved ? "#E8C989" : "#281536"}
                  />

                  <Text
                    style={[styles.likeText, mainSaved && styles.likeTextSaved]}
                  >
                    {mainSaved ? "保存済み" : "気になる本にする"}
                  </Text>
                </TouchableOpacity>

                {mainBook.amazonUrl && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.amazonButton}
                    onPress={() => openAmazon(mainBook.amazonUrl)}
                  >
                    <Ionicons name="cart-outline" size={20} color="#281536" />
                    <Text style={styles.amazonText}>Amazonで見る</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.otherHeader}>
                <View style={styles.line} />
                <Text style={styles.otherTitle}>他のおすすめ</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.otherBooks}>
                {otherBooks.slice(0, 3).map((book, index) => (
                  <TouchableOpacity
                    key={`${book.title}-${index}`}
                    style={styles.smallCard}
                    activeOpacity={0.8}
                    onPress={() => setSelectedBook(book)}
                  >
                    {book.image ? (
                      <Image
                        source={{ uri: book.image }}
                        style={styles.smallBookImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.smallNoImageBox}>
                        <Text style={styles.smallNoImageText}>No Image</Text>
                      </View>
                    )}

                    <Text numberOfLines={2} style={styles.smallTitle}>
                      {book.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            onPress={() => {
              router.dismissAll();
              router.replace("/");
            }}
          >
            <Ionicons name="home-outline" size={28} color="#F4D9A7" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/liked-books")}>
            <Ionicons name="heart" size={28} color="#F4D9A7" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/mypage")}>
            <Ionicons name="person-outline" size={28} color="#F4D9A7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Book detail modal */}
      <Modal
        visible={selectedBook !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBook(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedBook(null)}
            >
              <Ionicons name="close" size={24} color="#E8C989" />
            </TouchableOpacity>

            <View style={styles.modalBookRow}>
              {selectedBook?.image ? (
                <Image
                  source={{ uri: selectedBook.image }}
                  style={styles.modalBookImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.modalNoImageBox}>
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}

              <View style={styles.modalBookInfo}>
                <Text style={styles.bookTitle}>{selectedBook?.title}</Text>
                <Text style={styles.author}>著者：{selectedBook?.author}</Text>
              </View>
            </View>

            <View style={styles.textBox}>
              <Text style={styles.sectionTitle}>あらすじ</Text>
              <ScrollView style={{ maxHeight: 160 }}>
                <Text style={styles.sectionText}>
                  {selectedBook?.description}
                </Text>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[
                styles.likeButton,
                selectedBook &&
                  likedTitles.has(selectedBook.title) &&
                  styles.likeButtonSaved,
              ]}
              onPress={() => {
                if (selectedBook) toggleLike(selectedBook);
              }}
            >
              <Ionicons
                name={
                  selectedBook && likedTitles.has(selectedBook.title)
                    ? "heart"
                    : "heart-outline"
                }
                size={22}
                color={
                  selectedBook && likedTitles.has(selectedBook.title)
                    ? "#E8C989"
                    : "#281536"
                }
              />
              <Text
                style={[
                  styles.likeText,
                  selectedBook &&
                    likedTitles.has(selectedBook.title) &&
                    styles.likeTextSaved,
                ]}
              >
                {selectedBook && likedTitles.has(selectedBook.title)
                  ? "保存済み"
                  : "気になる本にする"}
              </Text>
            </TouchableOpacity>

            {selectedBook?.amazonUrl && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.amazonButton}
                onPress={() => openAmazon(selectedBook.amazonUrl)}
              >
                <Ionicons name="cart-outline" size={20} color="#281536" />
                <Text style={styles.amazonText}>Amazonで見る</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 5, 24, 0.58)",
  },

  container: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    textAlign: "center",
    letterSpacing: 4,
    marginTop: 10,
    marginBottom: 8,
  },

  subTitle: {
    color: "#D8D1E8",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
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

  statusText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },

  mainCard: {
    position: "relative",
    backgroundColor: "rgba(20, 17, 48, 0.86)",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.85)",
    paddingTop: 34,
    paddingHorizontal: 22,
    paddingBottom: 28,
    marginBottom: 34,
  },

  badge: {
    position: "absolute",
    top: -20,
    left: 22,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0B0822",
    borderWidth: 1,
    borderColor: "#E8C989",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  badgeSmall: {
    color: "#E8C989",
    fontSize: 11,
  },

  badgeBig: {
    color: "#FFFFFF",
    fontSize: 17,
    marginTop: 2,
  },

  bookImageWrap: {
    alignSelf: "center",
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.28)",
    marginBottom: 20,
  },

  mainBookImage: {
    width: 145,
    height: 215,
    borderRadius: 8,
  },

  mainNoImageBox: {
    width: 145,
    height: 215,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  noImageText: {
    color: "#D8D5E8",
    fontSize: 13,
  },

  bookTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "600",
    lineHeight: 30,
    textAlign: "center",
    marginBottom: 8,
  },

  author: {
    color: "#D8D1E8",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
  },

  description: {
    color: "#F4F0FF",
    fontSize: 13,
    lineHeight: 23,
    marginBottom: 22,
  },

  textBox: {
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.5)",
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  sectionTitle: {
    color: "#E8C989",
    fontSize: 15,
    marginBottom: 7,
    fontWeight: "600",
  },

  sectionText: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 23,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 16,
  },

  synopsisScroll: {
    maxHeight: 160,
  },

  previewScroll: {
    maxHeight: 100,
    marginBottom: 22,
  },

  likeButton: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#E8C989",
  },

  likeButtonSaved: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "#E8C989",
  },

  likeText: {
    color: "#281536",
    fontSize: 14,
    fontWeight: "700",
  },

  likeTextSaved: {
    color: "#E8C989",
  },

  amazonButton: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#FFE9A8",
  },

  amazonText: {
    color: "#281536",
    fontSize: 14,
    fontWeight: "700",
  },

  otherHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  otherTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    marginHorizontal: 12,
    letterSpacing: 1,
  },

  otherBooks: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  smallCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.22)",
  },

  smallBookImage: {
    width: 88,
    height: 128,
    borderRadius: 8,
    marginBottom: 8,
  },

  smallNoImageBox: {
    width: 88,
    height: 128,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  smallNoImageText: {
    color: "#D8D5E8",
    fontSize: 10,
  },

  smallTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "rgba(16,15,42,0.97)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(232,201,137,0.9)",
    padding: 24,
  },

  modalClose: { alignSelf: "flex-end", marginBottom: 12 },

  modalBookRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  modalBookImage: { width: 100, height: 150, borderRadius: 4, marginRight: 16 },

  modalNoImageBox: {
    width: 100,
    height: 150,
    borderRadius: 4,
    marginRight: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBookInfo: { flex: 1 },
});
