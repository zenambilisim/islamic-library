/* eslint-disable */
// Maktaba — main app: header, browse, filters, root
const { useState, useEffect, useMemo } = React;
const LIB = window.LIBRARY;
const { Icon, BookCover, ChatPanel, Pearl } = window;

// ===== Header =====
const Header = ({ lang, onLangChange }) => {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark">م</div>
          <div>
            <div className="brand-name">Maktaba</div>
            <div className="brand-sub">Islamic Library</div>
          </div>
        </div>

        <div className="search">
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="Kitap, yazar, konu, ayet ara…"
            aria-label="Ara"
          />
          <div className="search-kbd">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </div>
        </div>

        <div className="header-right">
          <div className="lang-switch" role="tablist">
            {["ru", "tr", "ar"].map((l) => (
              <button
                key={l}
                data-lang={l}
                className={lang === l ? "active" : ""}
                onClick={() => onLangChange(l)}
                type="button"
              >
                {l === "ar" ? "ع" : l.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="icon-btn" title="Yer imleri" type="button">
            <Icon name="bookmark" size={16} />
          </button>
          <div className="avatar" title="Hesap">
            A
          </div>
        </div>
      </div>
    </header>
  );
};

// ===== Browse hero =====
const heroByAesthetic = {
  editorial: {
    eyebrow: "Islamic Library · 12 847 cilt",
    title: ["İslam düşüncesinin klasikleri —", "tek bir satırdan."],
    text:
      "Tefsir, hadis, fıkıh, felsefe. Sünni ve Şii kaynaklar tek bir katalogda. Hikme aradığını bulmana ve bağlamı açıklamana yardım eder.",
  },
  bookish: {
    eyebrow: "Islamic Library · فهرس",
    title: ["On dört yüzyıllık düşüncenin", "kitaplığı."],
    text:
      "el-Buhârî ve el-Küleynî'den modern tefsirlere. Aslından oku, çeviriden oku ya da Hikme'den açıklamasını iste.",
  },
  dark: {
    eyebrow: "Karanlık koleksiyon · seçkiler",
    title: ["Bin yıllık ilim —", "tek bir kandilin ışığında."],
    text:
      "Seçilmiş kütüphane: klasik metinler, tefsirler, biyografiler ve tasavvuf eserleri. Yapay zekâ asistanı ve hassas filtrelerle arama.",
  },
};

const HeroPattern = () => (
  <svg className="hero-pattern" viewBox="0 0 200 200" fill="none">
    <g stroke="var(--accent)" strokeWidth="0.8" opacity="0.7">
      {[...Array(8)].map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={100}
            y1={100}
            x2={100 + Math.cos(a) * 90}
            y2={100 + Math.sin(a) * 90}
          />
        );
      })}
      <circle cx="100" cy="100" r="30" />
      <circle cx="100" cy="100" r="55" />
      <circle cx="100" cy="100" r="85" />
      {/* 8-pointed star */}
      <g>
        <rect x="60" y="60" width="80" height="80" transform="rotate(0 100 100)" />
        <rect x="60" y="60" width="80" height="80" transform="rotate(45 100 100)" />
      </g>
    </g>
  </svg>
);

const Hero = ({ aesthetic }) => {
  const h = heroByAesthetic[aesthetic] || heroByAesthetic.editorial;
  return (
    <div className="browse-hero">
      <HeroPattern />
      <div className="browse-hero-eyebrow">{h.eyebrow}</div>
      <h1>
        {h.title[0]} <br />
        <em>{h.title[1]}</em>
      </h1>
      <p>{h.text}</p>
      <div className="browse-hero-stats">
        <div>
          <span className="stat-num">12 847</span>
          <div className="stat-label">Cilt</div>
        </div>
        <div>
          <span className="stat-num">3 ٫ 1 M</span>
          <div className="stat-label">Dizindeki ayet ve hadis</div>
        </div>
        <div>
          <span className="stat-num">9</span>
          <div className="stat-label">Kategori</div>
        </div>
      </div>
    </div>
  );
};

