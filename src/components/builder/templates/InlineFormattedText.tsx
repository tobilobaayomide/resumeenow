import React from "react";
import { toExternalLinkHref } from "../../../domain/resume";
import {
  parseInlineFormattingSegments,
  type InlineFormattingSegment,
} from "../../../lib/inlineFormatting";

interface InlineFormattedTextProps {
  value: string;
  linkClassName?: string;
  linkStyle?: React.CSSProperties;
}

const renderInlineSegments = (
  segments: InlineFormattingSegment[],
  keyPrefix: string,
  linkClassName?: string,
  linkStyle?: React.CSSProperties,
): React.ReactNode[] =>
  segments.map((segment, index) => {
    const key = `${keyPrefix}-${index}`;

    if (segment.type === "text") {
      return <React.Fragment key={key}>{segment.text}</React.Fragment>;
    }

    if (segment.type === "bold") {
      return (
        <strong key={key}>
          <InlineFormattedText
            value={segment.text}
            linkClassName={linkClassName}
            linkStyle={linkStyle}
          />
        </strong>
      );
    }

    if (segment.type === "italic") {
      return (
        <em key={key}>
          <InlineFormattedText
            value={segment.text}
            linkClassName={linkClassName}
            linkStyle={linkStyle}
          />
        </em>
      );
    }

    if (segment.type === "boldItalic") {
      return (
        <strong key={key}>
          <em>
            <InlineFormattedText
              value={segment.text}
              linkClassName={linkClassName}
              linkStyle={linkStyle}
            />
          </em>
        </strong>
      );
    }

    return (
      <a
        key={key}
        href={toExternalLinkHref(segment.url)}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        style={{
          color: "#2563eb",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          overflowWrap: "anywhere",
          ...linkStyle,
        }}
      >
        <InlineFormattedText
          value={segment.text}
          linkClassName={linkClassName}
          linkStyle={linkStyle}
        />
      </a>
    );
  });

const InlineFormattedText: React.FC<InlineFormattedTextProps> = ({
  value,
  linkClassName,
  linkStyle,
}) => {
  const segments = parseInlineFormattingSegments(value);
  if (segments.length === 0) return null;

  return (
    <>
      {renderInlineSegments(segments, "inline-format", linkClassName, linkStyle)}
    </>
  );
};

export default InlineFormattedText;
