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

const INK = "#0f1117";
const BODY = "#2d2f36";
const DIM = "#6b7280";
const PROMPT = "#16a34a";
const BORDER = "#e2e4e9";
const BG_PILL = "#f0fdf4";

const styles = StyleSheet.create({
  root: { fontFamily: "Courier", backgroundColor: "#ffffff" },

  header: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: INK,
    borderLeftWidth: 4,
    borderLeftColor: PROMPT,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
 
  headerName: {
    fontSize: 26,
    fontFamily: "Courier-Bold",
    color: INK,
    letterSpacing: -0.3,
  },
  headerJobTitle: {
    fontSize: 9.5,
    color: DIM,
    marginTop: 3,
    marginLeft: 0,
    fontFamily: "Courier",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  contactItem: { fontSize: 8.5, color: DIM, fontFamily: "Courier" },

  body: { paddingHorizontal: 32, paddingTop: 14 },
  section: { marginBottom: 14 },

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionHash: {
    fontSize: 9,
    fontFamily: "Courier-Bold",
    color: PROMPT,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Courier-Bold",
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: BORDER },

  entryBlock: { marginBottom: 10, paddingLeft: 12 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  entryTitleLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
    flexWrap: "wrap",
    gap: 4,
  },
  entryRole: { fontSize: 10.5, fontFamily: "Courier-Bold", color: INK },
  entryAt: { fontSize: 9.5, fontFamily: "Courier-Bold", color: PROMPT },
  entryCompany: { fontSize: 9.5, color: DIM, fontFamily: "Courier" },
  entryDate: { fontSize: 8.5, color: DIM, fontFamily: "Courier" },

  bodyText: {
    fontSize: 9.5,
    color: BODY,
    lineHeight: 1.6,
    marginTop: 4,
    fontFamily: "Courier",
    textAlign: "justify",
  },
  summaryBlock: {
    fontSize: 9.5,
    color: BODY,
    lineHeight: 1.65,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: PROMPT,
    textAlign: "justify",
    fontFamily: "Courier",
  },
  bullet: { flexDirection: "row", marginTop: 2 },
  bulletDot: { fontSize: 9.5, color: PROMPT, marginRight: 6, fontFamily: "Courier" },
  bulletText: {
    fontSize: 9.5,
    color: BODY,
    lineHeight: 1.6,
    flex: 1,
    fontFamily: "Courier",
    textAlign: "justify",
  },

  skillPillsRow: { flexDirection: "row", flexWrap: "wrap", paddingLeft: 12, gap: 4 },
  skillPill: {
    fontSize: 8.5,
    color: PROMPT,
    borderWidth: 1,
    borderColor: PROMPT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: BG_PILL,
    fontFamily: "Courier",
  },
  skillGroupText: {
    fontSize: 9.5,
    color: BODY,
    lineHeight: 1.6,
    paddingLeft: 12,
    fontFamily: "Courier",
  },

  listItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 12,
    marginBottom: 3,
  },
  listItemArrow: { fontSize: 9.5, color: PROMPT, marginRight: 6, fontFamily: "Courier" },
  listItemText: { fontSize: 9.5, color: BODY, flex: 1, fontFamily: "Courier", lineHeight: 1.6 },
});


const SectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.sectionHeadingRow}>
    <Text style={styles.sectionHash}>#</Text>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.sectionRule} />
  </View>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <View style={{ marginTop: 3 }}>
    {items.map((item, i) => (
      <View key={i} style={styles.bullet}>
        <Text style={styles.bulletDot}>›</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);


export const PDFSiliconPDF: React.FC<{ data: ResumeData }> = ({ data }) => {
  const {
    personalInfo, summary, experience, volunteering, projects,
    education, certifications, skills, languages, achievements,
  } = data;

  const linkItems = getVisiblePersonalLinks(personalInfo);
  const activeSkills = getActiveSkillItems(skills);
  const groupedSkills = skills.groups.filter((g) => g.items.length > 0);
  const shouldRenderGroupedSkills = skills.mode === "grouped" && groupedSkills.length > 0;

  const contactParts: Array<{ label: string; href?: string }> = [];
  if (personalInfo.email)
    contactParts.push({ label: `@ ${personalInfo.email}`, href: `mailto:${personalInfo.email}` });
  if (personalInfo.phone)
    contactParts.push({ label: `$ ${personalInfo.phone}`, href: `tel:${personalInfo.phone}` });
  if (personalInfo.location)
    contactParts.push({ label: `~ ${personalInfo.location}` });
  linkItems.forEach((link) =>
    contactParts.push({ label: `> ${getPersonalLinkDisplayLabel(link)}`, href: toExternalLinkHref(link.url) })
  );

  return (
    <View style={styles.root}>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerName}>{personalInfo.fullName || "Your Name"}</Text>
        </View>
        {personalInfo.jobTitle ? (
          <Text style={styles.headerJobTitle}>// {personalInfo.jobTitle}</Text>
        ) : null}
        {contactParts.length > 0 && (
          <View style={styles.contactRow}>
            {contactParts.map((part, i) =>
              part.href ? (
                <Link key={i} src={part.href} style={styles.contactItem}>{part.label}</Link>
              ) : (
                <Text key={i} style={styles.contactItem}>{part.label}</Text>
              )
            )}
          </View>
        )}
      </View>

      <View style={styles.body}>

        {summary ? (
          <View style={styles.section}>
            <SectionHeading label="About" />
            <Text style={styles.summaryBlock}>{summary}</Text>
          </View>
        ) : null}

        {activeSkills.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading label="Stack" />
            {shouldRenderGroupedSkills ? (
              groupedSkills.map((group) => (
                <Text key={group.id} style={styles.skillGroupText}>
                  <Text style={{ fontFamily: "Courier-Bold", color: INK }}>{group.label}: </Text>
                  {group.items.join(", ")}
                </Text>
              ))
            ) : (
              <View style={styles.skillPillsRow}>
                {activeSkills.map((skill, i) => (
                  <Text key={i} style={styles.skillPill}>{skill}</Text>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading label="Experience" />
            {experience.map((exp) => {
              const bullets = toDescriptionBullets(exp.description);
              return (
                <View key={exp.id} style={styles.entryBlock}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleLeft}>
                      <Text style={styles.entryRole}>{exp.role}</Text>
                      {exp.company ? (
                        <>
                          <Text style={styles.entryAt}>@</Text>
                          <Text style={styles.entryCompany}>{exp.company}</Text>
                        </>
                      ) : null}
                    </View>
                    <Text style={styles.entryDate}>
                      [{exp.startDate}{exp.endDate ? ` → ${exp.endDate}` : " → now"}]
                    </Text>
                  </View>
                  {bullets.length > 0 ? (
                    <Bullets items={bullets} />
                  ) : exp.description ? (
                    <Text style={styles.bodyText}>{exp.description}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading label="Projects" />
            {projects.map((project) => {
              const bullets = toDescriptionBullets(project.description);
              return (
                <View key={project.id} style={styles.entryBlock}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryRole}>{project.name}</Text>
                    {project.startDate || project.endDate ? (
                      <Text style={styles.entryDate}>
                        [{project.startDate}{project.endDate ? ` → ${project.endDate}` : ""}]
                      </Text>
                    ) : null}
                  </View>
                  {project.link ? (
                    <Link
                      src={toExternalLinkHref(project.link)}
                      style={{ fontSize: 7.5, color: PROMPT, marginTop: 1, fontFamily: "Courier" }}
                    >
                      {project.link}
                    </Link>
                  ) : null}
                  {bullets.length > 0 ? (
                    <Bullets items={bullets} />
                  ) : project.description ? (
                    <Text style={styles.bodyText}>{project.description}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {volunteering.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading label="Volunteering" />
            {volunteering.map((item) => {
              const bullets = toDescriptionBullets(item.description);
              return (
                <View key={item.id} style={styles.entryBlock}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleLeft}>
                      <Text style={styles.entryRole}>{item.role}</Text>
                      {item.company ? (
                        <>
                          <Text style={styles.entryAt}>@</Text>
                          <Text style={styles.entryCompany}>{item.company}</Text>
                        </>
                      ) : null}
                    </View>
                    <Text style={styles.entryDate}>
                      [{item.startDate}{item.endDate ? ` → ${item.endDate}` : " → now"}]
                    </Text>
                  </View>
                  {bullets.length > 0 ? (
                    <Bullets items={bullets} />
                  ) : item.description ? (
                    <Text style={styles.bodyText}>{item.description}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {education.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading label="Education" />
            {education.map((edu) => (
              <View key={edu.id} style={styles.entryBlock}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryTitleLeft}>
                    <Text style={styles.entryRole}>{edu.school}</Text>
                    {edu.degree ? (
                      <Text style={{ fontSize: 8.5, color: DIM, fontFamily: "Courier" }}>
                        — {edu.degree}
                      </Text>
                    ) : null}
                  </View>
                  {edu.startDate || edu.endDate ? (
                    <Text style={styles.entryDate}>
                      [{edu.startDate}{edu.endDate ? ` → ${edu.endDate}` : ""}]
                    </Text>
                  ) : null}
                </View>
                {edu.description ? (
                  <Text style={styles.bodyText}>{edu.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading label="Certifications" />
            {certifications.map((cert, i) => (
              <View key={i} style={styles.listItemRow}>
                <Text style={styles.listItemArrow}>›</Text>
                <Text style={styles.listItemText}>{cert}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {languages.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading label="Languages" />
            <View style={styles.skillPillsRow}>
              {languages.map((lang, i) => (
                <Text key={i} style={{ ...styles.skillPill, color: DIM, borderColor: BORDER, backgroundColor: "#f9fafb" }}>
                  {lang}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {achievements.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading label="Achievements" />
            {achievements.map((ach, i) => (
              <View key={i} style={styles.listItemRow}>
                <Text style={styles.listItemArrow}>›</Text>
                <Text style={styles.listItemText}>{ach}</Text>
              </View>
            ))}
          </View>
        ) : null}

      </View>
    </View>
  );
};