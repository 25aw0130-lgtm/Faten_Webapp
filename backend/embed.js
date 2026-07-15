import axios from "axios";
import { CohereClient } from "cohere-ai";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

const moodAuthors = {
  healing: [
    "小川糸", "宮下奈都", "梨木香歩", "川上弘美", "江國香織",
    "伊吹有喜", "寺地はるな", "青山美智子", "凪良ゆう", "原田マハ",
  ],
  reflection: [
    "村上春樹", "吉本ばなな", "山田詠美", "桐野夏生", "辻仁成",
    "平野啓一郎", "小川洋子", "川上未映子", "重松清", "柴崎友香",
  ],
  hope: [
    "有川浩", "瀬尾まいこ", "朝井リョウ", "住野よる", "辻村深月",
    "森沢明夫", "喜多川泰", "荻原浩", "百田尚樹", "中山七里",
  ],
  adventure: [
    "東野圭吾", "伊坂幸太郎", "万城目学", "森見登美彦", "宮部みゆき",
    "京極夏彦", "米澤穂信", "横山秀夫", "薬丸岳", "今村昌弘",
  ],
  change: [
    "角田光代", "村山由佳", "島本理生", "柚木麻子", "窪美澄",
    "三浦しをん", "森絵都", "西加奈子", "綿矢りさ", "津村記久子",
  ],
};

const moodDescriptions = {
  healing:    "心が疲れているとき、やさしく癒してくれる温かい物語。日常の小さな幸せや人とのつながりを描いた作品。",
  reflection: "自分自身と向き合い、内省を深めるための静かな物語。人生の意味や孤独、記憶をテーマにした作品。",
  hope:       "前向きな気持ちになれる、希望と勇気をくれる物語。夢に向かって歩む人々の姿を描いた作品。",
  adventure:  "ワクワクするような展開と謎に満ちた物語。非日常の世界へ連れて行ってくれるエンターテインメント作品。",
  change:     "変化と成長をテーマにした物語。人生の転換期や新しい自分を見つける旅を描いた作品。",
};

const cardDescriptions = {
  STAR:        "希望、インスピレーション、静けさ、未来への信頼",
  SUN:         "喜び、活力、明るさ、成功、前向きなエネルギー",
  MOON:        "直感、夢、不安、感情の深み、潜在意識",
  HERMIT:      "内省、孤独、知恵、静けさ、自己探求",
  WHEEL:       "変化、運命、転換点、新しいサイクル、流れ",
  TEMPERANCE:  "調和、バランス、忍耐、癒し、穏やかさ",
};

// CHANGE 1: "novel" now only matches on "小説" itself. The previous list
// included generic words like "物語" ("story"), "冒険" ("adventure"),
// and "恋愛" ("romance") which show up constantly in essay/memoir blurbs
// too, causing non-novels to false-match as novels.
const GENRE_KEYWORDS = {
  novel:      ["小説"],
  essay:      ["エッセイ", "随筆", "コラム", "エッセー"],
  selfhelp:   ["自己啓発", "成功", "習慣", "人間関係", "成長"],
  history:    ["歴史", "日本史", "戦国", "江戸", "幕末"],
  philosophy: ["哲学", "心理学", "思想", "倫理", "精神"],
  art:        ["芸術", "美術", "文化", "映画", "音楽", "デザイン"],
};

// Google Books' `categories` field uses English BISAC-style labels
// (e.g. "Fiction", "History"). Each recognized label maps to exactly
// one genre. Matched by substring against the raw category string (see
// CHANGE 2 below), so compound BISAC strings like "Fiction / Literary"
// or "Biography & Autobiography / Personal Memoirs" still match.
const CATEGORY_GENRE_MAP = {
  "fiction": "novel",
  "literary fiction": "novel",
  "japanese fiction": "novel",
  "japanese literature": "novel",
  "short stories": "novel",
  "graphic novels": "novel",
  "biography & autobiography": "essay",
  "literary collections": "essay",
  "literary criticism": "essay",
  "essays": "essay",
  "essay": "essay",
  "self-help": "selfhelp",
  "self help": "selfhelp",
  "history": "history",
  "philosophy": "philosophy",
  "art": "art",
};

