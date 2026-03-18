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

const NAVY = "#0F172A";
const GOLD = "#A87C3E";
const MUTED = "#64748B";
const TEXT = "#334155";
const SIDEBAR_BG = "#F8FAFC";
const RULE = "#E2E8F0";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  root: {
    fontFamily: "Helvetica",
    backgroundColor: WHITE,
    flexDirection: "column",
  },

  header: {
    paddingHorizontal: 40,
    paddingBottom: 10,
    alignItems: "center",
  },
  headerName: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginTop: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  contactItem: {
    fontSize: 8.5,
    color: MUTED,
    fontFamily: "Helvetica",
  },
  contactLink: {
    fontSize: 8.5,
    color: MUTED,
    fontFamily: "Helvetica",
    textDecoration: "none",
  },
  contactSeparator: {
    fontSize: 8.5,
    color: RULE,
    fontFamily: "Helvetica",
    marginHorizontal: 2,
  },
  headerRule: {
    height: 1.5,
    backgroundColor: GOLD,
    marginHorizontal: 30,
  },

  body: {
    flexDirection: "row",
  },

  mainCol: {
    width: "68%",
    paddingLeft: 30,
    paddingRight: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  mainColFull: {
    width: "100%",
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 40,
  },

  sidebarCol: {
    width: "32%",
    backgroundColor: SIDEBAR_BG,
    paddingLeft: 10,
    paddingRight: 30,
    paddingTop: 15,
    paddingBottom: 15,
    borderLeftWidth: 1,
    borderLeftColor: RULE,
  },

  section: {
    marginBottom: 24,
  },
  sectionGap: {
    marginBottom: 8,
  },
  sectionHead: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionRuleWrapper: {
    height: 1,
    backgroundColor: RULE,
    flexDirection: "row",
  },
  sectionRuleHighlight: {
    width: 32,
    height: 2,
    backgroundColor: GOLD,
    marginTop: -0.5,
  },

  sidebarSection: {
    marginBottom: 20,
  },
  sidebarSectionLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  entryBlock: {
    marginBottom: 16,
  },
  entryTopBlock: {
    marginBottom: 2,
  },
  entrySpacer: {
    marginBottom: 16,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    flex: 1,
    paddingRight: 10,
  },
  entryDate: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
  },
  entryCompany: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    marginBottom: 4,
  },

  bodyText: {
    fontSize: 9.5,
    color: TEXT,
    lineHeight: 1.6,
    textAlign: "justify",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3,
  },
  bulletDot: {
    width: 10,
    fontSize: 9.5,
    color: GOLD,
    lineHeight: 1.6,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: TEXT,
    lineHeight: 1.6,
    textAlign: "justify",
  },

  sidebarEntryBlock: {
    marginBottom: 12,
  },
  sidebarEntryTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    lineHeight: 1.3,
  },
  sidebarEntrySubtitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    marginTop: 2,
    lineHeight: 1.3,
  },
  sidebarDate: {
    fontSize: 8.5,
    color: MUTED,
    marginTop: 2,
  },
  sidebarDesc: {
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.5,
    marginTop: 3,
  },

  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillPill: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    backgroundColor: RULE,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  groupedSkillLine: {
    marginBottom: 4,
  },
  groupedSkillLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  groupedSkillValue: {
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.5,
  },

  sidebarListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  sidebarListDot: {
    width: 9,
    fontSize: 9,
    color: GOLD,
    lineHeight: 1.5,
  },
  sidebarListText: {
    flex: 1,
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.5,
  },

  projectLink: {
    fontSize: 8.5,
    color: GOLD,
    marginBottom: 3,
    textDecoration: "none",
  },
});


const SectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.sectionHead}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.sectionRuleWrapper}>
      <View style={styles.sectionRuleHighlight} />
    </View>
  </View>
);

const SidebarSectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.sectionHead}>
    <Text style={styles.sidebarSectionLabel}>{label}</Text>
    <View style={styles.sectionRuleWrapper}>
      <View style={styles.sectionRuleHighlight} />
    </View>
  </View>
);

const BulletLine: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.bulletRow} wrap={false}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText} widows={1} orphans={1}>
      {text}
    </Text>
  </View>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <>
    {items.map((item, i) => (
      <BulletLine key={i} text={item} />
    ))}
  </>
);

const SidebarListItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.sidebarListItem} wrap={false}>
    <Text style={styles.sidebarListDot}>•</Text>
    <Text style={styles.sidebarListText} widows={1} orphans={1}>
      {text}
    </Text>
  </View>
);