// ===== Featured slider =====
const FeaturedSlider = ({ onAsk }) => {
  const featured = LIB.books.filter((b) => b.featured);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(t);
  }, [paused, featured.length]);

  const go = (n) => setIdx((n + featured.length) % featured.length);
  const current = featured[idx];
  const [c1, c2] = LIB.covers[current.cover];

  return (
    <div
      className="slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {featured.map((b, i) => {
        const [bc1, bc2] = LIB.covers[b.cover];
        return (
          <div
            key={b.id}
            className={`slide ${i === idx ? "active" : ""}`}
            aria-hidden={i !== idx}
          >
            <div
              className="slide-bg"
              style={{
                background: `linear-gradient(135deg, ${bc1}, ${bc2})`,
              }}
            />
            <svg
              className="slide-pattern"
              viewBox="0 0 400 400"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id={`sp-${b.id}`}
                  width="60"
                  height="60"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <path
                    d="M0 30 L30 0 L60 30 L30 60 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="400" height="400" fill={`url(#sp-${b.id})`} />
            </svg>
            <div className="slide-arabic-bg" aria-hidden="true">
              {b.mark}
            </div>

            <div className="slide-content">
              <div className="slide-eyebrow">Seçkiler · Klasikler</div>
              <h2 className="slide-title">{b.title}</h2>
              <div className="slide-arabic">{b.titleAr}</div>
              <div className="slide-author">{b.author.split(" · ")[0]}</div>
              {b.quote && (
                <div className="slide-quote">
                  {b.quoteAr && (
                    <span className="slide-quote-ar">{b.quoteAr}</span>
                  )}
                  <span className="slide-quote-ru">«{b.quote}»</span>
                </div>
              )}
              <div className="slide-ctas">
                <button className="slide-cta primary" type="button">
                  <Icon name="book" size={15} />
                  Oku
                </button>
                <button
                  className="slide-cta ghost"
                  type="button"
                  onClick={() => onAsk && onAsk(b)}
                >
                  <Icon name="sparkle" size={15} />
                  Kitabı Hikme'ye sor
                </button>
              </div>
            </div>

            <div className="slide-cover">
              <BookCover book={b} large />
            </div>
          </div>
        );
      })}

      <button
        className="slider-arrow prev"
        onClick={() => go(idx - 1)}
        aria-label="Önceki"
        type="button"
      >
        <Icon name="chevronDown" size={18} />
      </button>
      <button
        className="slider-arrow next"
        onClick={() => go(idx + 1)}
        aria-label="Sonraki"
        type="button"
      >
        <Icon name="chevronDown" size={18} />
      </button>

      <div className="slider-dots">
        {featured.map((b, i) => (
          <button
            key={b.id}
            className={`slider-dot ${i === idx ? "active" : ""}`}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            type="button"
          />
        ))}
      </div>

      <div className="slider-count">
        {String(idx + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}
      </div>
    </div>
  );
};

// ===== Tabs (categories) =====
const Tabs = ({ value, onChange }) => {
  // Show first 5 categories as tabs
  const visible = LIB.categories.slice(0, 5);
  return (
    <div className="tabs">
      {visible.map((c) => (
        <button
          key={c.id}
          className={`tab ${value === c.id ? "active" : ""}`}
          onClick={() => onChange(c.id)}
          type="button"
        >
          {c.label}
          <span className="tab-count">{c.count.toLocaleString("tr")}</span>
        </button>
      ))}
    </div>
  );
};