// Checks whether a book actually matches the selected genre. Used as a
// hard filter before ranking, so the final recommendation can't drift
// into a different genre than the one the user selected.
function matchesGenre(book, genre) {
  if (!genre) return false;

  const categories = (book.categories || []).map((c) => c.toLowerCase().trim());

  // CHANGE 2: substring match instead of exact match. Google Books often
  // returns compound BISAC strings (e.g. "Fiction / Literary" or
  // "Biography & Autobiography / Personal Memoirs") that never exactly
  // equal a CATEGORY_GENRE_MAP key, which was silently pushing almost
  // every book into the unreliable keyword fallback below.
  const recognizedGenres = categories.flatMap((c) =>
    Object.entries(CATEGORY_GENRE_MAP)
      .filter(([key]) => c.includes(key))
      .map(([, g]) => g)
  );

  // If Google Books classified this book into one of our known genres,
  // trust that exclusively — it's far more reliable than a keyword that
  // happens to appear in the description (an essay's blurb can easily
  // mention "物語" without the book being a novel).
  if (recognizedGenres.length > 0) {
    return recognizedGenres.includes(genre);
  }

  // No recognized category (common for Japanese-only titles): fall back
  // to a loose keyword match against the title/description.
  const text = `${book.title} ${book.description}`;

  // Essay/interview marketing copy in Japanese reliably says words like
  // "エッセイ"/"随筆"/"聞き手"/"対談" even when the blurb name-drops other
  // genres in passing (e.g. a reading-guide essay whose description
  // mentions "小説" while describing what kinds of books it covers, or an
  // author Q&A book whose blurb mentions "小説を書く時のモットー"). Treat
  // that as a strong, unambiguous nonfiction signal that overrides any
  // other genre's keyword hit — this is the exact bug reported: an essay
  // slipping through as a novel because its blurb happened to also
  // mention "小説".
  const nonFictionSignals = [
    ...GENRE_KEYWORDS.essay,
    "インタビュー", "聞き手", "語り手", "対談",
  ];
  const looksNonFiction = nonFictionSignals.some((kw) => text.includes(kw));
  if (looksNonFiction) return genre === "essay";

  const keywords = GENRE_KEYWORDS[genre] || [];
  return keywords.some((kw) => text.includes(kw));
}

// Authors who actually specialize in each genre. Used instead of
// moodAuthors when a genre is selected, so genre changes WHO gets
// searched — not just a keyword tacked onto a novelist's search.
const genreAuthors = {
  essay: [
    "向田邦子", "群ようこ", "内田樹", "又吉直樹", "酒井順子",
    "東畑開人", "若林正恭", "星野源", "松浦弥太郎", "角田光代",
  ],
  selfhelp: [
    "本田健", "中谷彰宏", "小林正観", "苫米地英人", "千田琢哉",
    "心屋仁之助", "水野敬也", "泉正人", "勝間和代", "岩田松雄",
  ],
  history: [
    "司馬遼太郎", "塩野七生", "井沢元彦", "磯田道史", "半藤一利",
    "加藤陽子", "出口治明", "安部龍太郎", "伊東潤", "佐藤賢一",
  ],
  philosophy: [
    "中島義道", "鷲田清一", "内田樹", "岸見一郎", "森岡正博",
    "竹田青嗣", "高橋昌一郎", "小川仁志", "苫野一徳", "上野千鶴子",
  ],
  art: [
    "山口晃", "横尾忠則", "会田誠", "椹木野衣", "布施英利",
    "三浦篤", "山田五郎", "千住博", "森村泰昌", "東浩紀",
  ],
  // "novel" has no separate list — it reuses moodAuthors directly,
  // since those are already novelists.
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convert an ISBN-13 to ISBN-10. Returns null if the ISBN-13 doesn't
// start with the "978" prefix (ISBN-10 only exists for that range).
function isbn13To10(isbn13) {
  const digits = isbn13.replace(/[^0-9]/g, "");
  if (digits.length !== 13 || !digits.startsWith("978")) return null;

  const core = digits.slice(3, 12); // 9 digits after the 978 prefix
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (10 - i) * parseInt(core[i], 10);
  }
  const checkValue = (11 - (sum % 11)) % 11;
  const checkDigit = checkValue === 10 ? "X" : String(checkValue);

  return core + checkDigit;
}

