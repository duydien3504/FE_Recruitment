/**
 * CV Builder — Shared Type Definitions
 * Mirrors the backend API response shapes for strong typing on FE.
 */

// ---------------------------------------------------------------
// Template
// ---------------------------------------------------------------
export type TemplateCategory =
  | 'IT'
  | 'Marketing'
  | 'Business'
  | 'Finance'
  | 'Design'
  | 'Education'
  | 'Healthcare'
  | 'General';

export interface TemplateDefaultConfig {
  primaryColor: string;
  fontFamily: string;
  layoutMode?: string;
  [key: string]: any;
}

/** Shape returned by GET /api/v1/cv-builder/templates */
export interface CvTemplate {
  id: string;
  name: string;
  category: TemplateCategory | string;
  thumbnailUrl: string;
  defaultConfig: TemplateDefaultConfig;
  isActive: boolean;
  description?: string;
  tags?: string[];
}

export interface GetTemplatesResponse {
  success: boolean;
  data: CvTemplate[];
}