export const PDFExecutivePDF: React.FC<{ data: ResumeData }> = ({ data }) => {
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

  const hasSidebarContent =
    education.length > 0 ||
    activeSkills.length > 0 ||
    certifications.length > 0 ||
    languages.length > 0 ||
    achievements.length > 0;

  type ContactPart = { label: string; href?: string };
  const contactParts: ContactPart[] = [];
  if (personalInfo.email) {
    contactParts.push({
      label: personalInfo.email,
      href: `mailto:${personalInfo.email}`,
    });
  }
  if (personalInfo.phone) {
    contactParts.push({
      label: personalInfo.phone,
      href: `tel:${personalInfo.phone}`,
    });
  }
  if (personalInfo.location) {
    contactParts.push({ label: personalInfo.location });
  }
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
                {part.href ? (
                  <Link src={part.href} style={styles.contactLink}>
                    {part.label}
                  </Link>
                ) : (
                  <Text style={styles.contactItem}>{part.label}</Text>
                )}
                {i < contactParts.length - 1 && <Text style={styles.contactSeparator}>•</Text>}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
      <View style={styles.headerRule} />

      <View style={styles.body}>
        <View style={hasSidebarContent ? styles.mainCol : styles.mainColFull}>
          {summary ? (
            <>
              <SectionHeading label="Summary" />
              <Text style={{ ...styles.bodyText, marginBottom: 24 }}>{summary}</Text>
            </>
          ) : null}

          {experience.length > 0 ? (
            <>
              <SectionHeading label="Experience" />
              {experience.map((exp) => {
                const bullets = toDescriptionBullets(exp.description);
                const [firstBullet, ...restBullets] = bullets;

                return (
                  <React.Fragment key={exp.id}>
                    <View wrap={false} style={styles.entryTopBlock}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryTitle}>{exp.role}</Text>
                        <Text style={styles.entryDate}>
                          {exp.startDate}
                          {exp.endDate ? ` – ${exp.endDate}` : " – Present"}
                        </Text>
                      </View>

                      {exp.company ? <Text style={styles.entryCompany}>{exp.company}</Text> : null}

                      {firstBullet ? <BulletLine text={firstBullet} /> : null}
                    </View>

                    {restBullets.map((item, i) => (
                      <BulletLine key={`${exp.id}-b-${i}`} text={item} />
                    ))}

                    {!bullets.length && exp.description ? (
                      <Text style={{ ...styles.bodyText, marginTop: 3 }} widows={1} orphans={1}>
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
                  <View key={project.id} style={styles.entryBlock}>
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
                      <Link src={toExternalLinkHref(project.link)} style={styles.projectLink}>
                        {project.link}
                      </Link>
                    ) : null}
                    {bullets.length > 0 ? (
                      <Bullets items={bullets} />
                    ) : project.description ? (
                      <Text style={{ ...styles.bodyText, marginTop: 3 }}>{project.description}</Text>
                    ) : null}
                  </View>
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
                  <View key={item.id} style={styles.entryBlock}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryTitle}>{item.role}</Text>
                      <Text style={styles.entryDate}>
                        {item.startDate}
                        {item.endDate ? ` – ${item.endDate}` : " – Present"}
                      </Text>
                    </View>
                    {item.company ? <Text style={styles.entryCompany}>{item.company}</Text> : null}
                    {bullets.length > 0 ? (
                      <Bullets items={bullets} />
                    ) : item.description ? (
                      <Text style={{ ...styles.bodyText, marginTop: 3 }}>{item.description}</Text>
                    ) : null}
                  </View>
                );
              })}
              <View style={styles.sectionGap} />
            </>
          ) : null}

          {!hasSidebarContent && education.length > 0 ? (
            <>
              <SectionHeading label="Education" />
              {education.map((edu) => (
                <View key={edu.id} style={styles.entryBlock}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{edu.school}</Text>
                    {edu.startDate || edu.endDate ? (
                      <Text style={styles.entryDate}>
                        {edu.startDate}
                        {edu.endDate ? ` – ${edu.endDate}` : ""}
                      </Text>
                    ) : null}
                  </View>
                  {edu.degree ? <Text style={styles.entryCompany}>{edu.degree}</Text> : null}
                  {edu.description ? <Text style={{ ...styles.bodyText, marginTop: 2 }}>{edu.description}</Text> : null}
                </View>
              ))}
            </>
          ) : null}
        </View>

        {hasSidebarContent ? (
          <View style={styles.sidebarCol}>
            {education.length > 0 ? (
              <View style={styles.sidebarSection}>
                <SidebarSectionHeading label="Education" />
                {education.map((edu) => (
                  <View key={edu.id} style={styles.sidebarEntryBlock}>
                    <Text style={styles.sidebarEntryTitle}>{edu.school}</Text>
                    {edu.degree ? <Text style={styles.sidebarEntrySubtitle}>{edu.degree}</Text> : null}
                    {edu.startDate || edu.endDate ? (
                      <Text style={styles.sidebarDate}>
                        {edu.startDate}
                        {edu.endDate ? ` – ${edu.endDate}` : ""}
                      </Text>
                    ) : null}
                    {edu.description ? <Text style={styles.sidebarDesc}>{edu.description}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {activeSkills.length > 0 ? (
              <View style={styles.sidebarSection}>
                <SidebarSectionHeading label="Skills" />
                {shouldRenderGroupedSkills ? (
                  groupedSkills.map((group) => (
                    <View key={group.id} style={styles.groupedSkillLine}>
                      <Text>
                        <Text style={styles.groupedSkillLabel}>{group.label}: </Text>
                        <Text style={styles.groupedSkillValue}>{group.items.join(", ")}</Text>
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.skillsRow}>
                    {activeSkills.map((skill, i) => (
                      <Text key={i} style={styles.skillPill}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {certifications.length > 0 ? (
              <View style={styles.sidebarSection}>
                <SidebarSectionHeading label="Certifications" />
                {certifications.map((cert, i) => (
                  <SidebarListItem key={i} text={cert} />
                ))}
              </View>
            ) : null}

            {languages.length > 0 ? (
              <View style={styles.sidebarSection}>
                <SidebarSectionHeading label="Languages" />
                {languages.map((lang, i) => (
                  <SidebarListItem key={i} text={lang} />
                ))}
              </View>
            ) : null}

            {achievements.length > 0 ? (
              <View style={styles.sidebarSection}>
                <SidebarSectionHeading label="Achievements" />
                {achievements.map((ach, i) => (
                  <SidebarListItem key={i} text={ach} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
};
