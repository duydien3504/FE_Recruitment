import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CvService, formatCvApiError, resolveCvTemplateIdForSave } from '../../services/cv.service';
import { useCvStore } from '../../store/cvStore';
import type { ThemeConfig } from '../../store/cvStore';
import { CUSTOM_SECTION_ICONS } from './CreateCustomSectionModal';
import {
  type CvSample,
  type SampleSkills,
  INDUSTRY_TABS,
  INDUSTRY_COLOR,
  getJobTitle,
  normalizeColumnLayout,
  parseSamplesResponse,
  dedupeSamples,
  inferIndustry,
  mapSampleToCvData,
  mapSampleTheme,
  buildColumnLayoutFromSample,
} from '../../utils/cvSampleUtils';

const GOOGLE_FONTS_MAP: Record<string, string> = {
  'Inter': 'Inter:wght@400;500;600;700', 'Roboto': 'Roboto:wght@400;500;700',
  'Montserrat': 'Montserrat:wght@400;500;600;700', 'Lato': 'Lato:wght@400;700',
  'Merriweather': 'Merriweather:wght@400;700',
  'Playfair Display': 'Playfair+Display:wght@400;600;700',
  'Fira Code': 'Fira+Code:wght@400;500;600',
  'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@400;500;600;700',
  'Open Sans': 'Open+Sans:wght@400;500;600;700',
  'Poppins': 'Poppins:wght@400;500;600;700',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  // Bỏ prefix học vị như PGS.TS., TS., GS., ThS.
  const cleaned = name.replace(/^(PGS\.TS\.|TS\.|GS\.|ThS\.|PGS\.|GVC\.)\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── CvAvatar Component ───────────────────────────────────────────────────────
const CvAvatar: React.FC<{
  avatarUrl?: string;
  fullName?: string;
  primaryColor: string;
  size?: number;
  textColor?: string;
  borderColor?: string;
}> = ({ avatarUrl, fullName, primaryColor, size = 100, textColor = '#ffffff', borderColor = 'rgba(255,255,255,0.25)' }) => {
  const [imgError, setImgError] = useState(false);
  const showInitials = !avatarUrl || imgError;
  const initials = getInitials(fullName);

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      backgroundColor: showInitials ? primaryColor : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `3px solid ${borderColor}`,
      boxShadow: `0 4px 14px ${primaryColor}55`,
    }}>
      {showInitials ? (
        <span style={{ color: textColor, fontSize: Math.round(size * 0.36), fontWeight: 800, letterSpacing: 1, lineHeight: 1 }}>
          {initials}
        </span>
      ) : (
        <img
          src={avatarUrl}
          alt={fullName || ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};

function formatDate(d?: string | null): string {
  if (!d) return '';
  const [y, m] = d.split('-');
  return m ? `${m}/${y}` : y;
}

function loadGoogleFont(fontFamily: string) {
  const slug = GOOGLE_FONTS_MAP[fontFamily];
  if (!slug) return;
  const id = `gfont-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${slug}&display=swap`;
  document.head.appendChild(link);
}

// ─── Mini Card Thumbnail ──────────────────────────────────────────────────────
const MiniCvCard: React.FC<{ sample: CvSample }> = ({ sample }) => {
  const pri = sample.themeConfig.primaryColor;
  const sidebarBg = sample.themeConfig.secondaryColor || '#2d3e50';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', overflow: 'hidden', background: '#fff', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '34%', background: sidebarBg, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <CvAvatar
          avatarUrl={sample.cvData.personal?.avatarUrl}
          fullName={sample.cvData.personal?.fullName}
          primaryColor={pri}
          size={34}
          borderColor={`${pri}66`}
        />
        <div style={{ width: '90%', height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.7)' }} />
        <div style={{ width: '70%', height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.35)' }} />
        <div style={{ width: '80%', height: 1.5, borderRadius: 2, background: `${pri}99`, marginTop: 4 }} />
        {[85, 65, 75, 55].map((w, i) => (
          <div key={i} style={{ width: `${w}%`, height: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        ))}
        <div style={{ width: '80%', height: 1.5, borderRadius: 2, background: `${pri}88`, marginTop: 4 }} />
        {[70, 60].map((w, i) => (
          <div key={i} style={{ width: `${w}%`, height: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: '10px 7px', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        <div style={{ height: 3, borderRadius: 2, background: pri, width: '75%' }} />
        <div style={{ height: 2, borderRadius: 2, background: '#94a3b8', width: '55%' }} />
        <div style={{ height: 1, marginTop: 2 }} />
        <div style={{ height: 2.5, borderRadius: 2, background: `${pri}55`, width: '50%' }} />
        {[90, 80, 70].map((w, i) => (
          <div key={i} style={{ height: 1.5, borderRadius: 2, background: '#e2e8f0', width: `${w}%` }} />
        ))}
        <div style={{ height: 1, marginTop: 2 }} />
        <div style={{ height: 2.5, borderRadius: 2, background: `${pri}55`, width: '60%' }} />
        {[85, 75].map((w, i) => (
          <div key={i} style={{ height: 1.5, borderRadius: 2, background: '#e2e8f0', width: `${w}%` }} />
        ))}
        <div style={{ height: 1, marginTop: 2 }} />
        <div style={{ height: 2.5, borderRadius: 2, background: `${pri}55`, width: '45%' }} />
        {[80, 65].map((w, i) => (
          <div key={i} style={{ height: 1.5, borderRadius: 2, background: '#e2e8f0', width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
};

// ─── Full CV Preview ──────────────────────────────────────────────────────────
const FullCvPreview: React.FC<{ sample: CvSample }> = ({ sample }) => {
  const { cvData, themeConfig } = sample;
  const columnLayout = normalizeColumnLayout(sample.columnLayout);
  const pri = themeConfig.primaryColor;
  const sidebarBg = themeConfig.secondaryColor || '#2d3e50';
  const textOnSidebar = themeConfig.textColor || '#f1f5f9';
  const bodyText = themeConfig.bodyTextColor || '#1e293b';
  const fontFamily = `'${themeConfig.fontFamily}', 'Be Vietnam Pro', sans-serif`;

  const renderSkills = (isDark: boolean) => {
    const skills = cvData.skills;
    if (!skills) return <p style={{ fontSize: 9, opacity: 0.3, fontStyle: 'italic', color: isDark ? textOnSidebar : bodyText }}>Chưa có kỹ năng</p>;
    if (typeof skills === 'string') return <div style={{ fontSize: 9, color: isDark ? textOnSidebar : bodyText, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: skills }} />;

    const { displayStyle = 'tag', items = [] } = skills as SampleSkills;

    if (displayStyle === 'progressbar') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {items.map((skill, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 8, color: isDark ? textOnSidebar : bodyText, fontWeight: 600 }}>{skill.name}</span>
                <span style={{ fontSize: 7, color: pri, opacity: 0.8 }}>{skill.level ?? 70}%</span>
              </div>
              <div style={{ height: 3, background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${skill.level ?? 70}%`, background: pri, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {items.map((skill, i) => (
          <span key={i} style={{ fontSize: 8, padding: '2px 7px', borderRadius: 99, background: isDark ? `${pri}33` : `${pri}18`, color: isDark ? textOnSidebar : pri, fontWeight: 600, border: `1px solid ${pri}44` }}>
            {skill.name}
          </span>
        ))}
      </div>
    );
  };

  const renderSectionLeft = (sectionId: string) => {
    const sectionLabel = (label: string) => (
      <p style={{ fontSize: 7, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: pri, borderBottom: `1px solid rgba(255,255,255,0.1)`, paddingBottom: 3, marginBottom: 7, margin: '0 0 7px' }}>
        {label}
      </p>
    );

    if (sectionId === 'personal' || sectionId === 'profile') {
      return (
        <div key="profile" style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <CvAvatar
              avatarUrl={cvData.personal?.avatarUrl}
              fullName={cvData.personal?.fullName}
              primaryColor={pri}
              size={84}
              textColor={textOnSidebar}
              borderColor={`${pri}88`}
            />
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: textOnSidebar, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2 }}>
            {cvData.personal?.fullName || 'Tên ứng viên'}
          </p>
          <p style={{ fontSize: 9, color: pri, fontStyle: 'italic', margin: 0, opacity: 0.9 }}>
            {getJobTitle(cvData.personal)}
          </p>
        </div>
      );
    }

    if (sectionId === 'contact') {
      const entries = [
        { icon: '📞', v: cvData.personal?.phoneNumber || cvData.contact?.phone },
        { icon: '✉️', v: cvData.personal?.email || cvData.contact?.email },
        { icon: '📍', v: cvData.personal?.address },
        { icon: '🔗', v: cvData.contact?.linkedIn },
        { icon: '💻', v: cvData.contact?.github },
        { icon: '🌐', v: cvData.contact?.website },
      ].filter(e => e.v);
      if (!entries.length) return null;
      return (
        <div key="contact" style={{ marginBottom: 16 }}>
          {sectionLabel('LIÊN HỆ')}
          {entries.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontSize: 8, lineHeight: 1.6, flexShrink: 0 }}>{e.icon}</span>
              <span style={{ fontSize: 8, color: `${textOnSidebar}cc`, lineHeight: 1.5, wordBreak: 'break-all' }}>{e.v}</span>
            </div>
          ))}
        </div>
      );
    }

    if (sectionId === 'skills') {
      return (
        <div key="skills" style={{ marginBottom: 16 }}>
          {sectionLabel('KỸ NĂNG')}
          {renderSkills(true)}
        </div>
      );
    }

    if (sectionId === 'about') {
      return (
        <div key="about" style={{ marginBottom: 16 }}>
          {sectionLabel('MỤC TIÊU')}
          <p style={{ fontSize: 8, color: `${textOnSidebar}cc`, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{cvData.about || ''}</p>
        </div>
      );
    }

    if (sectionId === 'education') {
      const items = cvData.education || [];
      return (
        <div key="education" style={{ marginBottom: 16 }}>
          {sectionLabel('HỌC VẤN')}
          {items.map((edu, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: textOnSidebar, margin: '0 0 1px' }}>{edu.school}</p>
              <p style={{ fontSize: 8, color: pri, fontStyle: 'italic', margin: '0 0 1px' }}>{[edu.degree, edu.major].filter(Boolean).join(' — ')}</p>
              <p style={{ fontSize: 7, color: `${textOnSidebar}77`, margin: 0 }}>
                {[formatDate(edu.startDate), edu.endDate ? formatDate(edu.endDate) : 'Nay'].join(' – ')}
                {edu.gpa ? ` · GPA: ${edu.gpa}` : ''}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (sectionId === 'customSections') {
      const sections = cvData.customSections || [];
      if (!sections.length) return null;
      return (
        <div key="customSections">
          {sections.map(section => {
            const iconDef = CUSTOM_SECTION_ICONS[section.icon] || CUSTOM_SECTION_ICONS.default;
            return (
              <div key={section.id} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 7, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: pri, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 3, marginBottom: 7 }}>
                  {iconDef.emoji} {section.title}
                </p>
                {(section.items || []).map((item, i) => (
                  <div key={item.id || i} style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: textOnSidebar, margin: '0 0 1px' }}>{item.name}</p>
                    {item.subtitle && <p style={{ fontSize: 8, color: pri, margin: '0 0 1px' }}>{item.subtitle}</p>}
                    {(item.startDate || item.endDate) && (
                      <p style={{ fontSize: 7, color: `${textOnSidebar}77`, margin: '0 0 2px' }}>
                        {[formatDate(item.startDate), item.endDate ? formatDate(item.endDate) : ''].filter(Boolean).join(' – ')}
                      </p>
                    )}
                    {item.description && <p style={{ fontSize: 8, color: `${textOnSidebar}cc`, lineHeight: 1.6, margin: 0 }}>{item.description}</p>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const renderSectionRight = (sectionId: string) => {
    const sectionHeader = (label: string) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: pri, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z" /><path d="M7 7h.01" /></svg>
        </div>
        <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: bodyText, margin: 0 }}>{label}</h3>
      </div>
    );

    if (sectionId === 'about') {
      if (!cvData.about) return null;
      return (
        <div key="about" style={{ marginBottom: 20 }}>
          {sectionHeader('MỤC TIÊU NGHỀ NGHIỆP')}
          <p style={{ fontSize: 9.5, color: bodyText, lineHeight: 1.8, margin: 0, opacity: 0.85 }}>{cvData.about}</p>
        </div>
      );
    }

    if (sectionId === 'experience') {
      const items = cvData.experience || [];
      return (
        <div key="experience" style={{ marginBottom: 20 }}>
          {sectionHeader('KINH NGHIỆM LÀM VIỆC')}
          {items.map((exp, i) => (
            <div key={i} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: i < items.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: bodyText, margin: '0 0 1px' }}>{exp.position}</p>
                  <p style={{ fontSize: 9, color: pri, fontWeight: 600, margin: 0 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                </div>
                <p style={{ fontSize: 7.5, color: '#94a3b8', flexShrink: 0, textAlign: 'right', lineHeight: 1.4, margin: 0 }}>
                  {formatDate(exp.startDate)} – {exp.isCurrent ? 'Nay' : formatDate(exp.endDate)}
                </p>
              </div>
              {exp.description && (
                <p style={{ fontSize: 8.5, color: bodyText, opacity: 0.75, lineHeight: 1.7, margin: '6px 0 0' }}>{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (sectionId === 'education') {
      const items = cvData.education || [];
      return (
        <div key="education" style={{ marginBottom: 20 }}>
          {sectionHeader('HỌC VẤN')}
          {items.map((edu, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: i < items.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: bodyText, margin: '0 0 1px' }}>{edu.school}</p>
                  <p style={{ fontSize: 9, color: pri, fontStyle: 'italic', margin: '0 0 1px' }}>{edu.degree}{edu.major ? ` — ${edu.major}` : ''}</p>
                  {edu.gpa && <p style={{ fontSize: 8, color: '#64748b', margin: 0 }}>GPA: {edu.gpa}</p>}
                </div>
                <p style={{ fontSize: 7.5, color: '#94a3b8', flexShrink: 0, textAlign: 'right', lineHeight: 1.4, margin: 0 }}>
                  {formatDate(edu.startDate)} – {edu.endDate ? formatDate(edu.endDate) : 'Nay'}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (sectionId === 'projects') {
      const items = cvData.projects || [];
      return (
        <div key="projects" style={{ marginBottom: 20 }}>
          {sectionHeader('DỰ ÁN')}
          {items.map((proj, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: i < items.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: bodyText, margin: '0 0 3px' }}>{proj.name}</p>
              {proj.description && <p style={{ fontSize: 8.5, color: bodyText, opacity: 0.75, lineHeight: 1.7, margin: '0 0 5px' }}>{proj.description}</p>}
              {proj.techStack && proj.techStack.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {proj.techStack.map((tech, j) => (
                    <span key={j} style={{ fontSize: 7.5, padding: '1.5px 6px', borderRadius: 4, background: `${pri}15`, color: pri, fontWeight: 600, border: `1px solid ${pri}30` }}>{tech}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (sectionId === 'skills') {
      return (
        <div key="skills" style={{ marginBottom: 20 }}>
          {sectionHeader('KỸ NĂNG')}
          {renderSkills(false)}
        </div>
      );
    }

    if (sectionId === 'contact') {
      return null;
    }

    if (sectionId === 'customSections') {
      const sections = cvData.customSections || [];
      if (!sections.length) return null;
      return (
        <div key="customSections">
          {sections.map(section => {
            const iconDef = CUSTOM_SECTION_ICONS[section.icon] || CUSTOM_SECTION_ICONS.default;
            return (
              <div key={section.id} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: pri, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10 }}>
                    {iconDef.emoji}
                  </div>
                  <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: bodyText, margin: 0 }}>{section.title}</h3>
                </div>
                {(section.items || []).map((item, i) => (
                  <div key={item.id || i} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: i < (section.items?.length ?? 0) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: bodyText, margin: '0 0 1px' }}>{item.name}</p>
                    {item.subtitle && <p style={{ fontSize: 9, color: pri, fontWeight: 600, margin: '0 0 2px' }}>{item.subtitle}</p>}
                    {(item.startDate || item.endDate) && (
                      <p style={{ fontSize: 7.5, color: '#94a3b8', margin: '0 0 4px' }}>
                        {[formatDate(item.startDate), item.endDate ? formatDate(item.endDate) : ''].filter(Boolean).join(' – ')}
                      </p>
                    )}
                    {item.description && <p style={{ fontSize: 8.5, color: bodyText, opacity: 0.75, lineHeight: 1.7, margin: 0 }}>{item.description}</p>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{
      width: 794, minHeight: 1123, background: '#fff', display: 'flex', overflow: 'hidden',
      fontFamily, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', borderRadius: 2,
      transformOrigin: 'top center',
    }}>
      {/* Left Sidebar */}
      <div style={{ width: 260, flexShrink: 0, background: sidebarBg, color: textOnSidebar, padding: '28px 18px', overflowY: 'auto' }}>
        {(columnLayout.left.length > 0 ? columnLayout.left : ['profile', 'contact', 'skills', 'education']).map(sid => renderSectionLeft(sid))}
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px 24px', background: '#fff', color: bodyText, overflowY: 'auto' }}>
        {(columnLayout.right.length > 0 ? columnLayout.right : ['about', 'experience', 'projects']).map(sid => renderSectionRight(sid))}
      </div>
    </div>
  );
};

// ─── Preview Modal ────────────────────────────────────────────────────────────
interface PreviewModalProps {
  sample: CvSample;
  onClose: () => void;
  onUseSample: () => void;
}
const PreviewModal: React.FC<PreviewModalProps> = ({ sample, onClose, onUseSample }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const industry = inferIndustry(sample);
  const badgeColor = INDUSTRY_COLOR[industry] || '#64748b';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: sample.themeConfig.primaryColor + '22', border: `2px solid ${sample.themeConfig.primaryColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: sample.themeConfig.primaryColor }}>
            {getInitials(sample.cvData.personal?.fullName)}
          </div>
          <div>
            <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700, margin: 0 }}>
              {sample.cvData.personal?.fullName || 'CV Mẫu'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>{getJobTitle(sample.cvData.personal)}</p>
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: badgeColor + '33', color: badgeColor, fontWeight: 700 }}>{industry}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onUseSample}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: sample.themeConfig.primaryColor, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: `0 4px 12px ${sample.themeConfig.primaryColor}66` }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
            Dùng mẫu này
          </button>
          <button
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            ✕ Đóng
          </button>
        </div>
      </div>

      {/* Scrollable CV */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 24px 48px' }}>
        <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', marginBottom: -224 }}>
          <FullCvPreview sample={sample} />
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Overwrite Dialog ─────────────────────────────────────────────────
interface ConfirmDialogProps {
  sampleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ sampleName, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 mx-4">
      <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-gray-800 text-center mb-2">Thay thế nội dung CV?</h3>
      <p className="text-[11px] text-gray-500 text-center leading-relaxed mb-5">
        CV của bạn đang có nội dung. Dùng mẫu <span className="font-semibold text-gray-700">"{sampleName}"</span> sẽ{' '}
        <span className="text-red-500 font-semibold">ghi đè toàn bộ</span> nội dung hiện tại.
      </p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
          Huỷ
        </button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm">
          Đồng ý, ghi đè
        </button>
      </div>
    </div>
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="animate-pulse rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
    <div className="aspect-[3/4] bg-gray-100" />
    <div className="p-2.5 space-y-1.5">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-2.5 bg-gray-100 rounded w-2/3" />
      <div className="h-2 bg-gray-100 rounded w-1/2 mt-1" />
    </div>
  </div>
);

// ─── Main Panel ───────────────────────────────────────────────────────────────
const SampleLibraryPanel: React.FC = () => {
  const { cvData: currentCvData, themeConfig, setCvData, updateTheme, setColumnLayout, setTemplateId } = useCvStore();

  const [samples, setSamples] = useState<CvSample[]>([]);
  const [sampleTotal, setSampleTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndustry, setActiveIndustry] = useState('all');
  const [previewSample, setPreviewSample] = useState<CvSample | null>(null);
  const [confirmSample, setConfirmSample] = useState<CvSample | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const fetchSamples = useCallback(async (industryParam?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await CvService.getSamples(industryParam);
      const { samples: data, total } = parseSamplesResponse(res);
      const unique = dedupeSamples(data);
      setSamples(unique);
      setSampleTotal(total || unique.length);
      unique.forEach(s => { if (s.themeConfig?.fontFamily) loadGoogleFont(s.themeConfig.fontFamily); });
    } catch (err) {
      console.error('[SampleLibrary] Fetch error:', err);
      setError('Không thể tải thư viện mẫu CV. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const tab = INDUSTRY_TABS.find(t => t.id === activeIndustry);
    fetchSamples(tab?.apiParam);
  }, [activeIndustry, fetchSamples]);

  const hasCvData = (): boolean => {
    if (!currentCvData) return false;
    return Object.values(currentCvData).some(v => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
      return v !== undefined && v !== null && v !== '';
    });
  };

  const handleUseSample = (sample: CvSample) => {
    if (hasCvData()) {
      setConfirmSample(sample);
    } else {
      applySample(sample);
    }
  };

  const applySample = async (sample: CvSample) => {
    setConfirmSample(null);
    setPreviewSample(null);

    const existingAvatar = (currentCvData as { personal?: { avatarUrl?: string } })?.personal?.avatarUrl || '';
    const mergedCvData = mapSampleToCvData(sample, existingAvatar);
    const themePatch = mapSampleTheme(sample.themeConfig);
    const layout = buildColumnLayoutFromSample(sample);
    const tid = sample.templateId;

    setCvData(mergedCvData);
    updateTheme(themePatch as Partial<ThemeConfig>);
    setColumnLayout(layout);
    setTemplateId(tid);
    loadGoogleFont(sample.themeConfig.fontFamily);

    try {
      const resolved = await resolveCvTemplateIdForSave(tid);
      const mergedTheme = { ...themeConfig, ...themePatch };
      await CvService.updateDraft({
        cvData: mergedCvData,
        themeConfig: mergedTheme,
        templateId: resolved,
        columnLayout: layout,
      });
      setTemplateId(resolved);
      toast.success('Đã áp dụng mẫu CV và lưu nháp.');
    } catch (err) {
      console.error('[SampleLibrary] Lưu nháp sau khi dùng mẫu:', err);
      toast.error(formatCvApiError(err));
    }
  };

  const sampleKey = (sample: CvSample, index: number) =>
    `${sample.templateId}-${getJobTitle(sample.cvData.personal)}-${index}`;

  const getIndustryLabel = (sample: CvSample) => inferIndustry(sample);
  const getBadgeColor = (sample: CvSample) => INDUSTRY_COLOR[getIndustryLabel(sample)] || '#64748b';

  return (
    <>
      {/* Preview Modal */}
      {previewSample && (
        <PreviewModal
          sample={previewSample}
          onClose={() => setPreviewSample(null)}
          onUseSample={() => handleUseSample(previewSample)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmSample && (
        <ConfirmDialog
          sampleName={confirmSample.cvData.personal?.fullName || confirmSample.templateId}
          onConfirm={() => applySample(confirmSample)}
          onCancel={() => setConfirmSample(null)}
        />
      )}

      <div className="flex flex-col h-full min-h-0">
        {/* Header cố định — không cuộn */}
        <div className="shrink-0">
          <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0">📚</span>
              <div>
                <p className="text-[10px] font-bold text-indigo-700">Thư viện mẫu CV hoàn chỉnh</p>
                <p className="text-[10px] text-indigo-500 leading-relaxed mt-0.5">Click để xem trước · Bấm <span className="font-bold">"Dùng mẫu này"</span> để điền vào editor</p>
              </div>
            </div>
          </div>

          {/* Industry filter */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {INDUSTRY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveIndustry(tab.id)}
                className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all border ${activeIndustry === tab.id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary/40 hover:text-primary'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Count */}
          {!isLoading && !error && (
            <p className="text-[10px] text-gray-400 mb-3">
              {activeIndustry === 'all'
                ? `${sampleTotal || samples.length} mẫu`
                : `${samples.length} / ${sampleTotal || samples.length} mẫu`}
              {activeIndustry !== 'all' ? ` · ${INDUSTRY_TABS.find(t => t.id === activeIndustry)?.label ?? ''}` : ''}
            </p>
          )}
        </div>

        {/* Chỉ phần danh sách mẫu cuộn */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pr-1 -mr-1">
        {/* Error */}
        {error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <p className="text-xs text-red-500">{error}</p>
            <button onClick={() => fetchSamples(INDUSTRY_TABS.find(t => t.id === activeIndustry)?.apiParam)} className="text-xs text-primary underline hover:no-underline">Thử lại</button>
          </div>
        )}

        {/* Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {samples.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center gap-3 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400">Chưa có mẫu CV cho ngành này.</p>
              </div>
            ) : samples.map((sample, index) => {
              const ind = getIndustryLabel(sample);
              const bc = getBadgeColor(sample);
              const key = sampleKey(sample, index);
              const isHovered = hoveredKey === key;

              return (
                <div
                  key={key}
                  className="relative rounded-xl border-2 border-gray-100 overflow-hidden cursor-pointer transition-all duration-200 bg-white group shadow-sm hover:shadow-lg hover:border-primary/40"
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() => setPreviewSample(sample)}
                  title={`${getJobTitle(sample.cvData.personal) || ind} — Click để xem trước`}
                >
                  {/* Mini CV Thumbnail */}
                  <div className="aspect-[3/4] overflow-hidden bg-gray-50 relative">
                    <MiniCvCard sample={sample} />

                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="text-white text-[10px] font-bold">Xem trước</span>
                      <button
                        className="text-white text-[9px] font-bold px-3 py-1.5 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-all mt-0.5"
                        onClick={(e) => { e.stopPropagation(); handleUseSample(sample); }}
                      >
                        Dùng mẫu này
                      </button>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-2.5">
                    <p className="text-[11px] font-bold text-gray-700 truncate leading-tight">
                      {sample.cvData.personal?.fullName || 'CV Mẫu'}
                    </p>
                    <p className="text-[9px] text-gray-400 truncate mt-0.5 leading-tight">
                      {getJobTitle(sample.cvData.personal) || sample.templateId}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold"
                        style={{ background: bc + '22', color: bc }}
                      >
                        {ind}
                      </span>
                      <span className="text-[8px] text-gray-300" style={{ fontFamily: 'monospace' }}>
                        {sample.themeConfig.fontFamily?.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default SampleLibraryPanel;
