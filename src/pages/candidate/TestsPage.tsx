import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Award,
  ArrowRight,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';
import { AssessmentTest } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

interface TestsPageProps {
  onNavigate: (page: string) => void;
}

export const TestsPage: React.FC<TestsPageProps> = ({ onNavigate }) => {
  const { tests, testAttempts, recordTestAttempt } = useData();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<
    'Aptitude Test' | 'Coding Test' | 'Technical MCQs'
  >('Aptitude Test');

  const [agreeRules, setAgreeRules] = useState(true);

  // Active Test Runner State
  const [activeTest, setActiveTest] = useState<AssessmentTest | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [resultModal, setResultModal] = useState<{
    score: number;
    maxPoints: number;
    percentage: number;
  } | null>(null);

  // Keep latest values available for timer
  const answersRef = useRef<Record<string, any>>({});
  const codeDraftsRef = useRef<Record<string, string>>({});
  const timeRemainingRef = useRef(0);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    codeDraftsRef.current = codeDrafts;
  }, [codeDrafts]);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  const currentSelectedTest =
    tests.find((t) => t.category === activeCategory) ||
    tests[0] ||
    null;

  const recentAttempt =
    testAttempts.length > 0
      ? [...testAttempts].sort((a, b) => {
          return b.timeSpentMinutes - a.timeSpentMinutes;
        })[0]
      : null;

  const handleSubmitTest = async () => {
    if (!activeTest || hasSubmittedRef.current) return;

    hasSubmittedRef.current = true;

    const latestAnswers = answersRef.current;
    const latestCodeDrafts = codeDraftsRef.current;

    let pointsEarned = 0;

    activeTest.questions.forEach((q) => {
      if (q.type === 'mcq') {
        if (latestAnswers[q.id] === q.correctOptionIndex) {
          pointsEarned += q.points;
        }
      } else if (q.type === 'coding') {
        const code = latestCodeDrafts[q.id] || '';

        if (code.includes('return') && code.length > 40) {
          pointsEarned += q.points;
        } else if (code.trim().length > 0) {
          pointsEarned += Math.round(q.points * 0.5);
        }
      }
    });

    const percentage =
      activeTest.totalPoints > 0
        ? Math.round((pointsEarned / activeTest.totalPoints) * 100)
        : 0;

    const timeSpentSeconds =
      activeTest.durationMinutes * 60 - timeRemainingRef.current;

    if (!user) return;
    try {
      await recordTestAttempt({
      testId: activeTest.id,
      testTitle: activeTest.title,
      category: activeTest.category,
      candidateId: user.id,
      score: pointsEarned,
      totalPoints: activeTest.totalPoints,
      percentage,
      status: percentage >= 70 ? 'Passed' : 'Failed',
      timeSpentMinutes: Math.max(1, Math.ceil(timeSpentSeconds / 60)),
      answers: latestAnswers
      });
    } catch (error) {
      hasSubmittedRef.current = false;
      alert(error instanceof Error ? error.message : 'Unable to save your assessment result.');
      return;
    }

    setResultModal({
      score: pointsEarned,
      maxPoints: activeTest.totalPoints,
      percentage
    });

    setActiveTest(null);

    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 70,
          spread: 60
        });
      } catch (error) {
        console.error('Confetti error:', error);
      }
    }
  };

  // Timer for active test
  useEffect(() => {
    if (!activeTest) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          setTimeout(() => {
            void handleSubmitTest();
          }, 0);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTest]);

  const handleStartTest = (test: AssessmentTest) => {
    hasSubmittedRef.current = false;

    setActiveTest(test);
    setCurrentQuestionIdx(0);
    setAnswers({});
    answersRef.current = {};

    const initialTime = test.durationMinutes * 60;
    setTimeRemaining(initialTime);
    timeRemainingRef.current = initialTime;

    // Populate code drafts if coding questions exist
    const drafts: Record<string, string> = {};

    test.questions.forEach((q) => {
      if (q.type === 'coding' && q.starterCode) {
        drafts[q.id] = q.starterCode;
      }
    });

    setCodeDrafts(drafts);
    codeDraftsRef.current = drafts;
  };

  const handleSelectOption = (
    questionId: string,
    optionIndex: number
  ) => {
    setAnswers((prev) => {
      const updatedAnswers = {
        ...prev,
        [questionId]: optionIndex
      };

      answersRef.current = updatedAnswers;

      return updatedAnswers;
    });
  };

  const handleCodeChange = (
    questionId: string,
    value: string
  ) => {
    setCodeDrafts((prev) => {
      const updatedDrafts = {
        ...prev,
        [questionId]: value
      };

      codeDraftsRef.current = updatedDrafts;

      return updatedDrafts;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">
          Candidate Evaluation Tests
        </h1>

        <p className="mt-1 text-sm text-[#464555]">
          Complete these assessments to demonstrate your capabilities. Ensure
          you have a stable connection before beginning.
        </p>
      </div>

      {/* Active Test */}
      {activeTest ? (
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_20px_50px_-10px_rgba(79,70,229,0.1)] p-6 space-y-6">
          {/* Top Runner Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div>
              <span className="text-xs font-bold text-[#712AE2] uppercase tracking-wider">
                {activeTest.category} Assessment
              </span>

              <h2 className="text-lg font-bold text-[#191C1D]">
                {activeTest.title}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-[#3525CD] rounded-full text-xs font-black">
                <Clock className="w-4 h-4" />

                <span>
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60)
                    .toString()
                    .padStart(2, '0')}
                </span>
              </div>

              <button
                onClick={handleSubmitTest}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="flex items-center gap-2 pb-2 overflow-x-auto">
            {activeTest.questions.map((q, idx) => {
              const isAnswered =
                answers[q.id] !== undefined ||
                Boolean(
                  codeDrafts[q.id] &&
                    codeDrafts[q.id].trim().length > 0 &&
                    codeDrafts[q.id] !== q.starterCode
                );

              const isCurrent = idx === currentQuestionIdx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-[#3525CD] text-white ring-2 ring-indigo-200'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#F8F9FA] text-[#464555] border border-[#E5E7EB]'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Body */}
          {(() => {
            const currentQ =
              activeTest.questions[currentQuestionIdx];

            if (!currentQ) return null;

            return (
              <div className="space-y-5">
                <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100">
                  <span className="text-[11px] font-bold text-[#737380] uppercase tracking-wider block mb-1">
                    Question {currentQuestionIdx + 1} of{' '}
                    {activeTest.questions.length} • (
                    {currentQ.points} Points)
                  </span>

                  <h3 className="text-base font-bold text-[#191C1D]">
                    {currentQ.question}
                  </h3>
                </div>

                {/* MCQ */}
                {currentQ.type === 'mcq' &&
                  currentQ.options && (
                    <div className="space-y-2.5">
                      {currentQ.options.map(
                        (opt, optIdx) => {
                          const isSelected =
                            answers[currentQ.id] === optIdx;

                          return (
                            <button
                              type="button"
                              key={optIdx}
                              onClick={() =>
                                handleSelectOption(
                                  currentQ.id,
                                  optIdx
                                )
                              }
                              className={`w-full p-4 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between text-left ${
                                isSelected
                                  ? 'border-[#3525CD] bg-indigo-50/60 text-[#3525CD] font-bold shadow-xs'
                                  : 'border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#191C1D]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                    isSelected
                                      ? 'border-[#3525CD] bg-[#3525CD] text-white'
                                      : 'border-gray-300 text-gray-500'
                                  }`}
                                >
                                  {String.fromCharCode(
                                    65 + optIdx
                                  )}
                                </span>

                                <span>{opt}</span>
                              </div>

                              {isSelected && (
                                <Check className="w-4 h-4 text-[#3525CD]" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}

                {/* Coding */}
                {currentQ.type === 'coding' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#737380]">
                      <span>TypeScript Code Editor</span>

                      {currentQ.sampleInput && (
                        <span>{currentQ.sampleInput}</span>
                      )}
                    </div>

                    <textarea
                      value={
                        codeDrafts[currentQ.id] ||
                        currentQ.starterCode ||
                        ''
                      }
                      onChange={(e) =>
                        handleCodeChange(
                          currentQ.id,
                          e.target.value
                        )
                      }
                      rows={12}
                      spellCheck={false}
                      className="w-full font-mono text-xs p-4 bg-[#1E1E2E] text-[#E0DEF4] rounded-2xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    {currentQ.sampleOutput && (
                      <div className="p-3 bg-indigo-50 rounded-xl text-xs text-[#3525CD]">
                        Expected Output:{' '}
                        <code>{currentQ.sampleOutput}</code>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    disabled={currentQuestionIdx === 0}
                    onClick={() =>
                      setCurrentQuestionIdx((prev) => prev - 1)
                    }
                    className="px-4 py-2 text-xs font-semibold text-[#464555] disabled:opacity-30 rounded-xl border border-gray-200"
                  >
                    ← Previous Question
                  </button>

                  {currentQuestionIdx <
                  activeTest.questions.length - 1 ? (
                    <button
                      onClick={() =>
                        setCurrentQuestionIdx((prev) => prev + 1)
                      }
                      className="px-5 py-2 rounded-xl bg-[#3525CD] text-white text-xs font-bold shadow-xs hover:bg-[#3525CD]/90"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitTest}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold shadow-md hover:opacity-95"
                    >
                      Finish Assessment & Submit
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : currentSelectedTest ? (
        /* Standard Test Cards View */
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            {(
              [
                'Aptitude Test',
                'Coding Test',
                'Technical MCQs'
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#3525CD] text-white shadow-xs'
                    : 'text-[#464555] hover:bg-[#F8F9FA] hover:text-[#191C1D]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Test Details */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#3525CD]">
                    Active Assessment
                  </span>

                  <span className="text-xs text-[#737380]">
                    Verified Automated Proctoring
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-[#191C1D] mt-2">
                  {currentSelectedTest.title}
                </h3>

                <p className="text-xs text-[#464555] mt-1 leading-relaxed">
                  {currentSelectedTest.description}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100 text-center">
                <div>
                  <span className="text-[10px] font-bold text-[#737380] uppercase block">
                    Total Questions
                  </span>

                  <span className="text-lg font-black text-[#191C1D]">
                    {currentSelectedTest.totalQuestions}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#737380] uppercase block">
                    Allocated Time
                  </span>

                  <span className="text-lg font-black text-[#3525CD]">
                    {currentSelectedTest.durationMinutes} MIN
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#737380] uppercase block">
                    Maximum Score
                  </span>

                  <span className="text-lg font-black text-[#712AE2]">
                    {currentSelectedTest.totalPoints}
                  </span>
                </div>
              </div>

              {/* Rules */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-[#464555] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeRules}
                    onChange={(e) =>
                      setAgreeRules(e.target.checked)
                    }
                    className="rounded text-[#3525CD] focus:ring-[#3525CD]"
                  />

                  <span>
                    I have read and agree to the test rules and
                    honor code.
                  </span>
                </label>

                <button
                  onClick={() =>
                    handleStartTest(currentSelectedTest)
                  }
                  disabled={!agreeRules}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-sm hover:bg-[#115E59] active:bg-[#0B4F4A] disabled:bg-[#CBD5E1] disabled:text-[#475569] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] transition-colors flex items-center justify-center gap-2 enabled:cursor-pointer"
                >
                  <span>Start Test</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recent Result */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-5">
              <div className="pb-3 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#191C1D] uppercase tracking-wider">
                  RECENT TEST RESULT
                </h3>

                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              {recentAttempt ? (
                <>
                  <div>
                    <h4 className="text-base font-bold text-[#191C1D]">
                      {recentAttempt.testTitle}
                    </h4>

                    <p className="text-xs text-[#737380] mt-0.5">
                      {recentAttempt.status}
                    </p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-black text-[#3525CD]">
                        {recentAttempt.percentage}%
                      </span>

                      <span className="text-xs text-[#464555] block font-semibold">
                        {recentAttempt.status === 'Passed'
                          ? 'Passed Performance'
                          : 'Needs Improvement'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold text-[#191C1D]">
                        {recentAttempt.score}/
                        {recentAttempt.totalPoints}
                      </span>

                      <span className="text-[10px] text-[#8E8EA0] block uppercase font-bold">
                        Points Earned
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-5 bg-[#F8F9FA] rounded-2xl border border-gray-100">
                  <p className="text-xs text-[#737380]">
                    No test attempts yet. Complete your first
                    assessment to see your result here.
                  </p>
                </div>
              )}

              <button
                onClick={() => onNavigate('results')}
                className="w-full py-2.5 bg-[#F8F9FA] hover:bg-gray-100 text-[#3525CD] text-xs font-bold rounded-xl border border-[#E5E7EB] transition-colors"
              >
                View Details →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] text-center">
          <h3 className="text-lg font-bold text-[#191C1D]">
            No Tests Available
          </h3>

          <p className="text-sm text-[#737380] mt-2">
            Assessment tests have not been added yet.
          </p>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <Modal
          isOpen={Boolean(resultModal)}
          onClose={() => setResultModal(null)}
          title="Assessment Results Recorded"
          maxWidth="md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-[#3525CD] flex items-center justify-center mx-auto border border-indigo-100">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#191C1D]">
                Score: {resultModal.percentage}%
              </h3>

              <p className="text-xs text-[#737380] mt-1">
                You earned {resultModal.score} out of{' '}
                {resultModal.maxPoints} possible points.
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl text-xs font-medium ${
                resultModal.percentage >= 70
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {resultModal.percentage >= 70
                ? 'Congratulations! You passed the assessment.'
                : 'Your assessment result has been recorded. You can review your results for more details.'}
            </div>

            <button
              onClick={() => {
                setResultModal(null);
                onNavigate('results');
              }}
              className="w-full py-2.5 rounded-xl bg-[#3525CD] text-white text-xs font-bold"
            >
              See All Results
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
