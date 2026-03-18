import React from "react";
import { View, Text, StyleSheet, Link } from "@react-pdf/renderer";
import type { ResumeData } from "../../../domain/resume/types";
import {
  getActiveSkillItems,
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from "../../../domain/resume";
import { toDescriptionBullets } from "./utils";

const INK = "#0a0a0a";
const MUTED = "#767676";
const RULE = "#e0e0e0";

const styles = StyleSheet.create({
  root: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingHorizontal: 40,
  },

  header: {
    paddingTop: 0,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: INK,
    marginBottom: 15,
  },
  headerName: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: -0.8,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: MUTED,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 0,
  },
  contactItem: {
    fontSize: 8.5,
    color: MUTED,
  },
  contactSep: {
    fontSize: 8.5,
    color: RULE,
    marginHorizontal: 6,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: RULE,
  },
  sectionGap: {
    marginBottom: 20,
  },

  entryTopBlock: {
    marginBottom: 2,
  },
  entrySpacer: {
    marginBottom: 12,
  },
  entryMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 1,
  },
  entryTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: INK,
    flex: 1,
    paddingRight: 10,
  },
  entryDate: {
    fontSize: 8.5,
    color: MUTED,
  },
  entrySubtitle: {
    fontSize: 9.5,
    color: MUTED,
    marginBottom: 3,
  },

  bodyText: {
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.6,
    textAlign: "justify",
  },

  // Hanging indent bullets
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3,
  },
  bulletDot: {
    width: 12,
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.6,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.6,
    textAlign: "justify",
  },

  inlineText: {
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.6,
  },

  projectLink: {
    fontSize: 8.5,
    color: MUTED,
    marginBottom: 2,
    textDecoration: "none",
  },
});

const SectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const BulletItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.bulletRow} wrap={false}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText} widows={1} orphans={1}>
      {text}
    </Text>
  </View>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <View style={{ marginTop: 3 }}>
    {items.map((item, i) => (
      <BulletItem key={i} text={item} />
    ))}
  </View>
);

