import React, { useState, useRef, useEffect } from 'react';
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
  Target,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CircularScore } from '../../components/common/CircularScore';
import { Modal } from '../../components/common/Modal';
import { api } from '../../lib/api';
import { JobMatchItem, ResumeAnalysis } from '../../types';

export const ResumeIntelligencePage: React.FC = () => {
  const { latestResume, resumeAnalyses, saveResumeAnalysis, jobs, applyForJob } = useData();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [matches, setMatches] = useState<JobMatchItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentReport = latestResume || resumeAnalyses[0];

  const fetchMatches = async () => {
    if (!user) return;
    setLoadingMatches(true);
    try {
      const res = await api.resumes.matchAll().catch(() => null);
      if (res && Array.isArray(res.matches)) {
        setMatches(res.matches);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (currentReport) {
      void fetchMatches();
    }
  }, [currentReport?.id]);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setSuccessMsg(null);
    if (!user) return setError('Please sign in before uploading a resume.');
    if (file.size > 15 * 1024 * 1024) return setError('Resume files must be 15MB or smaller.');
    if (!/\.(txt|pdf|doc|docx)$/i.test(file.name)) return setError('Upload a PDF, DOC, DOCX, or TXT resume.');
    
    setIsAnalyzing(true);
    try {
      // 1. Permanently upload the actual resume file to the backend
      const uploadRes = await api.resumes.upload(file);
      const resumeId = uploadRes.resumeId;
      let extractedText = uploadRes.extractedText || '';

      // Client-side text extraction fallback if backend text is short
      if (!extractedText || extractedText.length < 50) {
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
        }
      }

      // 2. Target role
      const targetJob = jobs.find(job => job.status === 'Active');
      const targetRole = targetJob?.title || 'Software Developer';

      // 3. Run AI resume analysis on the backend (Gemini)
      const analyzeRes = await api.resumes.analyze({
        resumeId,
        resumeText: extractedText,
        targetRole
      });

      const a = analyzeRes.analysis;
      const formattedAnalysis: ResumeAnalysis = {
        id: a.id,
        candidateId: user.id,
        fileName: file.name,
        uploadedAt: a.createdAt || new Date().toISOString(),
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        atsCompatibilityScore: Math.round(a.atsScore || 75),
        extractedSkills: a.extractedSkills || [],
        strengths: a.strengths || [],
        missingSkills: a.missingSkills || [],
        experienceSummary: a.experienceSummary || '',
        educationSummary: a.educationSummary || '',
        improvementSuggestions: a.improvementSuggestions || [],
        targetRole,
        source: 'ai'
      };

      await saveResumeAnalysis(formattedAnalysis);
      setSuccessMsg(`Resume successfully uploaded and evaluated! ATS Compatibility: ${formattedAnalysis.atsCompatibilityScore}%`);
      
      // 4. Update multi-posting match results
      await fetchMatches();
    } catch (err: any) {
      console.error('Upload & analysis error:', err);
      setError(err?.message || 'Resume upload and analysis failed.');
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
      void handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void handleFileUpload(e.target.files[0]);
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
            Upload your resume to store it permanently, extract technical competencies, score ATS compatibility, and automatically match across all active jobs and internships.
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
      {successMsg && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">{successMsg}</div>}

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
              Storing file permanently, extracting technical competencies, evaluating semantic keywords, and measuring ATS compatibility against job benchmarks.
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
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-[#737380]">
                <FileText className="w-3.5 h-3.5 text-[#3525CD]" />
                <span>Current: <strong>{currentReport.fileName}</strong> ({currentReport.fileSize})</span>
                <span>•</span>
                <span>Uploaded {new Date(currentReport.uploadedAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Stored in PostgreSQL
                </span>
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
              Target Role: <strong className="text-[#191C1D]">{currentReport.targetRole || 'Software Developer'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ATS Score Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] flex flex-col items-center justify-center text-center">
              <CircularScore score={currentReport.atsCompatibilityScore} size={130} strokeWidth={10} />
              <h3 className="mt-4 text-sm font-bold text-[#191C1D]">
                ATS Compatibility Score
              </h3>
              <p className="text-xs text-[#737380] mt-1 max-w-[200px]">
                Calculated using semantic matching against active industry role benchmarks.
              </p>
            </div>

            {/* Extracted Skills */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-3">
              <h3 className="text-xs font-bold text-[#737380] uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Extracted Skills ({currentReport.extractedSkills.length})</span>
              </h3>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {currentReport.extractedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-[#3525CD] border border-indigo-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills / Gaps */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-3">
              <h3 className="text-xs font-bold text-[#737380] uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Recommended Skill Additions ({currentReport.missingSkills.length})</span>
              </h3>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {currentReport.missingSkills.length > 0 ? (
                  currentReport.missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-[#737380] italic">No critical skill gaps identified.</p>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Experience Summary */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <h4 className="text-xs font-bold text-[#737380] uppercase tracking-wider mb-3">
                Experience Summary
              </h4>
              <p className="text-xs text-[#191C1D] leading-relaxed">
                {currentReport.experienceSummary || 'Candidate has software development background.'}
              </p>
            </div>

            {/* Education Summary */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <h4 className="text-xs font-bold text-[#737380] uppercase tracking-wider mb-3">
                Education Summary
              </h4>
              <p className="text-xs text-[#191C1D] leading-relaxed">
                {currentReport.educationSummary || 'Computer Science or relevant Engineering background.'}
              </p>
            </div>

            {/* Improvement Suggestions */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <h4 className="text-xs font-bold text-[#3525CD] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Improvement Suggestions
              </h4>
              <ul className="space-y-2 text-xs text-[#464555]">
                {(currentReport.improvementSuggestions.length > 0 ? currentReport.improvementSuggestions : [
                  'Add quantifiable metrics to recent project descriptions.',
                  'Highlight system design and CI/CD experience.'
                ]).map((item, idx) => (
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

      {/* MULTI-POSTING MATCHING SECTION (JOBS & INTERNSHIPS) */}
      {currentReport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#3525CD]" />
              <h2 className="text-xl font-extrabold text-[#191C1D] tracking-tight">
                Resume-to-Opportunities Matching Engine
              </h2>
            </div>
            <span className="text-xs font-bold text-[#737380]">
              Evaluated against {matches.length} active postings
            </span>
          </div>

          {loadingMatches ? (
            <div className="p-8 text-center text-xs font-semibold text-[#737380] bg-white rounded-2xl border border-[#E5E7EB]">
              Computing semantic matching across active jobs & internships...
            </div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#D1D5DB] text-[#737380] text-xs">
              No active postings found for comparison. Once recruiters publish jobs or internships, match scores will appear automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          item.type === 'JOB'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}
                      >
                        {item.type === 'JOB' ? 'Job' : 'Internship'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#3525CD]">
                          {item.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-extrabold text-[#191C1D] mt-2 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#737380] flex items-center gap-1 mt-0.5">
                      <span>{item.company}</span>
                      <span>•</span>
                      <span>{item.location}</span>
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-gray-100 mt-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.matchScore >= 85
                            ? 'bg-emerald-500'
                            : item.matchScore >= 70
                            ? 'bg-[#3525CD]'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.matchScore}%` }}
                      />
                    </div>

                    {/* Required Skills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {item.requiredSkills.slice(0, 3).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded-md bg-[#F8F9FA] text-[10px] font-medium text-[#464555] border border-gray-100"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