// Amazon uses ISBN-10 as the ASIN for books, so a direct product page
// can be built as amazon.co.jp/dp/{ISBN10} without any API/account.
// If no ISBN is available at all, fall back to an Amazon search link
// built from the title and author so every book still gets a link.
function buildAmazonUrl(industryIdentifiers = [], title, author) {
  const isbn10Entry = industryIdentifiers.find((id) => id.type === "ISBN_10");
  if (isbn10Entry) {
    return `https://www.amazon.co.jp/dp/${isbn10Entry.identifier}`;
  }

  const isbn13Entry = industryIdentifiers.find((id) => id.type === "ISBN_13");
  if (isbn13Entry) {
    const converted = isbn13To10(isbn13Entry.identifier);
    if (converted) {
      return `https://www.amazon.co.jp/dp/${converted}`;
    }
  }

  // Fallback: no usable ISBN, so search Amazon by title + author instead
  // of returning null (which would hide the button entirely).
  const query = [title, author].filter(Boolean).join(" ");
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}`;
}

async function fetchBooksByAuthor(author, genreTerm = "", retries = 2) {
  try {
    const query = genreTerm
      ? `inauthor:${author} ${genreTerm}`
      : `inauthor:${author}`;

    const { data } = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: query,
          langRestrict: "ja",
          maxResults: 3,
          printType: "books",
          key: GOOGLE_BOOKS_API_KEY,
        },
        timeout: 8000,
      }
    );

    // If a genre-narrowed search comes back empty, fall back to the
    // author's full catalog rather than returning nothing for them.
    if ((!data.items || data.items.length === 0) && genreTerm) {
      return fetchBooksByAuthor(author, "", retries);
    }

    if (!data.items) return [];
    return data.items
      .map((item) => {
        const title = item.volumeInfo.title || "タイトル不明";
        const bookAuthor = item.volumeInfo.authors?.join("、") || author;
        return {
          title,
          author: bookAuthor,
          description: item.volumeInfo.description || "",
          image: item.volumeInfo.imageLinks?.thumbnail || null,
          categories: item.volumeInfo.categories || [],
          amazonUrl: buildAmazonUrl(
            item.volumeInfo.industryIdentifiers,
            title,
            bookAuthor
          ),
        };
      })
      .filter((book) => book.description.length > 30);
  } catch (err) {
    const status = err.response?.status;
    if (status === 429 && retries > 0) {
      // Back off and retry on rate-limit errors
      await delay(1000);
      return fetchBooksByAuthor(author, genreTerm, retries - 1);
    }
    console.error(`Failed to fetch books for ${author}:`, err.message);
    return [];
  }
}

// Fetch sequentially with a small gap between requests to avoid
// bursting Google Books' per-second rate limit (was previously
// Promise.all, which fired all requests at once and triggered 429s).
async function fetchAllBooks(authors, genreTerm = "", gapMs = 300) {
  const allResults = [];
  for (const author of authors) {
    const books = await fetchBooksByAuthor(author, genreTerm);
    allResults.push(books);
    await delay(gapMs);
  }
  return allResults;
}

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

app.post("/recommend", async (req, res) => {
  try {
    const { moodType, cardKey, genre } = req.body;
    console.log("Received:", { moodType, cardKey, genre });

    if (!moodType || !cardKey) {
      return res.status(400).json({ error: "moodType and cardKey are required" });
    }

    const authors = genreAuthors[genre] || moodAuthors[moodType] || moodAuthors.healing;

    // Use the first, most representative genre keyword as an actual
    // search term against Google Books (e.g. "小説" for novel), so
    // results lean toward that author's genre-matching works instead
    // of any non-fiction/essay title that happens to score well later.
    const genreTerm = GENRE_KEYWORDS[genre]?.[0] || "";

    // Fetch books from all authors, throttled to avoid 429s
    const results = await fetchAllBooks(authors, genreTerm);

    // Flatten and deduplicate. Google Books often returns the same work
    // twice under near-identical titles (e.g. a base title plus a
    // subtitle variant of the same edition), and critically these two
    // copies can have different `categories` completeness — one tagged,
    // one not. Group by the title's leading segment (before the first
    // separator) so near-duplicates merge into one entry and inherit
    // each other's categories, instead of the uncategorized copy
    // silently slipping past genre filtering later.
    const bookMap = new Map();
    const bookOrder = [];
    for (const authorBooks of results) {
      for (const book of authorBooks) {
        const key = book.title.split(/[\s　:：\-―]/)[0].trim() || book.title;
        if (bookMap.has(key)) {
          const existing = bookMap.get(key);
          existing.categories = Array.from(
            new Set([...(existing.categories || []), ...(book.categories || [])])
          );
        } else {
          bookMap.set(key, book);
          bookOrder.push(key);
        }
      }
    }
    const allBooks = bookOrder.map((key) => bookMap.get(key));

    console.log(`Total books fetched: ${allBooks.length}`);

    if (allBooks.length === 0) {
      return res.status(404).json({ error: "本が見つかりませんでした" });
    }

    // Hard-filter to books that actually match the selected genre, so the
    // final recommendation can never drift into a different genre just
    // because it scored well on mood/card similarity. Authors are already
    // genre-specialists (see genreAuthors), but Google Books' per-author
    // search can still return their off-genre work, so this filter is
    // what actually guarantees the result matches the chosen genre.
    const genreBooks = genre ? allBooks.filter((book) => matchesGenre(book, genre)) : allBooks;

    if (genreBooks.length === 0) {
      return res.status(404).json({ error: "選択したジャンルに合う本が見つかりませんでした" });
    }

    // Build query from mood + card + genre (genre is optional; if not
    // provided or unrecognized, it simply contributes nothing extra)
    const moodDesc = moodDescriptions[moodType] || moodDescriptions.healing;
    const cardDesc = cardDescriptions[cardKey] || "";
    const genreDesc = GENRE_KEYWORDS[genre]?.join("、") || "";
    const query = `${moodDesc} ${cardDesc} ${genreDesc}`;

    // Get embeddings for the query and the book descriptions separately.
    // Cohere's embed-multilingual-v3.0 is asymmetric: the search query
    // should use inputType "search_query" while the documents being
    // searched should use "search_document". Embedding both sides with
    // the same inputType puts them in a slightly different vector space
    // and quietly hurts ranking quality.
    const [queryEmbedResponse, bookEmbedResponse] = await Promise.all([
      cohere.embed({
        texts: [query],
        model: "embed-multilingual-v3.0",
        inputType: "search_query",
      }),
      cohere.embed({
        texts: genreBooks.map((b) => b.description),
        model: "embed-multilingual-v3.0",
        inputType: "search_document",
      }),
    ]);

    const queryEmbedding = queryEmbedResponse.embeddings[0];
    const bookEmbeddings = bookEmbedResponse.embeddings;

    // Score each genre-matched book by cosine similarity to mood/card/genre.
    const scored = genreBooks.map((book, i) => {
      return {
        ...book,
        score: cosineSimilarity(queryEmbedding, bookEmbeddings[i]),
      };
    });

    // Sort by score descending and take top 4 (log scores before stripping them)
    const sortedTop4 = scored.sort((a, b) => b.score - a.score).slice(0, 4);

    console.log(
      "Top 4 books:",
      sortedTop4.map((b) => `${b.title} (${b.score?.toFixed(3)})`)
    );

    const top4 = sortedTop4.map(({ score, categories, ...book }) => book);

    res.json({ books: top4 });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});