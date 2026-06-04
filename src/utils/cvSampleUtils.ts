import type { ColumnLayout, CvData, CustomSection, ThemeConfig } from '../store/cvStore';

export interface SampleTheme {
  primaryColor: string;
  secondaryColor?: string;
  fontFamily: string;
  layoutMode?: string;
  textColor?: string;
  bodyTextColor?: string;
}

export interface SampleCvData {
  personal?: {
    fullName?: string;
    title?: string;
    jobTitle?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    avatarUrl?: string;
  };
  about?: string;
  experience?: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    location?: string;
    description?: string;
  }>;
  education?: Array<{
    school?: string;
    degree?: string;
    major?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }>;
  skills?: { displayStyle?: string; items?: Array<{ name: string; level?: number }> } | string | string[];
  projects?: Array<{ name?: string; description?: string; techStack?: string[]; url?: string }>;
  contact?: { email?: string; phone?: string; website?: string; github?: string; linkedIn?: string };
  customSections?: CustomSection[];
}

export interface SampleSkills {
  displayStyle?: 'progressbar' | 'tag';
  items?: Array<{ name: string; level?: number }>;
}

export interface CvSample {
  templateId: string;
  themeConfig: SampleTheme;
  columnLayout: { left: string[]; right: string[] };
  cvData: SampleCvData;
}

export const INDUSTRY_TABS = [
  { id: 'all', label: 'Tất cả', apiParam: undefined as string | undefined },
  { id: 'it', label: '💻 IT', apiParam: 'it' },
  { id: 'marketing', label: '📢 Marketing', apiParam: 'marketing' },
  { id: 'design', label: '🎨 Design', apiParam: 'design' },
  { id: 'business', label: '💼 Kinh tế', apiParam: 'business' },
  { id: 'healthcare', label: '🏥 Y tế', apiParam: 'healthcare' },
  { id: 'hospitality', label: '🏨 Khách sạn', apiParam: 'hospitality' },
  { id: 'finance', label: '💰 Finance', apiParam: 'finance' },
  { id: 'creative', label: '✨ Creative', apiParam: 'creative' },
] as const;

export const INDUSTRY_COLOR: Record<string, string> = {
  IT: '#6366f1',
  Marketing: '#f59e0b',
  Design: '#ec4899',
  Business: '#0ea5e9',
  Healthcare: '#14b8a6',
  Hospitality: '#a855f7',
  Finance: '#10b981',
  Creative: '#f97316',
  Education: '#8b5cf6',
  General: '#64748b',
};

export function getJobTitle(personal?: SampleCvData['personal']): string {
  return personal?.title || personal?.jobTitle || '';
}

export function normalizeColumnLayout(layout: { left?: string[]; right?: string[] }): ColumnLayout {
  const norm = (ids?: string[]) => (ids ?? []).map(k => (k === 'personal' ? 'profile' : k));
  return { left: norm(layout.left), right: norm(layout.right) };
}

export function parseSamplesResponse(res: unknown): { samples: CvSample[]; total: number } {
  let total = 0;
  let data: CvSample[] = [];

  if (Array.isArray(res)) {
    data = res as CvSample[];
  } else if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    if (typeof obj.total === 'number') total = obj.total;

    const inner = obj.data ?? res;
    if (Array.isArray(inner)) {
      data = inner as CvSample[];
    } else if (inner && typeof inner === 'object') {
      const nested = inner as Record<string, unknown>;
      const arr =
        nested.samples ?? nested.content ?? nested.rows ?? nested.items ?? nested.results;
      if (Array.isArray(arr)) data = arr as CvSample[];
    }
  }

  if (!total) total = data.length;
  return { samples: data, total };
}