// ===== Book card =====
const BookCard = ({ book }) => {
  const [saved, setSaved] = useState(false);
  const cat = LIB.categories.find((c) => c.id === book.category);
  return (
    <div className="book">
      <div className="book-cover">
        <button
          className={`book-bookmark ${saved ? "saved" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          type="button"
          aria-label="Yer imi"
        >
          <Icon name="bookmark" size={14} stroke={2} />
        </button>
        <BookCover book={book} />
      </div>
      <div className="book-meta">
        <h3 className="book-title">{book.title}</h3>
        <div className="book-author">{book.author.split(" · ")[0]}</div>
        <div className="book-tag">
          {cat ? cat.label : ""}
          <span className="dot"></span>
          {book.pages.toLocaleString("tr")} s.
        </div>
      </div>
    </div>
  );
};

// ===== Filters panel =====
const Filters = ({ category, onCategory }) => {
  return (
    <aside className="filters">
      <div className="filter-head">
        <h3>Filtreler</h3>
        <button className="filter-clear" type="button">
          Sıfırla
        </button>
      </div>

      <div className="filter-group">
        <div className="filter-label">Sıralama</div>
        <div className="filter-pill-row">
          <span className="filter-pill active">İlgi düzeyine göre</span>
          <span className="filter-pill">Yeniler</span>
          <span className="filter-pill">A — Z</span>
          <span className="filter-pill">Popüler</span>
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-label">Kategori</div>
        {LIB.categories.map((c) => (
          <div
            key={c.id}
            className={`filter-cat ${category === c.id ? "active" : ""}`}
            onClick={() => onCategory(c.id)}
          >
            <span>{c.label}</span>
            <span className="filter-cat-count">{c.count.toLocaleString("tr")}</span>
          </div>
        ))}
      </div>

      <div className="filter-group">
        <div className="filter-label">Yazıldığı yüzyıl</div>
        <input
          type="range"
          min="7"
          max="21"
          defaultValue="15"
          className="filter-slider"
        />
        <div className="filter-range-row">
          <span>VII. yy</span>
          <span>XXI. yy</span>
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-label">Orijinal dil</div>
        <div className="filter-pill-row">
          <span className="filter-pill active">Arapça</span>
          <span className="filter-pill">Farsça</span>
          <span className="filter-pill">Türkçe</span>
          <span className="filter-pill">Urduca</span>
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-label">Erişilebilirlik</div>
        <div className="filter-pill-row">
          <span className="filter-pill">PDF</span>
          <span className="filter-pill">Sesli</span>
          <span className="filter-pill active">TR Çeviri</span>
        </div>
      </div>
    </aside>
  );
};

// ===== Tweaks panel =====
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aesthetic": "editorial",
  "lang": "tr"
}/*EDITMODE-END*/;

const App = () => {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [category, setCategory] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);

  const aesthetic = tweaks.aesthetic;
  const lang = tweaks.lang;

  // Apply aesthetic to body
  useEffect(() => {
    document.body.setAttribute("data-aesthetic", aesthetic);
  }, [aesthetic]);

  const filtered = useMemo(() => {
    return LIB.books.filter(
      (b) => category === "all" || b.category === category
    );
  }, [category]);

  const browseSubtitle = `koleksiyondan ${filtered.length} kitap`;

  return (
    <>
      <Header lang={lang} onLangChange={(l) => setTweak("lang", l)} />

      <div className="layout">
        {/* Left — Chat */}
        <div className="col-chat" data-screen-label="ai-chat">
          <ChatPanel
            lang={lang}
            onLangChange={(l) => setTweak("lang", l)}
            isMobile={false}
          />
        </div>

        {/* Center — Browse */}
        <main className="browse" data-screen-label="browse">
          <FeaturedSlider />

          <div>
            <div className="section-head">
              <div>
                <h2 className="section-title">Katalog</h2>
                <div className="section-sub">{browseSubtitle}</div>
              </div>
              <Tabs value={category} onChange={setCategory} />
            </div>
            <div className="books-grid">
              {filtered.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </div>
        </main>

        {/* Right — Filters */}
        <div className="col-filters" data-screen-label="filters">
          <Filters
            category={category}
            onCategory={setCategory}
          />
        </div>
      </div>

      {/* Mobile pearl */}
      <Pearl onClick={() => setMobileOpen(true)} />
      {mobileOpen && (
        <div
          className="mobile-chat"
          style={{ display: "flex" }}
          data-screen-label="mobile-chat"
        >
          <ChatPanel
            lang={lang}
            onLangChange={(l) => setTweak("lang", l)}
            isMobile={true}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Tweaks */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Estetik" />
        <window.TweakRadio
          label="Tema"
          value={tweaks.aesthetic}
          onChange={(v) => setTweak("aesthetic", v)}
          options={[
            { value: "editorial", label: "Editorial" },
            { value: "bookish", label: "Bookish" },
            { value: "dark", label: "Dark" },
          ]}
        />
        <window.TweakSection label="Arayüz dili" />
        <window.TweakRadio
          label="Dil"
          value={tweaks.lang}
          onChange={(v) => setTweak("lang", v)}
          options={[
            { value: "ru", label: "RU" },
            { value: "tr", label: "TR" },
            { value: "ar", label: "AR" },
          ]}
        />
      </window.TweaksPanel>
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
