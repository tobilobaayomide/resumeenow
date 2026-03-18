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

const INK = "#111111";
const MUTED = "#6b6b68";
const RULE = "#d8d6d3";
const SECTION_ACCENT = "#1f3a5f";

const styles = StyleSheet.create({
  root: {
    fontFamily: "Helvetica",
    color: INK,
    paddingLeft: 30,
    paddingRight: 30,
  },

  name: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: -0.5,
  },
  nameJobTitle: {
    fontSize: 26,
    fontFamily: "Helvetica",
    color: MUTED,
    letterSpacing: -0.3,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  contactText: {
    fontSize: 8.5,
    color: MUTED,
  },
  contactSep: {
    fontSize: 8.5,
    color: RULE,
    marginHorizontal: 3,
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: INK,
    marginTop: 8,
  },

  section: {
    marginTop: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  sectionTitleBar: {
    width: 3,
    height: 13,
    backgroundColor: SECTION_ACCENT,
    borderRadius: 2,
  },
  sectionTitleText: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: SECTION_ACCENT,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  body: {
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.6,
    textAlign: "justify",
  },

  entryRow: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  entryTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  entryDate: {
    fontSize: 8.5,
    color: MUTED,
    fontFamily: "Helvetica",
  },
  entrySubtitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: SECTION_ACCENT,
    marginTop: 2,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3,
  },
  bulletDot: {
    width: 10,
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
});


const SectionTitle: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.sectionTitleRow}>
    <View style={styles.sectionTitleBar} />
    <Text style={styles.sectionTitleText}>{label}</Text>
  </View>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <View style={{ marginTop: 3 }}>
    {items.map((item, i) => (
      <View key={i} style={styles.bulletRow} wrap={false}>
        <Text style={styles.bulletDot}>•</Text>
        <Text style={styles.bulletText} widows={1} orphans={1}>
          {item}
        </Text>
      </View>
    ))}
  </View>
);


export const PDFAtsPDF: React.FC<{ data: ResumeData }> = ({ data }) => {
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

  const visibleLinks = getVisiblePersonalLinks(personalInfo);
  const activeSkills = getActiveSkillItems(skills);
  const groupedSkills = skills.groups.filter((g) => g.items.length > 0);
  const shouldRenderGroupedSkills =
    skills.mode === "grouped" && groupedSkills.length > 0;

  type ContactPart = { label: string; href?: string };
  const contactParts: ContactPart[] = [];
  if (personalInfo.email)
    contactParts.push({ label: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.phone)
    contactParts.push({ label: personalInfo.phone, href: `tel:${personalInfo.phone}` });
  if (personalInfo.location)
    contactParts.push({ label: personalInfo.location });
  visibleLinks.forEach((link) =>
    contactParts.push({
      label: getPersonalLinkDisplayLabel(link),
      href: toExternalLinkHref(link.url),
    })
  );

  return (
    <View style={styles.root}>
      <View>
        <Text style={styles.name}>
          {personalInfo.fullName || "Your Name"}
          {personalInfo.jobTitle ? (
            <Text style={styles.nameJobTitle}>, {personalInfo.jobTitle}</Text>
          ) : null}
        </Text>

        {contactParts.length > 0 && (
          <View style={styles.contactRow}>
            {contactParts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={styles.contactSep}> · </Text>}
                {part.href ? (
                  <Link src={part.href} style={styles.contactText}>
                    {part.label}
                  </Link>
                ) : (
                  <Text style={styles.contactText}>{part.label}</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={styles.divider} />
      </View>

      {summary ? (
        <View style={styles.section}>
          <SectionTitle label="Summary" />
          <Text style={styles.body}>{summary}</Text>
        </View>
      ) : null}

      {activeSkills.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle label="Technical Skills" />
          {shouldRenderGroupedSkills ? (
            groupedSkills.map((group) => (
              <Text key={group.id} style={styles.body}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  {group.label || "Skills"}:{" "}
                </Text>
                {group.items.join(", ")}
              </Text>
            ))
          ) : (
            <Text style={styles.body}>{activeSkills.join(", ")}</Text>
          )}
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle label="Professional Experience" />
          {experience.map((exp) => {
            const bullets = toDescriptionBullets(exp.description);
            return (
              <View key={exp.id} style={styles.entryRow}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{exp.role}</Text>
                  <Text style={styles.entryDate}>
                    {exp.startDate}
                    {exp.endDate ? ` – ${exp.endDate}` : ""}
                  </Text>
                </View>
                {exp.company ? (
                  <Text style={styles.entrySubtitle}>{exp.company}</Text>
                ) : null}
                {bullets.length > 0 ? (
                  <Bullets items={bullets} />
                ) : exp.description ? (
                  <Text style={{ ...styles.body, marginTop: 3 }}>
                    {exp.description}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {projects.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle label="Projects" />
          {projects.map((project) => {
            const bullets = toDescriptionBullets(project.description);
            return (
              <View key={project.id} style={styles.entryRow}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{project.name}</Text>
                  {project.startDate || project.endDate ? (
                    <Text style={styles.entryDate}>
                      {project.startDate}
                      {project.endDate ? ` – ${project.endDate}` : ""}
                    </Text>
                  ) : null}
                </View>
                {project.link ? (
                  <Link
                    src={toExternalLinkHref(project.link)}
                    style={{ fontSize: 8.5, color: MUTED }}
                  >
                    {project.link}
                  </Link>
                ) : null}
                {bullets.length > 0 ? (
                  <Bullets items={bullets} />
                ) : project.description ? (
                  <Text style={{ ...styles.body, marginTop: 3 }}>
                    {project.description}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {/* ── Volunteering ─────────────────────────────────────── */}
      {volunteering.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle label="Volunteering" />
          {volunteering.map((item) => {
            const bullets = toDescriptionBullets(item.description);
            return (
              <View key={item.id} style={styles.entryRow}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{item.role}</Text>
                  <Text style={styles.entryDate}>
                    {item.startDate}
                    {item.endDate ? ` – ${item.endDate}` : ""}
                  </Text>
                </View>
                {item.company ? (
                  <Text style={styles.entrySubtitle}>{item.company}</Text>
                ) : null}
                {bullets.length > 0 ? (
                  <Bullets items={bullets} />
                ) : item.description ? (
                  <Text style={{ ...styles.body, marginTop: 3 }}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle label="Education" />
          {education.map((edu) => (
            <View key={edu.id} style={styles.entryRow}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{edu.degree}</Text>
                <Text style={styles.entryDate}>
                  {edu.startDate}
                  {edu.endDate ? ` – ${edu.endDate}` : ""}
                </Text>
              </View>
              <Text style={styles.entrySubtitle}>{edu.school}</Text>
              {edu.description ? (
                <Text style={{ ...styles.body, marginTop: 3 }}>
                  {edu.description}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {certifications.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle label="Certifications" />
          <Bullets items={certifications} />
        </View>
      ) : null}

      {languages.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle label="Languages" />
          <Text style={styles.body}>{languages.join(", ")}</Text>
        </View>
      ) : null}

      {achievements.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle label="Achievements" />
          <Bullets items={achievements} />
        </View>
      ) : null}
    </View>
  );
};
