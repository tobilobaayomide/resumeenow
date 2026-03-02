import {
  TEMPLATE_GALLERY_ITEMS,
  isRenderableTemplate,
  type TemplateGalleryItem,
  type TemplateId,
} from "../../../domain/templates";
import type { TemplateDefinition } from "../../../types/builder";

export type { TemplateId };

const isAvailableTemplate = (
  template: TemplateGalleryItem,
): template is TemplateGalleryItem & { id: TemplateId; available: true } =>
  template.available && isRenderableTemplate(template.id);

export const TEMPLATES: TemplateDefinition[] = TEMPLATE_GALLERY_ITEMS
  .filter(isAvailableTemplate)
  .map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    color: template.color,
    popular: template.popular,
  }));
