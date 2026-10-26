import React, { useState, useRef, useEffect } from 'react';
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
import { JobMatchItem } from '../../types';

export const ResumeIntelligencePage: React.FC = () => {
  const { latestResume, resumeAnalyses, jobs, applyForJob, refreshData, resumeLoadError } = useData();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [matches, setMatches] = useState<JobMatchItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
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
    if (currentReport && currentReport.source !== 'legacy') {
      void fetchMatches();
    }
  }, [currentReport?.id, currentReport?.source]);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setSuccessMsg(null);
    if (!user) return setError('Please sign in before uploading a resume.');
    if (file.size > 10 * 1024 * 1024) return setError('Resume files must be 10MB or smaller.');
    if (!/\.(txt|pdf)$/i.test(file.name)) return setError('Upload a PDF or plain text resume.');
    
    setIsAnalyzing(true);
    try {
      // 1. Permanently upload the actual resume file to the backend
      const uploadRes = await api.resumes.upload(file);
      const resumeId = uploadRes.resumeId;
      const analyzeRes = await api.resumes.analyze({ resumeId });
      await refreshData();
      setSuccessMsg(`Resume evidence analysis saved. Score: ${Math.round(analyzeRes.analysis.atsScore)}%.`);
      
      // 4. Update multi-posting match results
      await fetchMatches();
    } catch (err: any) {
      console.error('Upload & analysis error:', err);
      setError(err?.message || 'Resume upload and analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReanalyze = async () => {
    if (!currentReport?.resumeId) return setError('No stored resume is available to re-analyze.');
    setError(null); setSuccessMsg(null); setIsReanalyzing(true);
    try {
      const result = await api.resumes.analyze({ resumeId: currentReport.resumeId });
      await refreshData();
      setSuccessMsg(`Current deterministic analysis saved. Resume evidence score: ${Math.round(result.analysis.atsScore)}%.`);
    } catch (err: any) {
      setError(err?.message || 'Resume re-analysis failed.');
    } finally { setIsReanalyzing(false); }
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
            Upload your resume to store it permanently, extract technical competencies, calculate a transparent resume evidence score, and compare supported skills with active jobs and internships.
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
      {resumeLoadError && <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">Unable to load the saved resume analysis: {resumeLoadError}</div>}
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
          accept=".pdf,.txt"
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
              Storing the file, extracting readable text, and calculating a deterministic resume evidence completeness score.
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
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#712AE2]" />
              <h2 className="text-xl font-extrabold text-[#191C1D] tracking-tight">
                Resume Evidence Analysis
              </h2>
            </div>
            {currentReport.source === 'legacy'
              ? <button type="button" onClick={() => void handleReanalyze()} disabled={isReanalyzing} className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{isReanalyzing ? 'Re-analyzing…' : 'Re-analyze stored resume'}</button>
              : <span className="text-xs font-semibold text-[#737380]">Deterministic scoring rules v1</span>}
          </div>

          {currentReport.source === 'legacy' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This saved result used the previous fallback scorer, which could invent skills and summaries. Its score and extracted details are not presented as verified. Re-analyze the stored resume to preserve this historical record and create a current evidence-based result.</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ATS Score Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] flex flex-col items-center justify-center text-center">
              {currentReport.source === 'legacy' ? <p className="text-sm font-bold text-amber-800">Score not verified</p> : <>
                <CircularScore score={currentReport.atsCompatibilityScore} size={130} strokeWidth={10} />
                <h3 className="mt-4 text-sm font-bold text-[#191C1D]">Resume Evidence Completeness</h3>
                <p className="text-xs text-[#737380] mt-1">Not a job-match score or hiring probability.</p>
                <div className="mt-4 w-full space-y-1 text-left text-xs text-slate-600">
                  <p>Skills: {currentReport.skillsMatchPercentage ?? 0}% × 50%</p>
                  <p>Experience evidence: {currentReport.experienceMatchPercentage ?? 0}% × 30%</p>
                  <p>Education evidence: {currentReport.educationMatchPercentage ?? 0}% × 20%</p>
                </div>
              </>}
            </div>

            {/* Extracted Skills */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-3">
              <h3 className="text-xs font-bold text-[#737380] uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Extracted Skills ({currentReport.extractedSkills.length})</span>
              </h3>
              {currentReport.source === 'legacy' ? <p className="text-xs text-amber-800">Old skill extraction is unverified. Re-analyze to inspect supported skills.</p> : <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {currentReport.extractedSkills.map((skill, idx) => (
                  <details key={idx} className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs text-[#3525CD]"><summary className="cursor-pointer font-semibold">{skill}</summary><p className="mt-2 max-w-md text-slate-700">{currentReport.skillEvidence?.find(evidence => evidence.skill === skill)?.excerpt || 'Skill term was detected in parsed resume text.'}</p></details>
                ))}
              </div>}
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
                  <p className="text-xs text-[#737380] italic">No job description was supplied, so job-specific skill gaps were not evaluated.</p>
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
                {currentReport.source === 'legacy' ? 'Legacy summary is not verified. Re-analyze the resume.' : currentReport.experienceSummary || 'No experience section was detected in parsed resume text.'}
              </p>
            </div>

            {/* Education Summary */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <h4 className="text-xs font-bold text-[#737380] uppercase tracking-wider mb-3">
                Education Summary
              </h4>
              <p className="text-xs text-[#191C1D] leading-relaxed">
                {currentReport.source === 'legacy' ? 'Legacy summary is not verified. Re-analyze the resume.' : currentReport.educationSummary || 'No education section was detected in parsed resume text.'}
              </p>
            </div>

            {/* Improvement Suggestions */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <h4 className="text-xs font-bold text-[#3525CD] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Improvement Suggestions
              </h4>
              <ul className="space-y-2 text-xs text-[#464555]">
                {(currentReport.source === 'legacy' ? ['Legacy suggestions are not verified. Re-analyze the resume.'] : currentReport.improvementSuggestions).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#712AE2] mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {currentReport.source !== 'legacy' && currentReport.rawText && <details className="rounded-xl border border-gray-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Inspect parsed resume text</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{currentReport.rawText}</pre></details>}
        </div>
      )}

      {/* MULTI-POSTING MATCHING SECTION (JOBS & INTERNSHIPS) */}
      {currentReport && currentReport.source !== 'legacy' && (
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
                  {new Date(report.uploadedAt).toLocaleString()} • {report.scoringVersion || 'Legacy result'}
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
