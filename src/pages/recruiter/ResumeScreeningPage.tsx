import React from 'react';
import {
  FileText,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';

interface ResumeScreeningPageProps {
  onNavigate?: (page: string) => void;
}

export const ResumeScreeningPage: React.FC<ResumeScreeningPageProps> = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#737380]">
            AI Recruitment
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-[#191C1D]">
            Resume Screening
          </h1>

          <p className="mt-1 text-sm text-[#737380]">
            Analyze candidate resumes and identify the best matches using AI-powered insights.
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2.5 rounded-xl bg-[#3525CD] text-white text-xs font-bold hover:bg-[#281BA8] transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Resume
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#737380]">Resumes Screened</p>
              <p className="mt-2 text-2xl font-extrabold text-[#191C1D]">
                0
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#3525CD]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#737380]">Strong Matches</p>
              <p className="mt-2 text-2xl font-extrabold text-[#191C1D]">
                0
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#737380]">Candidates</p>
              <p className="mt-2 text-2xl font-extrabold text-[#191C1D]">
                0
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#712AE2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Screening Area */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#712AE2]" />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#191C1D]">
              AI Resume Analysis
            </h2>

            <p className="text-xs text-[#737380] mt-0.5">
              Upload a resume to start AI-powered candidate screening.
            </p>
          </div>
        </div>

        <div className="mt-6 border-2 border-dashed border-[#E5E7EB] rounded-2xl p-10 text-center bg-[#F8F9FA]">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
            <Upload className="w-6 h-6 text-[#3525CD]" />
          </div>

          <h3 className="mt-4 text-sm font-bold text-[#191C1D]">
            Upload Candidate Resume
          </h3>

          <p className="mt-2 text-xs text-[#737380] max-w-md mx-auto">
            Resume screening results will appear here after a candidate resume
            is uploaded and analyzed.
          </p>

          <button
            type="button"
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#3525CD] text-white text-xs font-bold hover:bg-[#281BA8] transition-colors"
          >
            Select Resume
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <AlertCircle className="w-5 h-5 text-[#3525CD]" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#191C1D]">
              Smart Screening Insights
            </h3>

            <p className="mt-1 text-xs text-[#464555] leading-relaxed">
              AI screening can help evaluate skills, experience, keywords and
              job relevance to support your candidate selection process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};