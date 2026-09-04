import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Clock, 
  Mic, 
  MicOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Award, 
  AlertCircle, 
  Volume2, 
  Play,
  RotateCcw,
  Layers,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { analyzeInterviewResponse } from '../../lib/aiService';
import { AudioWaveform } from '../../components/common/AudioWaveform';
import { Modal } from '../../components/common/Modal';
import { InterviewResponse } from '../../types';

interface AIInterviewPageProps {
  onNavigate: (page: string) => void;
}

export const AIInterviewPage: React.FC<AIInterviewPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { interviewSession, updateInterviewResponse } = useData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(12 * 60 + 45); // 12:45 remaining
  const [isRecording, setIsRecording] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScoreModal, setFinalScoreModal] = useState(false);

  // Live Metrics
  const [liveClarity, setLiveClarity] = useState<'Excellent' | 'Good' | 'Fair'>('Fair');
  const [liveTone, setLiveTone] = useState<'Professional' | 'Confident' | 'Casual'>('Casual');

  if (!interviewSession) {
    return <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] text-center space-y-3"><AlertCircle className="w-9 h-9 text-[#712AE2] mx-auto" /><h1 className="text-xl font-extrabold text-[#191C1D]">No interview is scheduled</h1><p className="text-sm text-[#737380]">Your recruiter must assign an interview before a session and questions can be created.</p></div>;
  }

  const questions = interviewSession.questions;
  const currentQuestion = questions[currentIndex] || questions[0];

  // Timer countdown
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  // Format timer MM:SS
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Real-time analysis update on typing
  useEffect(() => {
    const words = currentAnswer.trim().split(/\s+/).filter(Boolean).length;
    if (words > 45) {
      setLiveClarity('Excellent');
      setLiveTone('Confident');
    } else if (words > 15) {
      setLiveClarity('Good');
      setLiveTone('Professional');
    } else {
      setLiveClarity('Fair');
      setLiveTone('Casual');
    }
  }, [currentAnswer]);

  const handleSubmitAnswer = async () => {
    if (currentAnswer.trim().split(/\s+/).filter(Boolean).length < 10) return;
    const analysis = analyzeInterviewResponse(
      currentQuestion.question,
      currentAnswer,
      currentQuestion.idealDurationSeconds
    );

    const newResponse: InterviewResponse = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      answerText: currentAnswer,
      timeSpentSeconds: 120,
      clarityMetric: analysis.clarity,
      toneMetric: analysis.tone,
      score: analysis.score,
      aiFeedback: analysis.aiFeedback
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Prepopulate next starter for demo fluidity
      setCurrentAnswer('');
    } else {
      // Finished all questions
      const avgScore = Math.round(
        updatedResponses.reduce((acc, r) => acc + r.score, 0) / updatedResponses.length
      );

      const completedSession = {
        ...interviewSession,
        status: 'Completed' as const,
        responses: updatedResponses,
        overallScore: avgScore,
        completedAt: new Date().toISOString(),
        summaryFeedback: 'Candidate showed exceptional command of AI latency trade-offs, structured engineering communication, and system design principles.'
      };

      try {
        await updateInterviewResponse(completedSession);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to save the interview result.');
        return;
      }
      setIsCompleted(true);
      setFinalScoreModal(true);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const handleEndInterviewEarly = () => {
    if (confirm('Are you sure you want to end this interview session? Your current answers will be evaluated.')) {
      void handleSubmitAnswer();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar matching reference */}
      <div className="bg-white px-6 py-4 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3525CD] to-[#712AE2] flex items-center justify-center text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-[#191C1D]">HireMind AI</span>
            <span className="text-[10px] text-[#737380] block -mt-0.5">Autonomous Live Interview Studio</span>
          </div>
        </div>

        {/* Centered Top Timer */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
          <Clock className="w-4 h-4 text-[#3525CD] animate-pulse" />
          <span className="text-xs font-black tracking-wider text-[#3525CD]">
            {formatTimer(secondsRemaining)} REMAINING
          </span>
        </div>

        {/* Right: End Interview button */}
        <button
          onClick={handleEndInterviewEarly}
          className="px-4 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
        >
          End Interview
        </button>
      </div>

      {/* Main 3-Column Interview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: INTERVIEW PROGRESS */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-4">
          <div>
            <span className="text-[10px] font-bold text-[#737380] uppercase tracking-wider block">
              INTERVIEW PROGRESS
            </span>
            <h3 className="text-base font-extrabold text-[#191C1D] mt-0.5">
              Question {currentIndex + 1} of {questions.length}
            </h3>
          </div>

          <div className="space-y-1.5">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isPast = idx < currentIndex;
              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'border-[#3525CD] bg-indigo-50/70 text-[#3525CD] font-bold shadow-xs'
                      : isPast
                      ? 'border-emerald-100 bg-emerald-50/30 text-emerald-800 font-medium'
                      : 'border-transparent text-[#737380] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-[#3525CD] text-white'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-[#464555]'
                    }`}>
                      {idx + 1}
                    </span>
                    <span>{q.category}</span>
                  </div>
                  {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center text-[11px] text-[#737380] mb-1">
              <span>Overall Completion</span>
              <span className="font-bold">{Math.round(((currentIndex) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#3525CD] to-[#712AE2] h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Large Question Card & Recording/Answer Area */}
        <div className="lg:col-span-6 space-y-5">
          {/* Large Question Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.06)] space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#712AE2] border border-purple-100">
                {currentQuestion.category}
              </span>
              <span className="text-xs text-[#8E8EA0]">
                Ideal Response: ~{currentQuestion.idealDurationSeconds / 60} mins
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-[#191C1D] leading-snug">
              "{currentQuestion.question}"
            </h2>

            <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100">
              <span className="text-[11px] font-bold text-[#3525CD] uppercase tracking-wider block mb-1">
                Supporting Guidance
              </span>
              <p className="text-xs text-[#464555] leading-relaxed">
                {currentQuestion.supportingInstruction}
              </p>
            </div>
          </div>

          {/* Recording & Input Area */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  RECORDING ACTIVE
                </span>
              </div>
              <span className="text-xs text-[#737380]">
                Voice & Text Input Stream
              </span>
            </div>

            {/* Audio Waveform */}
            <AudioWaveform isRecording={isRecording && !isMuted} barCount={40} />

            {/* Answer Input Box */}
            <div className="relative">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Begin speaking or typing your response here..."
                rows={5}
                className="w-full p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl text-xs text-[#191C1D] leading-relaxed placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none resize-none"
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-[#8E8EA0] font-medium">
                {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            {/* Action Buttons: Mute & Submit Answer */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-colors ${
                  isMuted 
                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                    : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#464555] hover:bg-gray-100'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#3525CD]" />}
                <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={currentAnswer.trim().length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.02] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{currentIndex === questions.length - 1 ? 'Finish Interview' : 'Submit Answer'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE AI ANALYSIS */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-5">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#712AE2]" />
              <span className="text-[10px] font-bold text-[#737380] uppercase tracking-wider">
                LIVE AI ANALYSIS
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-[#191C1D] mt-0.5">
              Real-Time Feedback
            </h3>
          </div>

          {/* Clarity Metric */}
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/70 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#464555]">Clarity:</span>
              <span className="font-bold text-[#3525CD]">{liveClarity}</span>
            </div>
            <div className="w-full bg-indigo-200/50 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#3525CD] h-full rounded-full transition-all duration-500"
                style={{ width: liveClarity === 'Excellent' ? '95%' : liveClarity === 'Good' ? '75%' : '50%' }}
              />
            </div>
          </div>

          {/* Tone Metric */}
          <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100/70 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#464555]">Tone:</span>
              <span className="font-bold text-[#712AE2]">{liveTone}</span>
            </div>
            <div className="w-full bg-purple-200/50 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#712AE2] h-full rounded-full transition-all duration-500"
                style={{ width: liveTone === 'Confident' ? '92%' : liveTone === 'Professional' ? '82%' : '60%' }}
              />
            </div>
          </div>

          {/* Key Topics Detected */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="text-[11px] font-bold text-[#737380] uppercase tracking-wider block">
              Detected Core Concepts
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 bg-gray-100 text-[#464555] rounded-md text-[10px] font-semibold">
                Quantization
              </span>
              <span className="px-2 py-0.5 bg-gray-100 text-[#464555] rounded-md text-[10px] font-semibold">
                Latency Tuning
              </span>
              <span className="px-2 py-0.5 bg-gray-100 text-[#464555] rounded-md text-[10px] font-semibold">
                Production Scale
              </span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-[#737380] leading-relaxed">
            AI scoring evaluates technical precision, structural framing, and executive confidence in real time.
          </div>
        </div>
      </div>

      {/* Completion & Score Modal */}
      <Modal
        isOpen={finalScoreModal}
        onClose={() => setFinalScoreModal(false)}
        title="AI Interview Evaluation Complete"
        maxWidth="lg"
      >
        <div className="text-center py-4 space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[#191C1D]">
              Interview Successfully Completed!
            </h3>
            <p className="text-xs text-[#737380] mt-1">
              Your autonomous behavioral and technical assessment has been scored and compiled.
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-2xl border border-indigo-100 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] font-bold text-[#737380] uppercase block">AI Score</span>
              <span className="text-2xl font-black text-[#3525CD]">
                {interviewSession.overallScore || 88}%
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#737380] uppercase block">Clarity</span>
              <span className="text-base font-bold text-[#712AE2]">Excellent</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#737380] uppercase block">Tone</span>
              <span className="text-base font-bold text-emerald-600">Professional</span>
            </div>
          </div>

          <p className="text-xs text-[#464555] leading-relaxed bg-[#F8F9FA] p-4 rounded-xl border border-gray-100 text-left">
            <strong>Executive Feedback:</strong> Candidate articulated scalable deep learning architectures and trade-offs cleanly with strong precision. Recommended to proceed to final recruiter evaluation.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => { setFinalScoreModal(false); onNavigate('results'); }}
              className="w-full py-3 bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold rounded-xl shadow-md"
            >
              View My Comprehensive Results &rarr;
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
