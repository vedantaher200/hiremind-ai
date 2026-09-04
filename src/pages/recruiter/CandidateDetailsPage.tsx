import React, { useState } from 'react';
import {
  Mail,
  MapPin,
  Briefcase,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  Video,
  FileText,
  Code,
  MessageSquare,
  Send,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';
import { PageHeader } from '../../components/common/PageHeader';
import { CircularScore } from '../../components/common/CircularScore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

interface CandidateDetailsPageProps {
  candidateId?: string;
  onNavigate: (page: string, candidateId?: string) => void;
}

export const CandidateDetailsPage: React.FC<CandidateDetailsPageProps> = ({
  candidateId = 'cand-rahul-01',
  onNavigate
}) => {
  const {
    candidates,
    applications,
    updateApplicationStatus,
    scheduleInterview
  } = useData();

  const [scheduleModal, setScheduleModal] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState<'HR Interview' | 'Technical Interview' | 'AI Assessment' | 'Final Interview'>('Technical Interview');
  const [interviewMode, setInterviewMode] = useState<'Online' | 'Offline'>('Online');
  const [meetingLink, setMeetingLink] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const [notesList, setNotesList] = useState<string[]>([
    'Candidate assessment and recruiter observations will appear here.'
  ]);

  /*
   * IMPORTANT:
   * Do not directly access candidate.id before checking
   * whether a candidate actually exists.
   */
  const candidate =
    candidates.find((c) => c.id === candidateId) ||
    null;

  const application = candidate
    ? applications.find(
        (a) => a.candidateId === candidate.id
      ) ||
      applications.find(
        (a) => a.candidateId === candidateId
      ) ||
      null
    : null;

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    setNotesList((prev) => [
      newNote.trim(),
      ...prev
    ]);

    setNewNote('');
  };

  const handleMakeOffer = async () => {
    if (!application) return;

    try {
      await updateApplicationStatus(
        application.id,
        'Offer'
      );

      setOfferModal(false);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (error) {
        console.error(
          'Confetti animation failed:',
          error
        );
      }
    } catch (error) {
      console.error(
        'Unable to update application:',
        error
      );
    }
  };

  const handleSchedule = async () => {
    if (!application || !candidate || !interviewDate || !interviewTime) return;

    try {
      setIsScheduling(true);
      await scheduleInterview({
        applicationId: application.id,
        candidateId: candidate.id,
        jobId: application.jobId,
        interviewDate,
        interviewTime,
        interviewType,
        mode: interviewMode,
        meetingLink: meetingLink.trim() || undefined,
        status: 'Scheduled'
      });

      setScheduleModal(false);
    } catch (error) {
      console.error(
        'Unable to schedule interview:',
        error
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;

    try {
      await updateApplicationStatus(
        application.id,
        'Rejected'
      );

      setRejectModal(false);
    } catch (error) {
      console.error(
        'Unable to reject candidate:',
        error
      );
    }
  };

  /*
   * EMPTY STATE
   * This prevents the entire page from crashing when
   * candidates have not loaded yet or no candidates exist.
   */
  if (!candidate) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Candidate Assessment"
          breadcrumbs={[
            {
              label: 'Candidates',
              onClick: () =>
                onNavigate('candidates-list')
            },
            {
              label: 'Candidate Assessment'
            }
          ]}
        />

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Users className="w-8 h-8 text-[#3525CD]" />
          </div>

          <h2 className="mt-5 text-lg font-extrabold text-[#191C1D]">
            No Candidate Available
          </h2>

          <p className="mt-2 text-sm text-[#737380] max-w-md mx-auto">
            There are currently no candidate profiles available
            for assessment. Add or load candidates first, then
            select a candidate from the Candidates page.
          </p>

          <button
            type="button"
            onClick={() =>
              onNavigate('candidates-list')
            }
            className="mt-6 px-5 py-2.5 rounded-xl bg-[#3525CD] text-white text-xs font-bold hover:bg-[#281BA8] transition-colors"
          >
            View Candidates
          </button>
        </div>
      </div>
    );
  }

  /*
   * SAFE DEFAULTS
   */
  const candidateName =
    candidate.name || 'Candidate';

  const candidateTitle =
    candidate.title || 'Candidate';

  const candidateEmail =
    candidate.email || 'Email not available';

  const candidateLocation =
    candidate.location || 'Location not available';

  const candidateSkills =
    Array.isArray(candidate.skills)
      ? candidate.skills
      : [];

  const candidateExperience =
    Array.isArray(candidate.experience)
      ? candidate.experience
      : [];

  const candidateEducation =
    Array.isArray(candidate.education)
      ? candidate.education
      : [];

  const scores = application?.scores || {
    atsScore: 0,
    interviewScore: 0,
    codingScore: 0,
    aptitudeScore: 0,
    communicationScore: 0,
    behavioralScore: 0,
    overallScore: 0
  };

  const overallScore =
    scores.overallScore || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={candidateName}
        breadcrumbs={[
          {
            label: 'Candidates',
            onClick: () =>
              onNavigate('candidates-list')
          },
          {
            label: candidateName
          }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!application}
              onClick={() =>
                setScheduleModal(true)
              }
              className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold rounded-xl shadow-sm hover:bg-[#F8F9FA] transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-3.5 h-3.5 text-[#3525CD]" />
              <span>Schedule Interview</span>
            </button>

            <button
              type="button"
              disabled={!application}
              onClick={() =>
                setOfferModal(true)
              }
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Make Offer</span>
            </button>

            <button
              type="button"
              disabled={!application}
              onClick={() =>
                setRejectModal(true)
              }
              className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
          </div>
        }
      />

      {!application && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-xs font-semibold text-amber-800">
            Candidate profile loaded successfully, but this
            candidate does not currently have an application.
            Assessment scores will appear after the candidate
            applies for a job or completes assessments.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={
                  candidate.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={candidateName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-50 shadow-md"
              />

              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            <h2 className="text-xl font-extrabold text-[#191C1D] mt-4">
              {candidateName}
            </h2>

            <p className="text-xs font-semibold text-[#3525CD] mt-0.5">
              {candidateTitle}
            </p>

            <div className="mt-2">
              {application ? (
                <StatusBadge
                  status={application.status}
                />
              ) : (
                <span className="px-3 py-1 rounded-lg bg-gray-100 text-[#737380] text-xs font-bold">
                  No Application
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100 text-xs text-[#464555]">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#8E8EA0]" />

              <span className="truncate">
                {candidateEmail}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#8E8EA0]" />

              <span>
                {candidateLocation}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-[#8E8EA0]" />

              <span>
                Applied for:{' '}
                <strong>
                  {application?.jobTitle ||
                    'No job application'}
                </strong>
              </span>
            </div>
          </div>

          {/* Match Score */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 rounded-2xl border border-indigo-100 text-center space-y-2">
            <span className="text-[10px] font-bold text-[#737380] uppercase tracking-wider block">
              Overall Match Score
            </span>

            <div className="flex justify-center">
              <CircularScore
                score={overallScore}
                size={110}
                strokeWidth={10}
              />
            </div>

            <p className="text-xs font-bold text-[#3525CD] mt-2">
              {overallScore >= 80
                ? 'Excellent Candidate Fit'
                : overallScore >= 60
                ? 'Strong Candidate Potential'
                : overallScore > 0
                ? 'Assessment In Progress'
                : 'Awaiting Assessment Data'}
            </p>
          </div>

          {/* Recruiter Notes */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold text-[#191C1D] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#3525CD]" />
              <span>Recruiter Evaluation Notes</span>
            </h4>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newNote}
                onChange={(e) =>
                  setNewNote(e.target.value)
                }
                placeholder="Add interview observation note..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNote();
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl outline-none focus:border-indigo-300"
              />

              <button
                type="button"
                onClick={handleAddNote}
                className="p-2 bg-[#3525CD] text-white rounded-xl hover:bg-[#281BA8] shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notesList.map((note, index) => (
                <div
                  key={index}
                  className="p-2.5 bg-[#F8F9FA] rounded-xl text-[11px] text-[#464555] border border-gray-100"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Score Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
              <FileText className="w-5 h-5 text-[#3525CD] mx-auto mb-1.5" />

              <span className="text-[10px] font-bold text-[#737380] uppercase block">
                ATS Resume
              </span>

              <span className="text-xl font-black text-[#191C1D]">
                {scores.atsScore}%
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
              <Video className="w-5 h-5 text-[#712AE2] mx-auto mb-1.5" />

              <span className="text-[10px] font-bold text-[#737380] uppercase block">
                AI Interview
              </span>

              <span className="text-xl font-black text-[#712AE2]">
                {scores.interviewScore}%
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
              <Code className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />

              <span className="text-[10px] font-bold text-[#737380] uppercase block">
                Coding Test
              </span>

              <span className="text-xl font-black text-emerald-700">
                {scores.codingScore}%
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
              <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />

              <span className="text-[10px] font-bold text-[#737380] uppercase block">
                Communication
              </span>

              <span className="text-xl font-black text-amber-600">
                {scores.communicationScore}%
              </span>
            </div>
          </div>

          {/* Core Skills */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <h3 className="text-sm font-bold text-[#191C1D] uppercase tracking-wider mb-3">
              Core Verified Skills
            </h3>

            {candidateSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {candidateSkills.map(
                  (skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-[#3525CD] border border-indigo-100 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            ) : (
              <p className="text-xs text-[#737380]">
                No skills have been added to this candidate
                profile yet.
              </p>
            )}
          </div>

          {/* Professional Experience */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-4">
            <h3 className="text-sm font-bold text-[#191C1D] uppercase tracking-wider">
              Employment History
            </h3>

            {candidateExperience.length > 0 ? (
              <div className="space-y-4">
                {candidateExperience.map(
                  (exp, index) => (
                    <div
                      key={
                        exp.id ||
                        `${exp.company}-${index}`
                      }
                      className="p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-[#191C1D]">
                          {exp.company}
                        </h4>

                        {exp.duration && (
                          <span className="text-[11px] font-semibold text-[#3525CD] px-2.5 py-0.5 bg-indigo-50 rounded-md whitespace-nowrap">
                            {exp.duration}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-[#464555]">
                        {exp.role}
                      </p>

                      {exp.description && (
                        <p className="text-xs text-[#737380] leading-relaxed pt-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-xs text-[#737380]">
                No employment history available yet.
              </p>
            )}
          </div>

          {/* Education */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-4">
            <h3 className="text-sm font-bold text-[#191C1D] uppercase tracking-wider">
              Academic Background
            </h3>

            {candidateEducation.length > 0 ? (
              <div className="space-y-3">
                {candidateEducation.map(
                  (edu, index) => (
                    <div
                      key={
                        edu.id ||
                        `${edu.institution}-${index}`
                      }
                      className="p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#191C1D]">
                          {edu.degree}
                        </h4>

                        <p className="text-xs text-[#464555]">
                          {edu.field}
                          {edu.institution
                            ? ` • ${edu.institution}`
                            : ''}
                        </p>
                      </div>

                      {edu.year && (
                        <span className="text-xs font-semibold text-[#737380] bg-white px-2.5 py-1 rounded-md border border-gray-200 whitespace-nowrap">
                          {edu.year}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-xs text-[#737380]">
                No academic information available yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={scheduleModal}
        onClose={() => setScheduleModal(false)}
        title="Schedule Live AI Evaluation"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#737380]">
            Confirm automated behavioral and technical interview
            round for{' '}
            <strong>{candidateName}</strong>.
          </p>

          <div>
            <label className="font-bold text-[#464555] block mb-1">
              Interview Date & Time
            </label>

            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={interviewDate} onChange={event => setInterviewDate(event.target.value)} className="w-full p-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl" />
              <input type="time" value={interviewTime} onChange={event => setInterviewTime(event.target.value)} className="w-full p-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="font-bold text-[#464555]">Interview Type<select value={interviewType} onChange={event => setInterviewType(event.target.value as typeof interviewType)} className="mt-1 w-full p-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl font-normal"><option>HR Interview</option><option>Technical Interview</option><option>AI Assessment</option><option>Final Interview</option></select></label>
            <label className="font-bold text-[#464555]">Mode<select value={interviewMode} onChange={event => setInterviewMode(event.target.value as typeof interviewMode)} className="mt-1 w-full p-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl font-normal"><option>Online</option><option>Offline</option></select></label>
          </div>

          {interviewMode === 'Online' && <div><label className="font-bold text-[#464555] block mb-1">Meeting Link</label><input type="url" value={meetingLink} onChange={event => setMeetingLink(event.target.value)} placeholder="https://meet.example.com/..." className="w-full p-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl" /></div>}

          <div>
            <label className="font-bold text-[#464555] block mb-1">
              Target Position
            </label>

            <input
              type="text"
              readOnly
              value={
                application?.jobTitle ||
                'No application'
              }
              className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setScheduleModal(false)
              }
              className="px-4 py-2 border border-gray-200 rounded-xl"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSchedule}
              disabled={isScheduling || !interviewDate || !interviewTime}
              className="px-5 py-2 bg-[#0F766E] text-white font-bold rounded-xl disabled:bg-[#94A3B8] disabled:cursor-not-allowed"
            >
              {isScheduling ? 'Scheduling...' : 'Confirm & Send Invite'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Offer Modal */}
      <Modal
        isOpen={offerModal}
        onClose={() => setOfferModal(false)}
        title="Extend Formal Job Offer"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#737380]">
            Generate and extend an official compensation offer
            letter for <strong>{candidateName}</strong> based on
            the current qualification score of{' '}
            <strong>{overallScore}%</strong>.
          </p>

          <div>
            <label className="font-bold text-[#464555] block mb-1">
              Proposed Annual Compensation
            </label>

            <input
              type="text"
              defaultValue="$165,000 / year + Equity"
              className="w-full p-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setOfferModal(false)
              }
              className="px-4 py-2 border border-gray-200 rounded-xl"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleMakeOffer}
              className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
            >
              Extend Offer
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Reject Candidate"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#737380]">
            Are you sure you want to mark{' '}
            <strong>{candidateName}</strong> as rejected?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setRejectModal(false)
              }
              className="px-4 py-2 border border-gray-200 rounded-xl"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleReject}
              className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};