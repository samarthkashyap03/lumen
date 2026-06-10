import React from "react";

// Helper to parse inline markdown tags: **bold**, *italic*, <u>underline</u>, ~~strikethrough~~, `inline code`
export function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match: **bold**, *italic*, ~~strikethrough~~, `code`, <u>underline</u>
  const regex = /(\*\*.*?\*\*|\*.*?\*|~~.*?~~|`.*?`|<u>.*?<\/u>)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-ember font-normal">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return (
        <del key={index} className="line-through opacity-60">
          {part.slice(2, -2)}
        </del>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 bg-card border border-line rounded text-xs font-mono text-ember"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("<u>") && part.endsWith("</u>")) {
      return (
        <u key={index} className="underline decoration-ember/50">
          {part.slice(3, -4)}
        </u>
      );
    }
    return part;
  });
}

export function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    // Remove headings
    .replace(/^#+\s+/gm, "")
    // Remove lists
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove bold/italics/strikethrough
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Replace multiple newlines with a single space
    .replace(/\n+/g, " ")
    .trim();
}

interface MarkdownRendererProps {
  content: string;
  isFirstLetterLarge?: boolean;
}

export function MarkdownRenderer({ content, isFirstLetterLarge = false }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];

  let currentList: { type: "ul" | "ol" | "quote"; items: string[] } | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const flushCurrentList = (key: number) => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      blocks.push(
        <ul
          key={`ul-${key}`}
          className="list-disc list-inside pl-4 space-y-2 my-4 text-foreground/85 font-light"
        >
          {currentList.items.map((item, idx) => (
            <li key={idx} className="text-base md:text-lg leading-relaxed">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
    } else if (currentList.type === "ol") {
      blocks.push(
        <ol
          key={`ol-${key}`}
          className="list-decimal list-inside pl-4 space-y-2 my-4 text-foreground/85 font-light"
        >
          {currentList.items.map((item, idx) => (
            <li key={idx} className="text-base md:text-lg leading-relaxed">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
    } else if (currentList.type === "quote") {
      blocks.push(
        <blockquote
          key={`quote-${key}`}
          className="border-l-2 border-ember pl-6 my-6 italic text-foreground/90 bg-card/5 py-2 pr-4 rounded-r-md"
        >
          {currentList.items.map((item, idx) => (
            <p key={idx} className="text-base md:text-lg leading-relaxed mb-2 last:mb-0">
              {parseInlineMarkdown(item)}
            </p>
          ))}
        </blockquote>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code block
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        blocks.push(
          <pre
            key={`code-${i}`}
            className="p-4 bg-ink/80 border border-line rounded-lg overflow-x-auto my-6 font-mono text-sm text-foreground/90"
          >
            <code>{codeBlockContent.join("\n")}</code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockContent = [];
      } else {
        flushCurrentList(i);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Horizontal Rule
    if (line === "---" || line === "***" || line === "___") {
      flushCurrentList(i);
      blocks.push(<hr key={`hr-${i}`} className="my-8 border-line" />);
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      flushCurrentList(i);
      blocks.push(
        <h1
          key={`h1-${i}`}
          className="text-3xl md:text-4xl font-serif text-foreground mt-8 mb-4 font-semibold leading-tight"
        >
          {parseInlineMarkdown(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushCurrentList(i);
      blocks.push(
        <h2
          key={`h2-${i}`}
          className="text-2xl md:text-3xl font-serif text-foreground mt-6 mb-3 font-semibold leading-tight"
        >
          {parseInlineMarkdown(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushCurrentList(i);
      blocks.push(
        <h3
          key={`h3-${i}`}
          className="text-xl md:text-2xl font-serif text-foreground mt-4 mb-2 font-semibold leading-tight"
        >
          {parseInlineMarkdown(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteText = line.slice(1).trim();
      if (currentList && currentList.type === "quote") {
        currentList.items.push(quoteText);
      } else {
        flushCurrentList(i);
        currentList = { type: "quote", items: [quoteText] };
      }
      continue;
    }

    // Unordered List
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const itemText = line.slice(2);
      if (currentList && currentList.type === "ul") {
        currentList.items.push(itemText);
      } else {
        flushCurrentList(i);
        currentList = { type: "ul", items: [itemText] };
      }
      continue;
    }

    // Ordered List
    const olMatch = line.match(/^(\d+)\.\s(.*)/);
    if (olMatch) {
      const itemText = olMatch[2];
      if (currentList && currentList.type === "ol") {
        currentList.items.push(itemText);
      } else {
        flushCurrentList(i);
        currentList = { type: "ol", items: [itemText] };
      }
      continue;
    }

    // Empty line separates paragraphs and flushes lists
    if (line.trim() === "") {
      flushCurrentList(i);
      continue;
    }

    // Standard paragraph line - collect consecutive normal lines
    flushCurrentList(i);

    const paragraphLines = [line];
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() !== "" &&
      !lines[i + 1].startsWith("#") &&
      !lines[i + 1].startsWith("- ") &&
      !lines[i + 1].startsWith("* ") &&
      !lines[i + 1].startsWith(">") &&
      !lines[i + 1].match(/^(\d+)\.\s/) &&
      !lines[i + 1].startsWith("```") &&
      lines[i + 1] !== "---"
    ) {
      i++;
      paragraphLines.push(lines[i]);
    }

    const paragraphText = paragraphLines.join(" ");

    if (isFirstLetterLarge && blocks.length === 0) {
      const trimmed = paragraphText.trim();
      const firstLetter = trimmed.charAt(0);
      const restText = trimmed.slice(1);
      blocks.push(
        <p
          key={`p-${i}`}
          className="text-lg md:text-xl text-foreground/75 leading-relaxed font-light first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-ember first-letter:leading-none"
        >
          {firstLetter}
          {parseInlineMarkdown(restText)}
        </p>
      );
    } else {
      blocks.push(
        <p key={`p-${i}`} className="text-lg md:text-xl text-foreground/75 leading-relaxed font-light">
          {parseInlineMarkdown(paragraphText)}
        </p>
      );
    }
  }

  flushCurrentList(lines.length);

  return <div className="space-y-6">{blocks}</div>;
}