export const PDFMonoPDF: React.FC<{ data: ResumeData }> = ({ data }) => {
  const {
    personalInfo,
    summary,
    experience,
    volunteering,
    projects,
    education,
    certifications,
    skills,
    languages,
    achievements,
  } = data;

  const linkItems = getVisiblePersonalLinks(personalInfo);
  const activeSkills = getActiveSkillItems(skills);
  const groupedSkills = skills.groups.filter((g) => g.items.length > 0);
  const shouldRenderGroupedSkills = skills.mode === "grouped" && groupedSkills.length > 0;

  type ContactPart = { label: string; href?: string };
  const contactParts: ContactPart[] = [];
  if (personalInfo.email) contactParts.push({ label: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.phone) contactParts.push({ label: personalInfo.phone, href: `tel:${personalInfo.phone}` });
  if (personalInfo.location) contactParts.push({ label: personalInfo.location });
  linkItems.forEach((link) =>
    contactParts.push({
      label: getPersonalLinkDisplayLabel(link),
      href: toExternalLinkHref(link.url),
    }),
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerName}>{personalInfo.fullName || "Your Name"}</Text>
        {personalInfo.jobTitle ? <Text style={styles.headerTitle}>{personalInfo.jobTitle}</Text> : null}
        {contactParts.length > 0 && (
          <View style={styles.contactRow}>
            {contactParts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={styles.contactSep}>·</Text>}
                {part.href ? (
                  <Link src={part.href} style={styles.contactItem}>
                    {part.label}
                  </Link>
                ) : (
                  <Text style={styles.contactItem}>{part.label}</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {summary ? (
        <>
          <SectionHeading label="Profile" />
          <Text style={styles.bodyText} widows={1} orphans={1}>
            {summary}
          </Text>
          <View style={styles.sectionGap} />
        </>
      ) : null}

      {experience.length > 0 ? (
        <>
          <SectionHeading label="Experience" />
          {experience.map((exp) => {
            const bullets = toDescriptionBullets(exp.description);

            return (
              <React.Fragment key={exp.id}>
                <View wrap={false} style={styles.entryTopBlock}>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryTitle}>{exp.role}</Text>
                    <Text style={styles.entryDate}>
                      {exp.startDate}
                      {exp.endDate ? ` – ${exp.endDate}` : " – Present"}
                    </Text>
                  </View>
                  {exp.company ? <Text style={styles.entrySubtitle}>{exp.company}</Text> : null}
                </View>

                {bullets.length > 0 ? <Bullets items={bullets} /> : null}

                {!bullets.length && exp.description ? (
                  <Text style={styles.bodyText} widows={1} orphans={1}>
                    {exp.description}
                  </Text>
                ) : null}

                <View style={styles.entrySpacer} />
              </React.Fragment>
            );
          })}
          <View style={styles.sectionGap} />
        </>
      ) : null}

      {projects.length > 0 ? (
        <>
          <SectionHeading label="Projects" />
          {projects.map((project) => {
            const bullets = toDescriptionBullets(project.description);

            return (
              <React.Fragment key={project.id}>
                <View wrap={false} style={styles.entryTopBlock}>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryTitle}>{project.name}</Text>
                    {project.startDate || project.endDate ? (
                      <Text style={styles.entryDate}>
                        {project.startDate}
                        {project.endDate ? ` – ${project.endDate}` : ""}
                      </Text>
                    ) : null}
                  </View>

                  {project.link ? (
                    <Link src={toExternalLinkHref(project.link)} style={styles.projectLink}>
                      {project.link}
                    </Link>
                  ) : null}
                </View>

                {bullets.length > 0 ? <Bullets items={bullets} /> : null}

                {!bullets.length && project.description ? (
                  <Text style={styles.bodyText} widows={1} orphans={1}>
                    {project.description}
                  </Text>
                ) : null}

                <View style={styles.entrySpacer} />
              </React.Fragment>
            );
          })}
          <View style={styles.sectionGap} />
        </>
      ) : null}

      {volunteering.length > 0 ? (
        <>
          <SectionHeading label="Volunteering" />
          {volunteering.map((item) => {
            const bullets = toDescriptionBullets(item.description);

            return (
              <React.Fragment key={item.id}>
                <View wrap={false} style={styles.entryTopBlock}>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryTitle}>{item.role}</Text>
                    <Text style={styles.entryDate}>
                      {item.startDate}
                      {item.endDate ? ` – ${item.endDate}` : " – Present"}
                    </Text>
                  </View>
                  {item.company ? <Text style={styles.entrySubtitle}>{item.company}</Text> : null}
                </View>

                {bullets.length > 0 ? <Bullets items={bullets} /> : null}

                {!bullets.length && item.description ? (
                  <Text style={styles.bodyText} widows={1} orphans={1}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.entrySpacer} />
              </React.Fragment>
            );
          })}
          <View style={styles.sectionGap} />
        </>
      ) : null}

      {education.length > 0 ? (
        <>
          <SectionHeading label="Education" />
          {education.map((edu) => (
            <React.Fragment key={edu.id}>
              <View wrap={false} style={styles.entryTopBlock}>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryTitle}>{edu.school}</Text>
                  <Text style={styles.entryDate}>
                    {edu.startDate}
                    {edu.endDate ? ` – ${edu.endDate}` : ""}
                  </Text>
                </View>
                {edu.degree ? <Text style={styles.entrySubtitle}>{edu.degree}</Text> : null}
              </View>

              {edu.description ? (
                <Text style={styles.bodyText} widows={1} orphans={1}>
                  {edu.description}
                </Text>
              ) : null}

              <View style={styles.entrySpacer} />
            </React.Fragment>
          ))}
          <View style={styles.sectionGap} />
        </>
      ) : null}

      {activeSkills.length > 0 ? (
        <>
          <SectionHeading label="Skills" />
          {shouldRenderGroupedSkills ? (
            groupedSkills.map((group) => (
              <Text key={group.id} style={styles.inlineText}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{group.label}: </Text>
                {group.items.join(", ")}
              </Text>
            ))
          ) : (
            <Text style={styles.inlineText}>{activeSkills.join(", ")}</Text>
          )}
          <View style={styles.sectionGap} />
        </>
      ) : null}

      {certifications.length > 0 ? (
        <>
          <SectionHeading label="Certifications" />
          <Bullets items={certifications} />
          <View style={styles.sectionGap} />
        </>
      ) : null}

      {languages.length > 0 ? (
        <>
          <SectionHeading label="Languages" />
          <Text style={styles.inlineText}>{languages.join(", ")}</Text>
          <View style={styles.sectionGap} />
        </>
      ) : null}

      {achievements.length > 0 ? (
        <>
          <SectionHeading label="Achievements" />
          <Bullets items={achievements} />
        </>
      ) : null}
    </View>
  );
};
