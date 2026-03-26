import React from "react";
import { isBuilderAiTextHighlighted } from "../../../lib/builder/aiHighlights";
import { previewHighlightInlineClassName } from "./highlightStyles";

interface HighlightedSkillTokensProps {
  skills: string[];
  highlightedSkills: string[];
  baseClassName?: string;
  highlightedClassName?: string;
}

const HighlightedSkillTokens: React.FC<HighlightedSkillTokensProps> = ({
  skills,
  highlightedSkills,
  baseClassName = "",
  highlightedClassName = previewHighlightInlineClassName,
}) => (
  <>
    {skills.map((skill, index) => {
      const isHighlighted = isBuilderAiTextHighlighted(highlightedSkills, skill);
      const className = isHighlighted
        ? `${baseClassName} ${highlightedClassName}`.trim()
        : baseClassName || undefined;

      return (
        <React.Fragment key={`${skill}-${index}`}>
          <span className={className}>{skill}</span>
          {index < skills.length - 1 ? ", " : null}
        </React.Fragment>
      );
    })}
  </>
);

export default HighlightedSkillTokens;
