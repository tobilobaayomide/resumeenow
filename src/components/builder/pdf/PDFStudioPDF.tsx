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

const ACCENT = "#1a1a2e";
const RED = "#e63946";
const GRAY = "#4b5563";
const LIGHT_GRAY = "#6b7280";

const styles = StyleSheet.create({
  root: { fontFamily: "Helvetica", backgroundColor: "#ffffff" },

  header: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: ACCENT,
    marginTop: -30,
  },
  headerName: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: -0.3,
  },
  headerJobTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: RED,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    marginTop: 5,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 12,
    marginBottom: 10,
  },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  contactItem: { fontSize: 8.5, color: "rgba(255,255,255,0.6)" },

  body: { paddingHorizontal: 32, paddingTop: 18 },
  sectionGap: { marginBottom: 12 },

  sectionHeadingContainer: { marginBottom: 10 },
  sectionHeadingText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  sectionHeadingUnderlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  sectionHeadingUnderlineAccent: { width: 24, height: 2, backgroundColor: RED },
  sectionHeadingUnderlineRest: { flex: 1, height: 1, backgroundColor: "rgba(230,57,70,0.12)" },

  entryTopBlock: { marginBottom: 2 },
  entrySpacer: { marginBottom: 12 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  entryTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    flex: 1,
  },
  dateBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: RED,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(230,57,70,0.07)",
    letterSpacing: 0.3,
  },
  entryCompany: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: LIGHT_GRAY,
    marginTop: 1,
    marginBottom: 1,
  },

  bodyText: {
    fontSize: 9.5,
    color: GRAY,
    lineHeight: 1.6,
    marginTop: 4,
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
    color: RED,
    lineHeight: 1.6,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: GRAY,
    lineHeight: 1.6,
    textAlign: "justify",
  },

  skillPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillPill: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(26,26,46,0.12)",
    backgroundColor: "rgba(26,26,46,0.05)",
  },

  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  listDot: {
    width: 10,
    fontSize: 9.5,
    color: RED,
    lineHeight: 1.6,
  },
  listText: {
    flex: 1,
    fontSize: 9.5,
    color: GRAY,
    lineHeight: 1.6,
    textAlign: "justify",
  },

  projectLink: {
    fontSize: 7.5,
    color: LIGHT_GRAY,
    marginTop: 1,
    marginBottom: 1,
    textDecoration: "none",
  },
});

const SectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.sectionHeadingContainer}>
    <Text style={styles.sectionHeadingText}>{label}</Text>
    <View style={styles.sectionHeadingUnderlineRow}>
      <View style={styles.sectionHeadingUnderlineAccent} />
      <View style={styles.sectionHeadingUnderlineRest} />
    </View>
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
  <View>
    {items.map((item, i) => (
      <BulletItem key={i} text={item} />
    ))}
  </View>
);

const ListItems: React.FC<{ items: string[] }> = ({ items }) => (
  <View>
    {items.map((item, i) => (
      <View key={i} style={styles.listRow} wrap={false}>
        <Text style={styles.listDot}>•</Text>
        <Text style={styles.listText} widows={1} orphans={1}>
          {item}
        </Text>
      </View>
    ))}
  </View>
);

