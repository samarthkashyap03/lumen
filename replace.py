import sys

file_path = 'src/routes/reader.$articleId.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_start = '''  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />'''

if target_start not in content:
    print('Could not find start target')
    sys.exit(1)

new_return = '''  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />

      {/* ----------------- DESKTOP VIEW ----------------- */}
      <div className="hidden md:flex flex-col min-h-screen w-full relative z-10">
        <Navbar />'''

content = content.replace(target_start, new_return)

footer_target = '''      <Footer />
    </div>
  );
}'''

if footer_target not in content:
    print('Could not find end target')
    sys.exit(1)

new_footer = '''        <Footer />
      </div>

      {/* ----------------- MOBILE VIEW (Instagram-style) ----------------- */}
      <div className="md:hidden flex flex-col h-[100dvh] w-full relative z-20 bg-background overflow-hidden">
        {/* Mobile Header Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-line shrink-0 relative z-30 bg-background/80 backdrop-blur-md">
          <Link to="/feed" className="p-2.5 border border-line hover:bg-card/40 rounded-full bg-ink">
            <ArrowLeft className="h-4 w-4 text-foreground/80" />
          </Link>
          
          <div className="inline-flex bg-card/40 border border-line p-0.5 rounded-full shadow-inner">
            <button
              onClick={() => setShowOriginal(false)}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full transition-all ${
                !showOriginal ? "text-ink bg-ember shadow-sm" : "text-foreground/50 bg-transparent"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => {
                setShowOriginal(true);
                if (!showOriginal) trackEvent("read", articleId);
              }}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full transition-all ${
                showOriginal ? "text-ink bg-ember shadow-sm" : "text-foreground/50 bg-transparent"
              }`}
            >
              Read
            </button>
          </div>
          
          <Link to="/chat" search={{ article_id: article.id }} className="p-2.5 border border-line hover:bg-card/40 rounded-full bg-ink">
            <MessageSquare className="h-4 w-4 text-foreground/80" />
          </Link>
        </div>

        {/* Mobile Content Area */}
        {isGated ? (
          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-6 overflow-y-auto bg-ink/50">
            <p className="text-ember font-semibold tracking-[0.25em] uppercase text-xs">Premium Story</p>
            <h3 className="font-serif italic text-3xl leading-tight">Unlock this dispatch</h3>
            <p className="text-sm text-foreground/50 font-light">Sign up or log in to read the full article and ask questions.</p>
            <div className="w-full space-y-3 pt-6">
              <Link to="/register" className="block w-full py-4 bg-ember text-ink font-semibold text-xs tracking-[0.2em] uppercase rounded-sm">Create Free Account</Link>
              <Link to="/login" className="block w-full py-4 border border-line text-xs tracking-[0.2em] uppercase rounded-sm">Sign In</Link>
            </div>
          </div>
        ) : !showOriginal ? (
          /* Mobile AI Digest (Instagram Stories Style) */
          <motion.div
            className="flex-1 relative w-full h-full cursor-ns-resize bg-black"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(e, info) => {
              if (info.offset.y < -80) handleNextArticle();
              else if (info.offset.y > 80) handlePrevArticle();
            }}
          >
            <motion.div
              className="absolute inset-0 w-full h-full cursor-ew-resize overflow-hidden"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(e, info) => {
                if (info.offset.x < -60) handlePrevCard();
                else if (info.offset.x > 60) handleNextCard();
              }}
            >
              <AnimatePresence mode="wait">
                {activeCard && (
                  <motion.div
                    key={activeCard.card_index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col justify-end"
                  >
                    <img
                      src={resolveCardImage(activeCard.image_url)}
                      alt="dispatch context"
                      className="absolute inset-0 h-full w-full object-cover grayscale opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent/10" />
                    
                    <div className="relative z-10 p-6 pb-12 space-y-5">
                      {/* Instagram style top progress bars */}
                      <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
                        {cards.map((_, idx) => (
                          <div key={idx} className={`h-1 flex-1 rounded-full ${idx === activeCardIdx ? "bg-ember" : "bg-white/20"}`} />
                        ))}
                      </div>

                      <span className="inline-block px-3 py-1 bg-ember/10 border border-ember/30 text-ember text-[10px] font-semibold uppercase tracking-[0.2em] rounded mt-6">
                        {activeCard.category}
                      </span>
                      <h3 className="font-serif text-3xl leading-tight text-foreground/95 drop-shadow-md">
                        {activeCard.title.split("*").map((t, idx) =>
                          idx % 2 !== 0 ? <em key={idx} className="italic text-ember font-normal">{t}</em> : t
                        )}
                      </h3>
                      <p className="text-base leading-relaxed text-foreground/75 font-light drop-shadow-md pb-2">
                        {activeCard.summary.split("*").map((t, idx) =>
                          idx % 2 !== 0 ? <em key={idx} className="italic text-ember font-normal">{t}</em> : t
                        )}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : (
          /* Mobile Original Article (Scrollable) */
          <div className="flex-1 overflow-y-auto w-full p-6 pb-24 space-y-8 select-text bg-background">
            <section className="space-y-4 mb-8">
              <span className="text-ember text-[10px] font-bold uppercase tracking-[0.2em]">{article.category}</span>
              <h1 className="font-serif text-4xl leading-tight">
                {article.title.replace(/\*(.*?)\*/g, "$1")}
                <span className="italic text-ember">.</span>
              </h1>
              <div className="flex justify-between items-center text-[10px] text-foreground/50 border-b border-line pb-4 pt-2 font-medium">
                <span>By {article.author}</span>
                <span>{new Date(article.published_at).toLocaleDateString("en-US")}</span>
              </div>
            </section>
            
            <article className="space-y-6">
              {paragraphs.map((p, idx) => (
                <p
                  key={idx}
                  className={`text-lg text-foreground/80 leading-relaxed font-light ${
                    idx === 0 ? "first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-ember first-letter:leading-none" : ""
                  }`}
                >
                  {p.split("**").map((text, i) => {
                    const isBold = i % 2 !== 0;
                    return text.split("*").map((subText, j) => {
                      const isItalic = j % 2 !== 0;
                      if (isBold) return <strong key={`${i}-${j}`}>{subText}</strong>;
                      if (isItalic) return <em key={`${i}-${j}`} className="italic text-ember">{subText}</em>;
                      return subText;
                    });
                  })}
                </p>
              ))}
            </article>

            {/* Next/Prev Floating Action Buttons */}
            <div className="pt-10 flex justify-between border-t border-line/40">
              <button 
                onClick={handlePrevArticle} 
                disabled={!prevArticleId}
                className="text-[10px] uppercase tracking-widest text-foreground/50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button 
                onClick={handleNextArticle}
                disabled={!nextArticleId}
                className="text-[10px] uppercase tracking-widest text-foreground/50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}'''

content = content.replace(footer_target, new_footer)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated successfully')
