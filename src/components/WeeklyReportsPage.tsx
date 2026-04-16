import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, ChevronLeft, ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

type WeeklyReport = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
};

const IMAGE_RE = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;

function renderContent(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  IMAGE_RE.lastIndex = 0;

  while ((match = IMAGE_RE.exec(text)) !== null) {
    const before = text.slice(last, match.index);
    if (before) {
      nodes.push(
        <span key={`t-${last}`} className="whitespace-pre-wrap">{before}</span>
      );
    }
    nodes.push(
      <img
        key={`img-${match.index}`}
        src={match[1]}
        alt="rapor görseli"
        className="w-full rounded-sm border border-[#1F1F1F] my-3"
      />
    );
    last = match.index + match[0].length;
  }

  const tail = text.slice(last);
  if (tail) {
    nodes.push(
      <span key="t-end" className="whitespace-pre-wrap">{tail}</span>
    );
  }
  return nodes;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

// ── Detail (full-page) view ──────────────────────────────────────────────────
function ReportDetail({ report, onBack }: { report: WeeklyReport; onBack: () => void }) {
  const dateTime = formatDateTime(report.published_at ?? report.created_at);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] text-[#555555] hover:text-[#AAAAAA] transition-colors font-mono uppercase tracking-wider"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Geri
      </button>

      {/* Cover image */}
      {report.image_url && (
        <div className="w-full overflow-hidden rounded-sm border border-[#1F1F1F]">
          <img
            src={report.image_url}
            alt={report.title}
            className="w-full object-cover max-h-72"
          />
        </div>
      )}

      {/* Header */}
      <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-3.5 h-3.5 text-[#555555]" />
          <span className="text-[11px] text-[#555555] font-mono">{dateTime}</span>
        </div>
        <h1 className="text-[18px] font-bold text-[#E5E5E5] leading-snug">
          {report.title}
        </h1>
      </div>

      {/* Body */}
      <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-5">
        <div className="text-[13px] text-[#AAAAAA] leading-relaxed">
          {renderContent(report.content)}
        </div>
      </div>
    </div>
  );
}

// ── Card (list) view ─────────────────────────────────────────────────────────
function ReportCard({ report, onOpen }: { report: WeeklyReport; onOpen: () => void }) {
  const dateTime = formatDateTime(report.published_at ?? report.created_at);

  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden">
      {/* Cover image */}
      {report.image_url ? (
        <div
          className="w-full h-48 overflow-hidden bg-[#0A0A0A] cursor-pointer"
          onClick={onOpen}
        >
          <img
            src={report.image_url}
            alt={report.title}
            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
          />
        </div>
      ) : (
        <div className="w-full h-32 flex items-center justify-center bg-[#0D0D0D] border-b border-[#1A1A1A]">
          <ImageIcon className="w-8 h-8 text-[#2A2A2A]" />
        </div>
      )}

      {/* Body */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-3.5 h-3.5 text-[#555555]" />
          <span className="text-[11px] text-[#555555] font-mono">{dateTime}</span>
        </div>

        {/* Clickable title */}
        <h2
          className="text-[15px] font-bold text-[#E5E5E5] leading-snug mb-3 cursor-pointer hover:text-white transition-colors"
          onClick={onOpen}
        >
          {report.title}
        </h2>

        {/* Teaser */}
        <p className="text-[13px] text-[#888888] leading-relaxed line-clamp-3 whitespace-pre-wrap mb-3">
          {report.content.replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, '[görsel]')}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1.5 text-[11px] text-[#4ADE80] hover:text-[#6EF0A0] transition-colors font-mono uppercase tracking-wider"
        >
          Devamını Oku →
        </button>
      </div>
    </div>
  );
}

// ── Page root ────────────────────────────────────────────────────────────────
export function WeeklyReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    supabase
      .from('weekly_reports')
      .select('id, title, content, image_url, published_at, created_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setReports(data);
        setLoading(false);
      });
  }, []);

  // Detail view
  if (selected) {
    return <ReportDetail report={selected} onBack={() => setSelected(null)} />;
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative rounded-sm border border-[#2A2A2A] overflow-hidden p-6"
        style={{
          background: 'linear-gradient(135deg, #0f1a12 0%, #111111 40%, #0d1219 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 18px 40px rgba(74,222,128,0.04)',
        }}
      >
        {/* Accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #4ADE80 40%, #34D399 70%, transparent)' }} />

        <div className="flex items-start gap-4">
          <div
            className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-sm flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <BookOpen className="w-4.5 h-4.5 text-[#4ADE80]" style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#4ADE80] mb-1.5">
              Analiz · Haftalık
            </div>
            <h1 className="text-[17px] font-bold text-[#E5E5E5] tracking-tight leading-snug mb-2">
              Haftalık Rapor
            </h1>
            <p className="text-[12px] text-[#666666] leading-relaxed max-w-lg">
              Piyasa analistlerimizin haftalık makro değerlendirmeleri ve öne çıkan gelişmeler.
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-[#555555] font-mono text-[13px]">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-[#333333] border-t-[#666666] animate-spin mr-3" />
          Raporlar yükleniyor...
        </div>
      )}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <div className="rounded-sm border border-dashed border-[#1F1F1F] py-16 text-center">
          <BookOpen className="w-8 h-8 text-[#2A2A2A] mx-auto mb-3" />
          <div className="text-[13px] text-[#555555] font-mono">Henüz yayınlanmış rapor yok.</div>
        </div>
      )}

      {/* Reports grid */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} onOpen={() => setSelected(report)} />
          ))}
        </div>
      )}
    </div>
  );
}
