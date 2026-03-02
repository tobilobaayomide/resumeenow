import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  TEMPLATE_GALLERY_ITEMS,
  isRenderableTemplate,
  type TemplateCategoryFilter,
  type TemplateGalleryItem,
} from '../../domain/templates';
import type { UseTemplatesControllerResult } from '../../types/dashboard';

export const useTemplatesController = (): UseTemplatesControllerResult => {
  const [activeWaitlist, setActiveWaitlist] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('resumeenow:templateWaitlist') === '1';
  });
  const [selectedCategory, setSelectedCategory] =
    useState<TemplateCategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplateGalleryItem | null>(null);
  const navigate = useNavigate();

  const filteredTemplates = useMemo(() => {
    const categoryFilteredTemplates =
      selectedCategory === 'All'
        ? TEMPLATE_GALLERY_ITEMS
        : TEMPLATE_GALLERY_ITEMS.filter(
            (template) => template.category === selectedCategory,
          );

    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return categoryFilteredTemplates;

    return categoryFilteredTemplates.filter((template) => {
      return (
        template.name.toLowerCase().includes(needle) ||
        template.category.toLowerCase().includes(needle) ||
        template.description.toLowerCase().includes(needle)
      );
    });
  }, [searchQuery, selectedCategory]);

  const showComingSoonCard =
    selectedCategory === 'All' && searchQuery.trim().length === 0;

  const useTemplate = (template: TemplateGalleryItem): boolean => {
    if (!template.available || !isRenderableTemplate(template.id)) {
      toast.info(`${template.name} is coming soon.`);
      return false;
    }

    navigate(`/builder/new?template=${template.id}`);
    return true;
  };

  return {
    activeWaitlist,
    selectedCategory,
    searchQuery,
    previewTemplate,
    filteredTemplates,
    showComingSoonCard,
    setSelectedCategory,
    setSearchQuery,
    openTemplatePreview: setPreviewTemplate,
    closeTemplatePreview: () => setPreviewTemplate(null),
    clearFilters: () => {
      setSearchQuery('');
      setSelectedCategory('All');
    },
    joinWaitlist: () => {
      setActiveWaitlist(true);
      try {
        localStorage.setItem('resumeenow:templateWaitlist', '1');
      } catch {
        // Ignore storage failures.
      }
    },
    useTemplate,
  };
};
