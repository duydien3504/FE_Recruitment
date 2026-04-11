import { create } from 'zustand';
import { DEFAULT_CV_TEMPLATE_ID } from '../constants/cvTemplateDefaults';

// Define structures based on Backend design
export interface BlockData {
  id: string;
  order_index: number;
  [key: string]: any;
}

export interface CvData {
  experience?: BlockData[];
  education?: BlockData[];
  skills?: any;
  [key: string]: any;
}

export interface ThemeConfig {
  primaryColor: string;
  layoutMode: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  lineSpacing: number;
  charSpacing: number;
  background?: string;
}

export interface ColumnLayout {
  left: string[];
  right: string[];
}

interface CvState {
  cvData: CvData;
  templateId: string;
  themeConfig: ThemeConfig;
  columnLayout: ColumnLayout; // Added Column Layout
  atsScore: number;
  
  // Actions
  setCvData: (data: CvData) => void;
  setTemplateId: (id: string) => void;
  setAtsScore: (score: number) => void;
  updateTheme: (config: Partial<ThemeConfig>) => void;
  updateSection: (section: string, data: any) => void;
  setColumnLayout: (layout: ColumnLayout) => void; // Added Action
  reorderBlocks: (section: string, fromIndex: number, toIndex: number) => void;
}

export const useCvStore = create<CvState>((set) => ({
  cvData: {},
  templateId: DEFAULT_CV_TEMPLATE_ID,
  themeConfig: {
    primaryColor: '#00b14f', 
    layoutMode: '2-column',
    fontFamily: 'Be Vietnam Pro',
    fontSize: 'medium',
    lineSpacing: 1.2,
    charSpacing: 0,
    background: '',
  },
  columnLayout: {
    left: ['profile', 'contact', 'about', 'skills'],
    right: ['education', 'experience', 'projects', 'awards']
  },
  atsScore: 0,

  setCvData: (data) => set({ cvData: data }),
  setTemplateId: (id) => set({ templateId: id }),
  setColumnLayout: (layout) => set({ columnLayout: layout }),
  
  updateTheme: (config) => set((state) => ({ 
    themeConfig: { ...state.themeConfig, ...config } 
  })),

  updateSection: (section, data) => set((state) => ({
    cvData: { ...state.cvData, [section]: data }
  })),
  
  reorderBlocks: (section, fromIndex, toIndex) => set((state) => {
    const list = Array.from((state.cvData[section] as BlockData[]) || []);
    const [removed] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, removed);
    
    // Update order_index for the modified list
    const updatedList = list.map((item, index) => ({ 
      ...item, 
      order_index: index + 1 
    }));
    
    return {
      cvData: { ...state.cvData, [section]: updatedList }
    };
  }),
  
  setAtsScore: (score) => set({ atsScore: score }),
}));
