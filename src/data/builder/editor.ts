import {
  FiAward,
  FiBook,
  FiBriefcase,
  FiCheck,
  FiCode,
  FiGlobe,
  FiHeart,
  FiList,
  FiUser,
} from 'react-icons/fi';
import type { BuilderEditorSectionTab } from '../../types/builder';

export const BUILDER_EDITOR_SECTION_TABS: BuilderEditorSectionTab[] = [
  { id: 'personal', label: 'Personal', icon: FiUser },
  { id: 'summary', label: 'Summary', icon: FiList },
  { id: 'experience', label: 'Experience', icon: FiBriefcase, countField: 'experience' },
  { id: 'education', label: 'Education', icon: FiBook, countField: 'education' },
  { id: 'volunteering', label: 'Volunteering', icon: FiHeart, countField: 'volunteering' },
  { id: 'projects', label: 'Projects', icon: FiCode, countField: 'projects' },
  { id: 'skills', label: 'Skills', icon: FiList, countField: 'skills' },
  { id: 'languages', label: 'Languages', icon: FiGlobe, countField: 'languages' },
  { id: 'achievements', label: 'Achievements', icon: FiAward, countField: 'achievements' },
  { id: 'certifications', label: 'Certifications', icon: FiCheck, countField: 'certifications' },
];
