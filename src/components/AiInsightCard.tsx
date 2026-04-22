import React from 'react';

type AiInsightCardProps = {
  title: string;
  insight: string | null;
  simpleSummary?: string | null;
  confidence?: number | null;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
};

export function AiInsightCard({
  title,
  insight,
  simpleSummary = null,
  confidence = null,
  loading = false,
  loadingText,
  emptyText,
}: AiInsightCardProps) {
  return (
    <div className="premium-accent-panel relative rounded-sm border border-[#1A3A1A] bg-[#0A1A0A] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-[#4ADE80]" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#4ADE80]">{title}</span>
          {confidence !== null && (
            <span className="ml-auto text-[10px] font-mono text-[#4A8A4A] border border-[#1A3A1A] px-2 py-0.5 rounded-sm">
              güven {confidence}/5
            </span>
          )}
        </div>
        {loading && !insight ? (
          <div className="flex items-center gap-3 text-[13px] text-[#7FB08A]">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-[#245A2E] border-t-[#4ADE80] animate-spin shrink-0" />
            <span className="leading-relaxed">
              {loadingText ?? `${title} yükleniyor. Özet hazırlanıyor...`}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-[#B0B0B0] leading-relaxed">
              {insight ?? emptyText ?? 'Bu alan için henüz yorum oluşmadı. Veri akışı tamamlandığında özet burada görünecek.'}
            </p>
            {simpleSummary && (
              <div className="pt-4 border-t border-[#1A3A1A]">
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#4ADE80] mb-2">
                  Sadeleştirilmiş kısa özet:
                </div>
                <div className="text-[13px] text-[#8FC79C] leading-relaxed">
                  {simpleSummary}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