export const PDFStudioPDF: React.FC<{ data: ResumeData }> = ({ data }) => {
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
        {personalInfo.jobTitle ? <Text style={styles.headerJobTitle}>{personalInfo.jobTitle}</Text> : null}
        <View style={styles.headerDivider} />
        {contactParts.length > 0 && (
          <View style={styles.contactRow}>
            {contactParts.map((part, i) =>
              part.href ? (
                <Link key={i} src={part.href} style={styles.contactItem}>
                  {part.label}
                </Link>
              ) : (
                <Text key={i} style={styles.contactItem}>
                  {part.label}
                </Text>
              ),
            )}
          </View>
        )}
      </View>

      <View style={styles.body}>
        {summary ? (
          <>
            <View wrap={false}>
              <SectionHeading label="Profile" />
            </View>
            <Text style={styles.bodyText} widows={1} orphans={1}>
              {summary}
            </Text>
            <View style={styles.sectionGap} />
          </>
        ) : null}

        {experience.length > 0 ? (
          <>
            <View wrap={false}>
              <SectionHeading label="Experience" />
            </View>
            {experience.map((exp) => {
              const bullets = toDescriptionBullets(exp.description);
              const [firstBullet, ...restBullets] = bullets;

              return (
                <React.Fragment key={exp.id}>
                  <View wrap={false} style={styles.entryTopBlock}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryTitle}>{exp.role}</Text>
                      <Text style={styles.dateBadge}>
                        {exp.startDate}
                        {exp.endDate ? ` – ${exp.endDate}` : " – Present"}
                      </Text>
                    </View>
                    {exp.company ? <Text style={styles.entryCompany}>{exp.company}</Text> : null}
                    {firstBullet ? <BulletItem text={firstBullet} /> : null}
                  </View>

                  {restBullets.length > 0 ? <Bullets items={restBullets} /> : null}

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
            <View wrap={false}>
              <SectionHeading label="Projects" />
            </View>
            {projects.map((project) => {
              const bullets = toDescriptionBullets(project.description);
              const [firstBullet, ...restBullets] = bullets;

              return (
                <React.Fragment key={project.id}>
                  <View wrap={false} style={styles.entryTopBlock}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryTitle}>{project.name}</Text>
                      {project.startDate || project.endDate ? (
                        <Text style={styles.dateBadge}>
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

                    {firstBullet ? <BulletItem text={firstBullet} /> : null}
                  </View>

                  {restBullets.length > 0 ? <Bullets items={restBullets} /> : null}

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
            <View wrap={false}>
              <SectionHeading label="Volunteering" />
            </View>
            {volunteering.map((item) => {
              const bullets = toDescriptionBullets(item.description);
              const [firstBullet, ...restBullets] = bullets;

              return (
                <React.Fragment key={item.id}>
                  <View wrap={false} style={styles.entryTopBlock}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryTitle}>{item.role}</Text>
                      <Text style={styles.dateBadge}>
                        {item.startDate}
                        {item.endDate ? ` – ${item.endDate}` : " – Present"}
                      </Text>
                    </View>
                    {item.company ? <Text style={styles.entryCompany}>{item.company}</Text> : null}
                    {firstBullet ? <BulletItem text={firstBullet} /> : null}
                  </View>

                  {restBullets.length > 0 ? <Bullets items={restBullets} /> : null}

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
            <View wrap={false}>
              <SectionHeading label="Education" />
            </View>
            {education.map((edu) => (
              <React.Fragment key={edu.id}>
                <View wrap={false} style={styles.entryTopBlock}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{edu.school}</Text>
                    {edu.startDate || edu.endDate ? (
                      <Text style={styles.dateBadge}>
                        {edu.startDate}
                        {edu.endDate ? ` – ${edu.endDate}` : ""}
                      </Text>
                    ) : null}
                  </View>
                  {edu.degree ? <Text style={styles.entryCompany}>{edu.degree}</Text> : null}
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
            <View wrap={false}>
              <SectionHeading label="Skills" />
            </View>

            {shouldRenderGroupedSkills ? (
              groupedSkills.map((group) => (
                <Text key={group.id} style={styles.bodyText} widows={1} orphans={1}>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: ACCENT }}>{group.label}: </Text>
                  {group.items.join(", ")}
                </Text>
              ))
            ) : (
              <View style={styles.skillPillsRow}>
                {activeSkills.map((skill, i) => (
                  <Text key={i} style={styles.skillPill}>
                    {skill}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.sectionGap} />
          </>
        ) : null}

        {certifications.length > 0 ? (
          <>
            <View wrap={false}>
              <SectionHeading label="Certifications" />
            </View>
            <ListItems items={certifications} />
            <View style={styles.sectionGap} />
          </>
        ) : null}

        {languages.length > 0 ? (
          <>
            <View wrap={false}>
              <SectionHeading label="Languages" />
            </View>
            <View style={styles.skillPillsRow}>
              {languages.map((lang, i) => (
                <Text key={i} style={styles.skillPill}>
                  {lang}
                </Text>
              ))}
            </View>
            <View style={styles.sectionGap} />
          </>
        ) : null}

        {achievements.length > 0 ? (
          <>
            <View wrap={false}>
              <SectionHeading label="Achievements" />
            </View>
            <ListItems items={achievements} />
          </>
        ) : null}
      </View>
    </View>
  );
};
