import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, AlertTriangle, BookOpen, ChevronRight, Edit2, Eye, EyeOff,
  Hexagon, ImageIcon, Layers, LogOut, Plus, RefreshCw, Save, Settings,
  Shield, Trash2, Upload, Users, X, CheckCircle, BarChart2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { syncMetric } from '../workers/syncMetric';
import { runScoringEngine } from '../workers/scoringWorker';
import { runAlertEngine } from '../workers/alertWorker';
import { generateCategoryInsight, generateMarketOverview } from '../workers/aiWorker';

// ─── Types ────────────────────────────────────────────────────

type WeeklyReport = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type Category = { id: string; name: string };

type AdminSection = 'overview' | 'reports' | 'operations' | 'users' | 'system';

const CRYPTO_CATEGORY_ID = '30000000-0000-0000-0000-000000000011';
const PREDICTION_CATEGORY_ID = '30000000-0000-0000-0000-000000000012';

// ─── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Login Screen ─────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (email: string, password: string) => Promise<{ error: Error | null }> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await onLogin(email, password);
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Hexagon className="w-5 h-5 text-[#A3A3A3]" />
          <span className="font-semibold tracking-widest text-[13px] uppercase text-[#E5E5E5]">Mergen Admin</span>
        </div>

        <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-[#666666]" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#A3A3A3]">Giriş Yap</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#666666] mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#0D0D0D] border border-[#1F1F1F] rounded-sm px-3 py-2 text-[13px] text-[#E5E5E5] placeholder-[#444444] outline-none focus:border-[#333333] transition-colors"
                placeholder="admin@mergen.com"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#666666] mb-1.5">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#0D0D0D] border border-[#1F1F1F] rounded-sm px-3 py-2 text-[13px] text-[#E5E5E5] placeholder-[#444444] outline-none focus:border-[#333333] transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="rounded-sm border border-[#3F1818] bg-[#140B0B] px-3 py-2 text-[12px] text-[#F87171]">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#0D0D0D] border border-[#2A2A2A] hover:border-[#3A3A3A] hover:bg-[#141414] rounded-sm px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#D4D4D4] transition-colors disabled:opacity-50"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Report Form ──────────────────────────────────────────────

async function uploadToStorage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('report-images').upload(path, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('report-images').getPublicUrl(path);
  return publicUrl;
}

function ReportForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<WeeklyReport>;
  onSave: (data: { title: string; content: string; image_url: string | null; is_published: boolean }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.image_url ?? null);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setCoverUploading(true);
    try {
      const url = await uploadToStorage(file);
      setCoverUrl(url);
    } catch (err: any) {
      setUploadError(err.message ?? 'Görsel yüklenemedi. "report-images" bucket mevcut olmalı.');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  // Upload and insert image marker at cursor position in textarea
  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setInlineUploading(true);
    try {
      const url = await uploadToStorage(file);
      const marker = `\n![görsel](${url})\n`;
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart ?? content.length;
        const end = ta.selectionEnd ?? content.length;
        const newContent = content.slice(0, start) + marker + content.slice(end);
        setContent(newContent);
        // Restore focus and move cursor after inserted marker
        setTimeout(() => {
          ta.focus();
          const pos = start + marker.length;
          ta.setSelectionRange(pos, pos);
        }, 0);
      } else {
        setContent(prev => prev + marker);
      }
    } catch (err: any) {
      setUploadError(err.message ?? 'Görsel yüklenemedi. "report-images" bucket mevcut olmalı.');
    } finally {
      setInlineUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await onSave({ title: title.trim(), content: content.trim(), image_url: coverUrl, is_published: isPublished });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[#666666] mb-1.5">Başlık</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Haftalık Rapor Başlığı"
          className="w-full bg-[#0D0D0D] border border-[#1F1F1F] rounded-sm px-3 py-2.5 text-[13px] text-[#E5E5E5] placeholder-[#444444] outline-none focus:border-[#333333] transition-colors"
        />
      </div>

      {/* Content + inline image toolbar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#666666]">İçerik</label>
          <button
            type="button"
            onClick={() => inlineInputRef.current?.click()}
            disabled={inlineUploading}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-[#1F1F1F] rounded-sm text-[10px] text-[#666666] hover:text-[#A3A3A3] hover:border-[#2A2A2A] transition-colors disabled:opacity-40"
          >
            {inlineUploading ? (
              <span className="inline-block h-3 w-3 rounded-full border border-[#444444] border-t-[#888888] animate-spin" />
            ) : (
              <ImageIcon className="w-3 h-3" />
            )}
            {inlineUploading ? 'Yükleniyor...' : 'İçeriğe Görsel Ekle'}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={14}
          placeholder="Rapor içeriğini buraya yazın. Cursor'ı istediğiniz yere getirip 'İçeriğe Görsel Ekle' butonunu kullanın."
          className="w-full bg-[#0D0D0D] border border-[#1F1F1F] rounded-sm px-3 py-2.5 text-[13px] text-[#E5E5E5] placeholder-[#444444] outline-none focus:border-[#333333] transition-colors resize-y leading-relaxed font-mono"
        />
        <div className="mt-1 text-[10px] text-[#444444]">
          Görsel eklemek için cursor'ı istediğin yere getir, butona bas.
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[#666666] mb-1.5">Kapak Görseli (opsiyonel)</label>
        {coverUrl ? (
          <div className="relative group">
            <img src={coverUrl} alt="Kapak" className="w-full h-48 object-cover rounded-sm border border-[#1F1F1F]" />
            <button
              type="button"
              onClick={() => setCoverUrl(null)}
              className="absolute top-2 right-2 p-1.5 bg-[#0A0A0A] border border-[#333333] rounded-sm text-[#888888] hover:text-[#F87171] transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="w-full h-28 border border-dashed border-[#2A2A2A] hover:border-[#3A3A3A] rounded-sm flex flex-col items-center justify-center gap-2 text-[#555555] hover:text-[#888888] transition-colors disabled:opacity-50"
          >
            {coverUploading ? (
              <>
                <span className="inline-block h-5 w-5 rounded-full border-2 border-[#333333] border-t-[#666666] animate-spin" />
                <span className="text-[11px]">Yükleniyor...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-[11px] uppercase tracking-wider">Kapak Görseli Seç</span>
              </>
            )}
          </button>
        )}
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
        <input ref={inlineInputRef} type="file" accept="image/*" onChange={handleInlineUpload} className="hidden" />
        {uploadError && (
          <div className="mt-2 text-[11px] text-[#F87171] leading-relaxed">{uploadError}</div>
        )}
      </div>

      {/* Publish toggle */}
      <div className="flex items-center justify-between p-3 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D]">
        <div>
          <div className="text-[12px] text-[#D4D4D4] font-semibold">Yayınla</div>
          <div className="text-[11px] text-[#666666] mt-0.5">Aktif edilirse okuyucular görebilir</div>
        </div>
        <button
          type="button"
          onClick={() => setIsPublished(v => !v)}
          className={`h-6 w-11 rounded-full border px-1 transition-colors ${isPublished ? 'border-[#16351F] bg-[#102014]' : 'border-[#2A2A2A] bg-[#111111]'}`}
        >
          <div className={`h-4 w-4 rounded-full transition-transform mt-[1px] ${isPublished ? 'translate-x-5 bg-[#4ADE80]' : 'translate-x-0 bg-[#555555]'}`} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim() || !content.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#102014] border border-[#16351F] rounded-sm text-[12px] font-semibold text-[#4ADE80] hover:bg-[#142818] transition-colors disabled:opacity-40"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[#1F1F1F] rounded-sm text-[12px] text-[#888888] hover:text-[#D4D4D4] hover:border-[#2A2A2A] transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

// ─── Reports Section ──────────────────────────────────────────

function ReportsSection() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editing, setEditing] = useState<WeeklyReport | null>(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('weekly_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreate = async (data: { title: string; content: string; image_url: string | null; is_published: boolean }) => {
    const payload: Partial<WeeklyReport> = {
      ...data,
      published_at: data.is_published ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from('weekly_reports').insert(payload);
    if (!error) { showToast('Rapor oluşturuldu.'); await load(); setView('list'); }
  };

  const handleEdit = async (data: { title: string; content: string; image_url: string | null; is_published: boolean }) => {
    if (!editing) return;
    const wasPublished = editing.is_published;
    const payload: Partial<WeeklyReport> = {
      ...data,
      published_at: data.is_published && !wasPublished ? new Date().toISOString() : editing.published_at,
    };
    const { error } = await supabase.from('weekly_reports').update(payload).eq('id', editing.id);
    if (!error) { showToast('Rapor güncellendi.'); await load(); setView('list'); setEditing(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;
    await supabase.from('weekly_reports').delete().eq('id', id);
    showToast('Rapor silindi.');
    await load();
  };

  const handleTogglePublish = async (report: WeeklyReport) => {
    const now = new Date().toISOString();
    await supabase.from('weekly_reports').update({
      is_published: !report.is_published,
      published_at: !report.is_published ? now : report.published_at,
    }).eq('id', report.id);
    await load();
  };

  if (view === 'new') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <button type="button" onClick={() => setView('list')} className="text-[#555555] hover:text-[#D4D4D4] transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#D4D4D4]">Yeni Rapor</h2>
        </div>
        <ReportForm onSave={handleCreate} onCancel={() => setView('list')} />
      </div>
    );
  }

  if (view === 'edit' && editing) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <button type="button" onClick={() => { setView('list'); setEditing(null); }} className="text-[#555555] hover:text-[#D4D4D4] transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#D4D4D4]">Raporu Düzenle</h2>
        </div>
        <ReportForm initial={editing} onSave={handleEdit} onCancel={() => { setView('list'); setEditing(null); }} />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-[#16351F] bg-[#0A1A0A] px-3 py-2 text-[12px] text-[#4ADE80]">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#D4D4D4]">Haftalık Raporlar</h2>
        <button
          type="button"
          onClick={() => setView('new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D0D0D] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-sm text-[11px] font-semibold uppercase tracking-wider text-[#A3A3A3] hover:text-[#E5E5E5] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Yeni Rapor
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-[#555555] font-mono text-[12px] gap-2">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-[#333333] border-t-[#666666] animate-spin" />
          Yükleniyor...
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="rounded-sm border border-dashed border-[#1F1F1F] py-12 text-center">
          <BookOpen className="w-7 h-7 text-[#2A2A2A] mx-auto mb-2" />
          <div className="text-[12px] text-[#555555] font-mono">Henüz rapor yok.</div>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-2">
          {reports.map(report => (
            <div key={report.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="flex items-start gap-3">
                {report.image_url && (
                  <img src={report.image_url} alt="" className="w-16 h-16 object-cover rounded-sm shrink-0 border border-[#1F1F1F]" />
                )}
                {!report.image_url && (
                  <div className="w-16 h-16 rounded-sm border border-[#1A1A1A] bg-[#111111] flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-[#2A2A2A]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] uppercase tracking-wider font-semibold border ${report.is_published ? 'border-[#16351F] bg-[#0A1A0A] text-[#4ADE80]' : 'border-[#2A2A2A] bg-[#111111] text-[#555555]'}`}>
                      {report.is_published ? 'Yayında' : 'Taslak'}
                    </span>
                    <span className="text-[10px] text-[#444444] font-mono">{formatDate(report.created_at)}</span>
                  </div>
                  <div className="text-[13px] font-semibold text-[#D4D4D4] truncate">{report.title}</div>
                  <div className="text-[11px] text-[#666666] mt-0.5 line-clamp-1">{report.content}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title={report.is_published ? 'Yayından Kaldır' : 'Yayınla'}
                    onClick={() => handleTogglePublish(report)}
                    className="p-1.5 border border-[#1F1F1F] rounded-sm text-[#666666] hover:text-[#4ADE80] hover:border-[#16351F] transition-colors"
                  >
                    {report.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(report); setView('edit'); }}
                    className="p-1.5 border border-[#1F1F1F] rounded-sm text-[#666666] hover:text-[#A3A3A3] hover:border-[#2A2A2A] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(report.id)}
                    className="p-1.5 border border-[#1F1F1F] rounded-sm text-[#666666] hover:text-[#F87171] hover:border-[#3F1818] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Operations Section (Cooldown) ────────────────────────────

function OperationsSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [log, setLog] = useState<{ id: string; text: string; ok: boolean }[]>([]);

  const addLog = (id: string, text: string, ok = true) => {
    setLog(prev => [{ id: `${Date.now()}`, text, ok }, ...prev].slice(0, 30));
  };

  useEffect(() => {
    supabase.from('categories').select('id, name').order('created_at', { ascending: true }).then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const cryptoCategory = categories.find(category => category.id === CRYPTO_CATEGORY_ID);
  const predictionCategory = categories.find(category => category.id === PREDICTION_CATEGORY_ID);
  const remainingCategories = categories.filter(
    category => category.id !== CRYPTO_CATEGORY_ID && category.id !== PREDICTION_CATEGORY_ID,
  );

  const entries = [
    { id: 'home', name: 'HOME (Tüm Sistem)' },
    ...(cryptoCategory ? [cryptoCategory] : []),
    ...(predictionCategory ? [predictionCategory] : []),
    ...remainingCategories,
  ];

  const handleSync = async (targetId: string) => {
    setIsSyncing(true);
    setActiveTarget(targetId);
    try {
      const { data: metrics } = targetId === 'home'
        ? await supabase.from('metrics').select('*')
        : await supabase.from('metrics').select('*').eq('category_id', targetId);

      if (!metrics?.length) throw new Error('Metrik bulunamadı.');

      const CONCURRENCY = 6;
      for (let i = 0; i < metrics.length; i += CONCURRENCY) {
        await Promise.all(metrics.slice(i, i + CONCURRENCY).map(m => syncMetric(m).catch(() => null)));
      }
      await runScoringEngine(targetId === 'home' ? undefined : targetId);
      await runAlertEngine(targetId === 'home' ? undefined : targetId);
      addLog(targetId, `${targetId === 'home' ? 'Sistem' : categories.find(c => c.id === targetId)?.name ?? targetId} senkronizasyonu tamamlandı.`);
    } catch (e: any) {
      addLog(targetId, `Hata: ${e.message}`, false);
    } finally {
      setIsSyncing(false);
      setActiveTarget(null);
    }
  };

  const handleAi = async (targetId: string) => {
    setIsGeneratingAi(true);
    setActiveTarget(targetId);
    try {
      if (targetId === 'home') {
        await generateMarketOverview();
      } else {
        await generateCategoryInsight(targetId);
      }
      addLog(targetId, `${targetId === 'home' ? 'Genel piyasa' : categories.find(c => c.id === targetId)?.name ?? targetId} AI yorumu üretildi.`);
    } catch (e: any) {
      addLog(targetId, `Hata: ${e.message}`, false);
    } finally {
      setIsGeneratingAi(false);
      setActiveTarget(null);
    }
  };

  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#D4D4D4] mb-4">
        Operasyon Merkezi
      </h2>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {entries.map(entry => (
          <div key={entry.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#555555] mb-0.5">
                  {entry.id === 'home' ? 'Genel Sistem' : 'Kategori'}
                </div>
                <div className="text-[13px] font-semibold text-[#D4D4D4]">{entry.name}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAi(entry.id)}
                  disabled={isGeneratingAi || isSyncing}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#141414] rounded-sm text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  <Activity className={`w-3 h-3 ${isGeneratingAi && activeTarget === entry.id ? 'animate-pulse text-[#4ADE80]' : ''}`} />
                  {isGeneratingAi && activeTarget === entry.id ? 'AI...' : 'AI Yorumu'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSync(entry.id)}
                  disabled={isSyncing || isGeneratingAi}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#141414] rounded-sm text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing && activeTarget === entry.id ? 'animate-spin text-[#FBBF24]' : ''}`} />
                  {isSyncing && activeTarget === entry.id ? 'İşleniyor...' : (entry.id === 'home' ? 'Tümünü Çalıştır' : 'Çalıştır')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="rounded-sm border border-[#1A1A1A] bg-[#0A0A0A] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#555555] mb-2">İşlem Günlüğü</div>
          <div className="space-y-1 max-h-40 overflow-y-auto font-mono text-[11px]">
            {log.map(entry => (
              <div key={entry.id} className={entry.ok ? 'text-[#4ADE80]' : 'text-[#F87171]'}>
                {entry.ok ? '✓' : '✗'} {entry.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users Placeholder ────────────────────────────────────────

function UsersSection() {
  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#D4D4D4] mb-4">Kullanıcı Yönetimi</h2>
      <div className="rounded-sm border border-dashed border-[#1F1F1F] py-14 text-center">
        <Users className="w-8 h-8 text-[#2A2A2A] mx-auto mb-3" />
        <div className="text-[12px] text-[#555555] font-mono mb-1">Kullanıcı yönetimi yakında</div>
        <div className="text-[11px] text-[#3A3A3A] font-mono">Supabase Dashboard üzerinden yönetilebilir.</div>
      </div>
    </div>
  );
}

// ─── System Placeholder ───────────────────────────────────────

function SystemSection() {
  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#D4D4D4] mb-4">Sistem</h2>
      <div className="grid grid-cols-1 gap-3">
        {[
          { label: 'Veritabanı', desc: 'Supabase PostgreSQL', status: 'Aktif', ok: true },
          { label: 'Auth', desc: 'Supabase Auth', status: 'Aktif', ok: true },
          { label: 'Storage', desc: 'report-images bucket', status: 'Manuel kurulum gerekiyor', ok: false },
          { label: 'AI Worker', desc: 'Gemini API entegrasyonu', status: 'Aktif', ok: true },
          { label: 'Abonelik Sistemi', desc: 'Kullanıcı planları ve kısıtlamalar', status: 'Yakında', ok: false },
          { label: 'API Güvenliği', desc: 'Rate limiting ve RLS politikaları', status: 'Kısmi', ok: false },
        ].map(item => (
          <div key={item.label} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[12px] font-semibold text-[#D4D4D4]">{item.label}</div>
              <div className="text-[11px] text-[#666666] mt-0.5">{item.desc}</div>
            </div>
            <span className={`shrink-0 px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider font-semibold border ${item.ok ? 'border-[#16351F] bg-[#0A1A0A] text-[#4ADE80]' : 'border-[#2A2A2A] bg-[#111111] text-[#555555]'}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────

function OverviewSection({ onNavigate }: { onNavigate: (s: AdminSection) => void }) {
  const [reportCount, setReportCount] = useState<{ total: number; published: number } | null>(null);

  useEffect(() => {
    supabase.from('weekly_reports').select('is_published').then(({ data }) => {
      if (data) {
        setReportCount({
          total: data.length,
          published: data.filter(r => r.is_published).length,
        });
      }
    });
  }, []);

  const cards = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Toplam Rapor',
      value: reportCount?.total ?? '—',
      sub: `${reportCount?.published ?? '—'} yayında`,
      section: 'reports' as AdminSection,
      color: '#4ADE80',
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      label: 'Operasyon',
      value: 'Hazır',
      sub: 'Senkronizasyon & AI',
      section: 'operations' as AdminSection,
      color: '#FBBF24',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Kullanıcılar',
      value: '—',
      sub: 'Yakında',
      section: 'users' as AdminSection,
      color: '#60A5FA',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Sistem',
      value: 'Kısmi',
      sub: 'Kurulum gerekiyor',
      section: 'system' as AdminSection,
      color: '#A78BFA',
    },
  ];

  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#D4D4D4] mb-4">Genel Bakış</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map(card => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate(card.section)}
            className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] hover:bg-[#111111] p-4 text-left transition-colors"
          >
            <div style={{ color: card.color }} className="mb-2">{card.icon}</div>
            <div className="text-[11px] uppercase tracking-wider text-[#666666] mb-1">{card.label}</div>
            <div className="text-[20px] font-bold font-mono text-[#D4D4D4]">{String(card.value)}</div>
            <div className="text-[10px] text-[#555555] mt-0.5">{card.sub}</div>
          </button>
        ))}
      </div>

      <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-4">
        <div className="text-[10px] uppercase tracking-wider text-[#555555] mb-3">Yol Haritası</div>
        <div className="space-y-2">
          {[
            { label: 'Haftalık Rapor yönetimi', done: true },
            { label: 'Admin auth sistemi', done: true },
            { label: 'Operasyon merkezi (Cooldown)', done: true },
            { label: 'Supabase Storage (report-images bucket)', done: false },
            { label: 'Kullanıcı abonelik sistemi', done: false },
            { label: 'Push/email bildirimler', done: false },
            { label: 'Kategori & metrik yönetimi', done: false },
            { label: 'İçerik takvimi & zamanlama', done: false },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2.5 text-[12px]">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.done ? 'bg-[#4ADE80]' : 'bg-[#2A2A2A]'}`} />
              <span className={item.done ? 'text-[#888888]' : 'text-[#555555]'}>{item.label}</span>
              {item.done && <span className="ml-auto text-[10px] text-[#4ADE80] font-mono">Tamamlandı</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Genel Bakış',   icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'reports',     label: 'Haftalık Rapor', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'operations',  label: 'Operasyon',      icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'users',       label: 'Kullanıcılar',   icon: <Users className="w-4 h-4" /> },
  { id: 'system',      label: 'Sistem',         icon: <Settings className="w-4 h-4" /> },
];

export function AdminPanel() {
  const { user, isAdmin, loading, signIn, signOut } = useAuth();
  const [section, setSection] = useState<AdminSection>('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#555555] font-mono text-[13px]">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-[#333333] border-t-[#666666] animate-spin" />
          Yükleniyor...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={signIn} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-sm border border-[#3F1818] bg-[#140B0B] p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#F87171] mx-auto mb-3" />
          <div className="text-[13px] font-semibold text-[#F87171] mb-2">Erişim Reddedildi</div>
          <div className="text-[12px] text-[#888888] mb-4">Bu hesabın admin yetkisi yok.</div>
          <button
            type="button"
            onClick={signOut}
            className="px-4 py-2 border border-[#2A2A2A] rounded-sm text-[12px] text-[#888888] hover:text-[#D4D4D4] transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 border-r border-[#1F1F1F] flex flex-col">
        {/* Logo */}
        <div className="px-4 h-[44px] border-b border-[#1F1F1F] flex items-center gap-2 shrink-0">
          <Hexagon className="w-4 h-4 text-[#A3A3A3]" />
          <span className="font-semibold tracking-wide text-[12px] uppercase">Mergen Admin</span>
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[#555555] uppercase tracking-wider">Panel</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-left transition-colors ${
                section === item.id
                  ? 'bg-[#141414] text-[#E5E5E5]'
                  : 'text-[#888888] hover:text-[#D4D4D4] hover:bg-[#0D0D0D]'
              }`}
            >
              <span className={section === item.id ? 'text-[#A3A3A3]' : 'text-[#555555]'}>
                {item.icon}
              </span>
              {item.label}
              {section === item.id && <ChevronRight className="w-3 h-3 ml-auto text-[#444444]" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#1F1F1F] shrink-0">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-2 h-2 rounded-full bg-[#4ADE80] shrink-0" />
            <span className="text-[11px] text-[#888888] truncate">{user.email}</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-sm border border-[#1F1F1F] text-[11px] text-[#666666] hover:text-[#F87171] hover:border-[#3F1818] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {section === 'overview'   && <OverviewSection onNavigate={setSection} />}
          {section === 'reports'    && <ReportsSection />}
          {section === 'operations' && <OperationsSection />}
          {section === 'users'      && <UsersSection />}
          {section === 'system'     && <SystemSection />}
        </div>
      </main>
    </div>
  );
}
