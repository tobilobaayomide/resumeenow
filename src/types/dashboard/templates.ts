import type {
  TemplateCategoryFilter,
  TemplateGalleryItem,
} from '../../domain/templates';

export interface TemplatesHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export interface TemplatesCategoryFiltersProps {
  selectedCategory: TemplateCategoryFilter;
  onSelectCategory: (category: TemplateCategoryFilter) => void;
}

export interface TemplateCardPreviewProps {
  template: TemplateGalleryItem;
}

export interface TemplatesGalleryProps {
  templates: TemplateGalleryItem[];
  showComingSoonCard: boolean;
  activeWaitlist: boolean;
  onOpenTemplatePreview: (template: TemplateGalleryItem) => void;
  onJoinWaitlist: () => void;
  onClearFilters: () => void;
}

export interface TemplatesPreviewModalProps {
  previewTemplate: TemplateGalleryItem | null;
  onClose: () => void;
  onUseTemplate: (template: TemplateGalleryItem) => void;
}

export interface UseTemplatesControllerResult {
  activeWaitlist: boolean;
  selectedCategory: TemplateCategoryFilter;
  searchQuery: string;
  previewTemplate: TemplateGalleryItem | null;
  filteredTemplates: TemplateGalleryItem[];
  showComingSoonCard: boolean;
  setSelectedCategory: (category: TemplateCategoryFilter) => void;
  setSearchQuery: (value: string) => void;
  openTemplatePreview: (template: TemplateGalleryItem) => void;
  closeTemplatePreview: () => void;
  clearFilters: () => void;
  joinWaitlist: () => void;
  useTemplate: (template: TemplateGalleryItem) => boolean;
}