/** Loại bỏ trùng lặp hoàn toàn (giữ tất cả mẫu khác nhau kể cả cùng templateId) */
export function dedupeSamples(samples: CvSample[]): CvSample[] {
  const seen = new Set<string>();
  return samples.filter((s, idx) => {
    const hash = `${s.templateId}::${getJobTitle(s.cvData.personal)}::${s.cvData.personal?.fullName ?? ''}::${idx}`;
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

export function inferIndustry(sample: CvSample): string {
  const id = sample.templateId.toLowerCase();
  const title = getJobTitle(sample.cvData.personal).toLowerCase();
  const text = `${id} ${title}`;

  if (/data|analyst|scientist|backend|qa|cyber|game|developer|engineer|it|tech|dev|code/.test(text)) return 'IT';
  if (/marketing|digital|social|brand|event|mc|customer success/.test(text)) return 'Marketing';
  if (/design|interior|photographer|creative|art|ui|ux/.test(text)) return 'Design';
  if (/nurse|y tá|health|medical|bệnh/.test(text)) return 'Healthcare';
  if (/hotel|hospitality|bếp|chef|gm|khách sạn/.test(text)) return 'Hospitality';
  if (/finance|bi analyst|account|bank|xnk|bđs|real estate|operations|pm/.test(text)) return 'Business';
  if (/finance|financial/.test(text)) return 'Finance';
  if (/edu|teacher|academic|giáo/.test(text)) return 'Education';
  return 'General';
}

function formatPeriod(startDate?: string, endDate?: string | null, isCurrent?: boolean): string {
  const fmt = (d?: string | null) => {
    if (!d) return '';
    const [y, m] = d.split('-');
    return m ? `${m}/${y}` : y;
  };
  const start = fmt(startDate);
  if (!start) return '';
  const end = isCurrent || !endDate ? 'Nay' : fmt(endDate);
  return `${start} – ${end}`;
}

export function mapSampleToCvData(sample: CvSample, existingAvatar = ''): CvData {
  const sampleAvatar = sample.cvData.personal?.avatarUrl || '';

  const mappedExperience = (sample.cvData.experience || []).map((exp, i) => ({
    id: `exp-s-${Date.now()}-${i}`,
    order_index: i + 1,
    title: exp.position || '',
    company: exp.company || '',
    period: formatPeriod(exp.startDate, exp.endDate, exp.isCurrent),
    description: exp.description || '',
  }));

  const mappedEducation = (sample.cvData.education || []).map((edu, i) => ({
    id: `edu-s-${Date.now()}-${i}`,
    order_index: i + 1,
    school: edu.school || '',
    degree: [edu.degree, edu.major].filter(Boolean).join(' — '),
    period: formatPeriod(edu.startDate, edu.endDate),
    description: edu.gpa ? `GPA: ${edu.gpa}` : '',
  }));

  const mappedProjects = (sample.cvData.projects || []).map((proj, i) => ({
    id: `proj-s-${Date.now()}-${i}`,
    order_index: i + 1,
    title: proj.name || '',
    company: proj.techStack?.join(', ') || '',
    period: proj.url || '',
    description: proj.description || '',
  }));

  const sk = sample.cvData.skills;
  let mappedSkills: CvData['skills'] = '';
  if (typeof sk === 'string') mappedSkills = sk;
  else if (sk && typeof sk === 'object' && !Array.isArray(sk)) {
    mappedSkills = ((sk as { items?: Array<{ name: string }> }).items || []).map(s => s.name).filter(Boolean);
  } else if (Array.isArray(sk)) mappedSkills = sk;

  const customSections: CustomSection[] = (sample.cvData.customSections || []).map(section => ({
    id: section.id || crypto.randomUUID(),
    title: section.title || 'Mục tùy chỉnh',
    icon: section.icon || 'default',
    items: (section.items || []).map(item => ({
      id: item.id || crypto.randomUUID(),
      name: item.name || '',
      subtitle: item.subtitle || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      description: item.description || '',
    })),
  }));

  return {
    personal: {
      fullName: sample.cvData.personal?.fullName || '',
      title: getJobTitle(sample.cvData.personal),
      email: sample.cvData.personal?.email || sample.cvData.contact?.email || '',
      phoneNumber: sample.cvData.personal?.phoneNumber || sample.cvData.contact?.phone || '',
      address: sample.cvData.personal?.address || '',
      avatarUrl: sampleAvatar || existingAvatar,
    },
    about: sample.cvData.about || '',
    experience: mappedExperience,
    education: mappedEducation,
    projects: mappedProjects,
    skills: mappedSkills,
    customSections,
  };
}

export function mapSampleTheme(theme: SampleTheme): Partial<ThemeConfig> & { textColor?: string; bodyTextColor?: string } {
  return {
    primaryColor: theme.primaryColor,
    fontFamily: theme.fontFamily,
    layoutMode: theme.layoutMode || '2-column',
    ...(theme.textColor ? { textColor: theme.textColor } : {}),
    ...(theme.bodyTextColor ? { bodyTextColor: theme.bodyTextColor } : {}),
  };
}

export function buildColumnLayoutFromSample(sample: CvSample): ColumnLayout {
  const normalized = normalizeColumnLayout(sample.columnLayout);
  const hasProfile = normalized.left.includes('profile') || normalized.right.includes('profile');
  return {
    left: hasProfile ? normalized.left : ['profile', ...normalized.left],
    right: normalized.right,
  };
}
