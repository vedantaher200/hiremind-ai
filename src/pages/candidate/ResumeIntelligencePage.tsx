import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  History, 
  ArrowUpRight, 
  Check, 
  Plus, 
  Download, 
  RefreshCw,
  Zap,
  Target
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { analyzeResumeContent } from '../../lib/aiService';
import { CircularScore } from '../../components/common/CircularScore';
import { Modal } from '../../components/common/Modal';

export const ResumeIntelligencePage: React.FC = () => {
  const { latestResume, resumeAnalyses, saveResumeAnalysis, jobs } = useData();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentReport = latestResume || resumeAnalyses[0];

  const handleFileUpload = async (file: File) => {
    setError(null);
    if (!user) return setError('Please sign in before uploading a resume.');
    if (file.size > 15 * 1024 * 1024) return setError('Resume files must be 15MB or smaller.');
    if (!/\.(txt|pdf|doc|docx)$/i.test(file.name)) return setError('Upload a PDF, DOC, DOCX, or TXT resume.');
    setIsAnalyzing(true);
    try {
      let extractedText = '';

if (file.type.includes('text') || file.name.toLowerCase().endsWith('.txt')) {
  extractedText = await file.text();
} else if (file.name.toLowerCase().endsWith('.pdf')) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    extractedText += textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ') + '\n';
  }
} else {
  throw new Error('DOC and DOCX are not supported yet. Please upload PDF or TXT.');
}

      const targetJob = jobs.find(job => job.status === 'Active');
      if (!targetJob) throw new Error('No active job is available. A job with required skills is needed for ATS matching.');
      const result = await analyzeResumeContent(extractedText, file.name, targetJob.title, targetJob.requiredSkills, user.id);
      await saveResumeAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">Resume Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#3525CD] border border-indigo-100">
              AI Precision v2.4
            </span>
          </div>
          <p className="mt-1 text-sm text-[#464555] leading-relaxed max-w-3xl">
            Upload a resume to instantly extract insights, score ATS compatibility, and identify skill gaps using our precision AI model.
          </p>
        </div>

        {/* Top Right: History button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="px-4 py-2.5 bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold rounded-xl shadow-xs hover:bg-[#F8F9FA] transition-all flex items-center gap-2 cursor-pointer self-start"
        >
          <History className="w-4 h-4 text-[#3525CD]" />
          <span>Upload History ({resumeAnalyses.length})</span>
        </button>
      </div>
      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">{error}</div>}

      {/* Large Drag and Drop Upload Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`bg-white rounded-3xl p-8 border-2 border-dashed transition-all text-center ${
          isDragging 
            ? 'border-[#3525CD] bg-indigo-50/50' 
            : 'border-[#D1D5DB] hover:border-indigo-300'
        } shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] relative`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={onFileChange}
          className="hidden"
        />

        {isAnalyzing ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#3525CD] animate-bounce">
              <Sparkles className="w-8 h-8 text-[#712AE2]" />
            </div>
            <h3 className="text-lg font-bold text-[#191C1D]">
              Analyzing Resume with HireMind Intelligence...
            </h3>
            <p className="text-xs text-[#737380] max-w-sm">
              Extracting technical competencies, evaluating semantic keywords, and measuring ATS compatibility against job benchmarks.
            </p>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-[#3525CD]">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#191C1D]">
                Drag & Drop Resume Here
              </h3>
              <p className="text-xs text-[#737380] mt-1">
                Supported formats: <strong className="text-[#191C1D]">PDF</strong>, DOCX, TXT (Max 15MB)
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-6 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-sm hover:bg-[#115E59] active:bg-[#0B4F4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] transition-colors cursor-pointer"
            >
              Choose File
            </button>

            {currentReport && (
              <div className="pt-2 flex items-center gap-3 text-xs text-[#737380]">
                <FileText className="w-3.5 h-3.5 text-[#3525CD]" />
                <span>Current: <strong>{currentReport.fileName}</strong> ({currentReport.fileSize})</span>
                <span>•</span>
                <span>Uploaded {new Date(currentReport.uploadedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI ANALYSIS REPORT SECTION */}
      {currentReport && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#712AE2]" />
              <h2 className="text-xl font-extrabold text-[#191C1D] tracking-tight">
                AI Analysis Report
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#737380]">
              Target Role: <strong className="text-[#191C1D]">{currentReport.targetRole || 'AI Developer'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT SCORE CARD: AI COMPATIBILITY 92% */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.06)] flex flex-col items-center justify-center text-center space-y-4">
              <div className="px-3 py-1 bg-indigo-50 text-[#3525CD] rounded-full text-xs font-bold uppercase tracking-wider">
                AI Compatibility
              </div>

              {/* Circular Score: 92% */}
              <div className="py-2">
                <CircularScore 
                  score={currentReport.atsCompatibilityScore} 
                  size={150} 
                  strokeWidth={12} 
                  label="Match" 
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#191C1D]">Requirement Match</h4>
                <p className="text-xs text-[#737380] leading-relaxed max-w-xs">
                  {currentReport.source === 'ai' ? 'Generated from the configured AI provider and the uploaded resume.' : 'Calculated from explicit job requirements found in the uploaded text.'}
                </p>
              </div>
            </div>

            {/* RIGHT SKILLS & HIGHLIGHTS */}
            <div className="lg:col-span-8 space-y-6">
              {/* Extracted Skills */}
              <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
                <h3 className="text-sm font-bold text-[#191C1D] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Extracted Core Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentReport.extractedSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs font-semibold text-[#3525CD]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths & Missing Skills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 shadow-xs">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Key Candidate Strengths
                  </h4>
                  <ul className="space-y-2 text-xs text-[#464555]">
                    {currentReport.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Skills */}
                <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/20 shadow-xs">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Recommended Missing Skills
                  </h4>
                  <ul className="space-y-2 text-xs text-[#464555]">
                    {currentReport.missingSkills.map((sk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{sk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* STRUCTURED SUMMARIES: Experience, Education, Improvement Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Experience Summary */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <h4 className="text-xs font-bold text-[#737380] uppercase tracking-wider mb-3">
                Experience Summary
              </h4>
              <p className="text-xs text-[#191C1D] leading-relaxed">
                {currentReport.experienceSummary}
              </p>
            </div>

            {/* Education Summary */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <h4 className="text-xs font-bold text-[#737380] uppercase tracking-wider mb-3">
                Education Summary
              </h4>
              <p className="text-xs text-[#191C1D] leading-relaxed">
                {currentReport.educationSummary}
              </p>
            </div>

            {/* Improvement Suggestions */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <h4 className="text-xs font-bold text-[#3525CD] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Improvement Suggestions
              </h4>
              <ul className="space-y-2 text-xs text-[#464555]">
                {currentReport.improvementSuggestions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#712AE2] mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Resume Screening History"
        maxWidth="xl"
      >
        <div className="divide-y divide-gray-100">
          {resumeAnalyses.map((report) => (
            <div key={report.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#3525CD] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#191C1D]">{report.fileName}</p>
                  <p className="text-[11px] text-[#737380]">
                    {new Date(report.uploadedAt).toLocaleString()} • {report.targetRole}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-[#3525CD] px-2.5 py-1 bg-indigo-50 rounded-lg">
                  {report.atsCompatibilityScore}% Match
                </span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
