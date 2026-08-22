import React from 'react';

export const EMOJI_MAPPING: Record<string, { unicode: string; label: string; assetUrl?: string }> = {
  "happy": { unicode: "😀", label: "Voyager Happy" },
  "smile": { unicode: "😊", label: "Voyager Smile" },
  "laugh": { unicode: "😄", label: "Voyager Laughing" },
  "cool": { unicode: "😎", label: "Voyager Cool" },
  "celebrate": { unicode: "🎉", label: "Voyager Celebrating" },
  "star": { unicode: "⭐", label: "Voyager Star" },
  "trophy": { unicode: "🏆", label: "Voyager Trophy" },
  "hands": { unicode: "🙌", label: "Voyager Hands Up" },
  "clap": { unicode: "👏", label: "Voyager Clapping" },
  "strength": { unicode: "💪", label: "Voyager Strength" },
  "sparkle": { unicode: "🌟", label: "Voyager Sparkle" },
  "rocket": { unicode: "🚀", label: "Voyager Rocket" },
  "thumbsup": { unicode: "👍", label: "Voyager Thumbs Up" },
  "heart": { unicode: "❤️", label: "Voyager Heart" },
  "thinking": { unicode: "🤔", label: "Voyager Thinking" },
  "thought": { unicode: "💭", label: "Voyager Thought" },
  "eyes": { unicode: "👀", label: "Voyager Eyes" },
  "listening": { unicode: "👂", label: "Voyager Listening" },
  "headphones": { unicode: "🎧", label: "Voyager Headphones" },
  "speaking": { unicode: "🗣️", label: "Voyager Speaking" },
  "mic": { unicode: "🎤", label: "Voyager Mic" },
  "speak": { unicode: "💬", label: "Voyager Speak" },
  "mouth": { unicode: "👄", label: "Voyager Mouth" },
  "correct": { unicode: "🎯", label: "Voyager Perfect Pronunciation" },
  "retry": { unicode: "🔁", label: "Voyager Try Again" },
  "learning": { unicode: "📚", label: "Voyager Learning" },
  "brain": { unicode: "🧠", label: "Voyager Brain" },
  "pencil": { unicode: "✏️", label: "Voyager Pencil" },
  "memo": { unicode: "📝", label: "Voyager Memo" },
  "plane": { unicode: "✈️", label: "Voyager Plane" },
  "map": { unicode: "🗺️", label: "Voyager Map" },
  "subway": { unicode: "🚇", label: "Voyager Subway" },
  "walking": { unicode: "🚶", label: "Voyager Walking" },
  "coffee": { unicode: "☕", label: "Voyager Coffee" },
  "pizza": { unicode: "🍕", label: "Voyager Pizza" },
  "temple": { unicode: "🏛️", label: "Voyager Temple" },
  "hotel": { unicode: "🏨", label: "Voyager Hotel" },
  "greeting": { unicode: "👋", label: "Voyager Greeting" },
  "handshake": { unicode: "🤝", label: "Voyager Handshake" },
  "raisinghand": { unicode: "🙋", label: "Voyager Raising Hand" },
  "question": { unicode: "❓", label: "Voyager Question" },
  "idea": { unicode: "💡", label: "Voyager Idea" },
  "party": { unicode: "🥳", label: "Voyager Party" },
  "confetti": { unicode: "🎊", label: "Voyager Confetti" },
  "medal": { unicode: "🏅", label: "Voyager Medal" }
};

// Map each unicode back to its semantic key
export const UNICODE_TO_KEY: Record<string, string> = {};
Object.entries(EMOJI_MAPPING).forEach(([key, val]) => {
  UNICODE_TO_KEY[val.unicode] = key;
  // Also strip potential variation selectors
  const clean = val.unicode.replace(/[\uFE00-\uFE0F]/g, '');
  if (clean !== val.unicode) {
    UNICODE_TO_KEY[clean] = key;
  }
});

interface VoyagerEmojiProps {
  emojiKey: string;
  className?: string;
}

export const VoyagerEmoji: React.FC<VoyagerEmojiProps> = ({ emojiKey, className = "" }) => {
  const mapping = EMOJI_MAPPING[emojiKey];
  if (!mapping) return null;

  // Render image if custom asset exists
  if (mapping.assetUrl) {
    return (
      <img
        src={mapping.assetUrl}
        alt={mapping.label}
        className={`w-5 h-5 inline-block mx-0.5 align-middle select-none ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Fallback to stylized Unicode emoji wrapped in a controlled span
  return (
    <span
      className={`voyager-emoji inline-block mx-0.5 select-none font-sans scale-110 hover:scale-125 transition-transform duration-150 cursor-help ${className}`}
      title={mapping.label}
      data-emoji-key={emojiKey}
    >
      {mapping.unicode}
    </span>
  );
};

// Parser utility
export function parseAndRenderEmojis(text: string): React.ReactNode {
  if (!text) return "";

  const keys = Object.keys(EMOJI_MAPPING);
  const unicodes = Object.values(EMOJI_MAPPING)
    .map(v => v.unicode)
    .sort((a, b) => b.length - a.length);

  const escapedKeys = keys.map(k => `:${k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}:`);
  const escapedUnicodes = unicodes.map(u => u.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

  const regex = new RegExp(`(${[...escapedKeys, ...escapedUnicodes].join('|')})`, 'g');

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith(':') && part.endsWith(':')) {
          const key = part.slice(1, -1);
          if (EMOJI_MAPPING[key]) {
            return <VoyagerEmoji key={index} emojiKey={key} />;
          }
        }

        const cleanPart = part.replace(/[\uFE00-\uFE0F]/g, '');
        const matchedKey = UNICODE_TO_KEY[part] || UNICODE_TO_KEY[cleanPart];
        if (matchedKey) {
          return <VoyagerEmoji key={index} emojiKey={matchedKey} />;
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
