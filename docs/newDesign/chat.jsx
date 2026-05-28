/* eslint-disable */
// Chat panel — includes empty state, messages, citations, input
// Also exports the mobile pearl + fullscreen wrapper

const { useState, useEffect, useRef, useCallback } = React;
const LIB = window.LIBRARY;

// ===== Icons (inline SVG, single source) =====
const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    send: <><path d="M3 12 21 4l-8 18-2.5-7.5L3 12Z" /></>,
    book: <><path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4Z" /><path d="M4 16a4 4 0 0 1 4-4h10" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    seedling: <><path d="M12 22V12" /><path d="M12 12c0-3 2-6 6-6 0 4-2 7-6 7" /><path d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5" /></>,
    bookmark: <><path d="M6 3h12v18l-6-4-6 4V3Z" /></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
    paperclip: <><path d="m21 11-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 1 1-3-3l7.5-7.5" /></>,
    sparkle: <><path d="M12 3 13.5 9 19 10.5 13.5 12 12 18 10.5 12 5 10.5 10.5 9 12 3Z" /></>,
    x: <><path d="M18 6 6 18M6 6l12 12" /></>,
    more: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
    refresh: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    chevronDown: <><path d="m6 9 6 6 6-6" /></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
};

window.Icon = Icon;

// ===== Book mini-cover (used in chat citations and book grid) =====
const BookCover = ({ book, large = false }) => {
  const [c1, c2] = LIB.covers[book.cover] || ["#333", "#111"];
  const isCream = book.cover === "cream";
  const txt = isCream ? "#3A2E1E" : "rgba(255,255,255,0.92)";
  const sub = isCream ? "rgba(58,46,30,0.7)" : "rgba(255,255,255,0.6)";

  return (
    <svg
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={`g-${book.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <pattern
          id={`p-${book.id}`}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="40" height="40" fill="transparent" />
          <path
            d="M0 20 L20 0 L40 20 L20 40 Z"
            fill="none"
            stroke={isCream ? "rgba(58,46,30,0.08)" : "rgba(255,255,255,0.05)"}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="200" height="300" fill={`url(#g-${book.id})`} />
      <rect width="200" height="300" fill={`url(#p-${book.id})`} />
      {/* Spine highlight */}
      <rect x="0" y="0" width="6" height="300" fill="rgba(0,0,0,0.18)" />
      <rect x="6" y="0" width="1" height="300" fill="rgba(255,255,255,0.1)" />
      {/* Top ornament */}
      <g transform="translate(100, 50)" opacity="0.85">
        <circle r="22" fill="none" stroke={txt} strokeWidth="0.6" />
        <circle r="16" fill="none" stroke={txt} strokeWidth="0.4" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill={txt}
          fontFamily="Amiri, serif"
          fontSize="20"
          fontWeight="700"
        >
          {book.mark}
        </text>
      </g>
      {/* Arabic title */}
      <text
        x="100"
        y="160"
        textAnchor="middle"
        fill={txt}
        fontFamily="Amiri, serif"
        fontSize={large ? "16" : "20"}
        fontWeight="700"
        direction="rtl"
      >
        {book.titleAr}
      </text>
      {/* Latin title */}
      <foreignObject x="16" y="190" width="168" height="60">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            color: txt,
            fontFamily: "Fraunces, serif",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.15,
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          {book.title}
        </div>
      </foreignObject>
      {/* Author bottom */}
      <text
        x="100"
        y="278"
        textAnchor="middle"
        fill={sub}
        fontFamily="Geist, sans-serif"
        fontSize="8"
        letterSpacing="1.6"
      >
        {book.year < 1900 ? `${book.year} CE` : book.year}
      </text>
    </svg>
  );
};
window.BookCover = BookCover;

// ===== Citation card inside chat =====
const CiteCard = ({ book, onOpen }) => {
  const cat = LIB.categories.find((c) => c.id === book.category);
  return (
    <div className="cite-card" onClick={() => onOpen && onOpen(book)}>
      <div className="cite-cover">
        <BookCover book={book} />
      </div>
      <div className="cite-info">
        <div className="cite-title">{book.title}</div>
        <div className="cite-author">{book.author.split(" · ")[0]}</div>
        <div className="cite-badge">
          {cat ? cat.label : ""} · {book.year} CE
        </div>
      </div>
      <button className="cite-open" type="button">
        Aç
      </button>
    </div>
  );
};

// ===== Message block renderer =====
const MessageBlock = ({ block, onOpenBook }) => {
  if (block.type === "text") {
    return <div>{block.content}</div>;
  }
  if (block.type === "arabic") {
    return <span className="arabic">{block.content}</span>;
  }
  if (block.type === "tag") {
    return <div className="message-tag">{block.content}</div>;
  }
  if (block.type === "books") {
    const books = block.ids
      .map((id) => LIB.books.find((b) => b.id === id))
      .filter(Boolean);
    return (
      <div className="cite-cards">
        {books.map((b) => (
          <CiteCard key={b.id} book={b} onOpen={onOpenBook} />
        ))}
      </div>
    );
  }
  return null;
};

// ===== Quick prompt button =====
const QuickPromptBtn = ({ prompt, onClick }) => (
  <button className="quick-prompt" onClick={onClick}>
    <div className="quick-prompt-icon">
      <Icon name={prompt.icon} size={15} />
    </div>
    <div>
      <div className="quick-prompt-label">{prompt.label}</div>
      <div className="quick-prompt-sub">{prompt.sub}</div>
    </div>
  </button>
);

// ===== Greet text (changes by language) =====
const greetings = {
  ru: {
    arabic: "السَّلَامُ عَلَيْكُمْ",
    title: "Ben Hikme — kütüphane rehberin",
    text: "Ayetler, hadisler, fıkıh ya da kitap önerileri hakkında sor. Kaynakları gösterir, doğrudan kataloğa yönlendiririm.",
  },
  tr: {
    arabic: "السَّلَامُ عَلَيْكُمْ",
    title: "Ben Hikme — kütüphane rehberin",
    text: "Ayetler, hadisler, fıkıh ya da kitap önerileri hakkında sor. Kaynakları gösterir, kataloğa doğrudan yönlendiririm.",
  },
  ar: {
    arabic: "السَّلَامُ عَلَيْكُمْ ورَحْمَةُ اللهِ",
    title: "أنا حِكْمة — رفيقُك في المكتبة",
    text: "اسأل عن الآيات والأحاديث والفقه أو اقتراحات الكتب. أُحيلُك إلى المصادر مباشرة.",
  },
};
const placeholders = {
  ru: "Bir şey sor — ayet, hadis, kitap…",
  tr: "Soru sor — ayet, hadis, kitap…",
  ar: "اسأل عن آية أو حديث أو كتاب…",
};

// ===== Chat panel =====
const ChatPanel = ({ lang, onLangChange, onClose, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight + 1000;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, scrollToBottom]);

  const sendPrompt = (promptId, customText) => {
    const resp = LIB.responses[promptId];
    const userText = customText || (resp ? resp.userText : "");
    const aiBlocks = resp
      ? resp.aiBlocks
      : [
          {
            type: "text",
            content:
              "Güzel bir gözlem. Kütüphanedeki kaynaklara bakalım — işte ilgili birkaç tanesi:",
          },
          { type: "books", ids: ["riyad-saliheen", "nahj-balagha"] },
        ];

    setMessages((m) => [...m, { role: "user", text: userText }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages((m) => [...m, { role: "ai", blocks: aiBlocks }]);
    }, 1100);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    // Pick best-matching pre-baked response by keywords
    const lower = text.toLowerCase();
    let key = null;
    if (lower.includes("ayet") || lower.includes("fatih") || lower.includes("sure"))
      key = "explain-ayah";
    else if (lower.includes("tecvid") || lower.includes("bul") || lower.includes("kitap"))
      key = "find-book";
    else if (lower.includes("hadis")) key = "hadith-day";
    else if (lower.includes("başla") || lower.includes("yeni") || lower.includes("nereden"))
      key = "for-beginner";

    if (key) {
      sendPrompt(key, text);
    } else {
      // generic
      setMessages((m) => [...m, { role: "user", text }]);
      setThinking(true);
      setTimeout(() => {
        setThinking(false);
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            blocks: [
              {
                type: "text",
                content:
                  "İlginç bir soru. Bu konuda klasik eserler var — işte kütüphaneden birkaç başlangıç noktası. Geleneği (Sünni / Şii) belirtirsen seçimi daha da daraltabilirim.",
              },
              { type: "books", ids: ["riyad-saliheen", "nahj-balagha", "ihya-ulum"] },
            ],
          },
        ]);
      }, 1200);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onOpenBook = (book) => {
    console.log("Open book:", book.id);
    // would navigate to /book/:id
  };

  const newChat = () => setMessages([]);

  const greet = greetings[lang] || greetings.tr;

  return (
    <div className="chat">
      {/* Header */}
      <div className="chat-header">
        <div className="ai-avatar">
          <Icon name="sparkle" size={20} stroke={1.4} />
        </div>
        <div>
          <div className="ai-name">Hikme</div>
          <div className="ai-status">Kütüphanenin yapay zekâ rehberi · çevrimiçi</div>
        </div>
        <div className="chat-actions">
          <button
            className="icon-btn"
            title="Yeni sohbet"
            onClick={newChat}
            type="button"
          >
            <Icon name="plus" size={15} />
          </button>
          {isMobile ? (
            <button
              className="icon-btn"
              title="Kapat"
              onClick={onClose}
              type="button"
            >
              <Icon name="x" size={15} />
            </button>
          ) : (
            <button className="icon-btn" title="Daha fazla" type="button">
              <Icon name="more" size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <>
            <div className="chat-greet">
              <div className="chat-greet-arabic">{greet.arabic}</div>
              <div className="chat-greet-title">{greet.title}</div>
              <div className="chat-greet-text">{greet.text}</div>
            </div>
            <div className="quick-prompts">
              {LIB.quickPrompts.map((p) => (
                <QuickPromptBtn
                  key={p.id}
                  prompt={p}
                  onClick={() => sendPrompt(p.id)}
                />
              ))}
            </div>
          </>
        )}

        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="msg user">
                <div className="msg-bubble">{msg.text}</div>
              </div>
            );
          }
          return (
            <div key={i} className="msg ai">
              <div className="msg-bubble">
                {msg.blocks.map((b, j) => (
                  <MessageBlock key={j} block={b} onOpenBook={onOpenBook} />
                ))}
              </div>
            </div>
          );
        })}

        {thinking && (
          <div className="msg ai">
            <div className="typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-wrap">
        <div className="chat-input">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholders[lang]}
            rows={1}
          />
          <div className="chat-input-tools">
            <button className="chat-tool" title="Ekle" type="button">
              <Icon name="paperclip" size={16} />
            </button>
            <button className="chat-tool" title="Ses" type="button">
              <Icon name="mic" size={16} />
            </button>
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim()}
              type="button"
            >
              <Icon name="arrowUp" size={16} />
            </button>
          </div>
        </div>
        <div className="chat-footer-note">
          Hikme klasik kaynaklara dayanır — önemli konuları âlimlere danış.
        </div>
      </div>
    </div>
  );
};

window.ChatPanel = ChatPanel;

// ===== Mobile pearl =====
const Pearl = ({ onClick }) => (
  <button className="pearl" onClick={onClick} aria-label="AI sohbetini aç" type="button">
    <span className="pearl-ping"></span>
    <Icon name="sparkle" size={26} stroke={1.4} />
  </button>
);
window.Pearl = Pearl;
