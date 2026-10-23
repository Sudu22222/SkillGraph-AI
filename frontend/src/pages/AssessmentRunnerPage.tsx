import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Assessment, AssessmentResult } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';

interface AssessmentRunnerPageProps {
  assessmentId: number;
  onBack: () => void;
  onGoToRoadmap: () => void;
}

export const AssessmentRunnerPage: React.FC<AssessmentRunnerPageProps> = ({
  assessmentId,
  onBack,
  onGoToRoadmap,
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<Assessment>(`/assessments/${assessmentId}`)
      .then((res) => {
        setAssessment(res);
        setTimeLeft(res.time_limit_mins * 60);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [assessmentId]);

  // Countdown timer
  useEffect(() => {
    if (!assessment || result) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [assessment, result]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post<AssessmentResult>(
        `/assessments/${assessmentId}/submit`,
        {
          assessment_id: assessmentId,
          answers,
        }
      );
      setResult(res);
    } catch {
      alert('Error submitting assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !assessment) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        Loading assessment questions and rubrics...
      </div>
    );
  }

  // --- RESULT VIEW ---
  if (result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Result Header Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs text-center space-y-3">
          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
              result.passed
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {result.passed ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {result.passed ? 'Assessment Passed' : 'Assessment Completed — Needs Practice'}
          </h2>

          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {result.percentage}%
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({result.score} / {result.max_score} pts)
            </span>
          </div>

          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            {result.feedback_summary}
          </p>

          {/* Competency Update Badge */}
          <div className="inline-flex items-center gap-2 p-2 px-3 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">Competency Transition:</span>
            <span className="capitalize font-semibold text-slate-600">
              {result.previous_status}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize font-bold text-blue-700">
              {result.new_status}
            </span>
          </div>

          {result.roadmap_updated && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 font-medium">
              ✓ {result.explanation}
            </div>
          )}

          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setResult(null);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setTimeLeft(assessment.time_limit_mins * 60);
              }}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded text-xs font-medium text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Assessment</span>
            </button>
            <button
              onClick={onGoToRoadmap}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
            >
              Continue to Roadmap
            </button>
          </div>
        </div>

        {/* Question-by-Question Evaluation Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Detailed Question & Rubric Breakdown
          </h3>

          <div className="space-y-4">
            {result.evaluations.map((evalItem, idx) => {
              const origQ = assessment.questions.find((q) => q.id === evalItem.question_id);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-md border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Question {idx + 1}: {origQ?.question}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        evalItem.is_correct
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evalItem.score} / {evalItem.max_score} pts
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <span className="font-medium text-slate-700">Explanation: </span>
                    {evalItem.explanation}
                  </div>

                  {evalItem.rubric_scores && evalItem.rubric_scores.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                      <span className="text-[11px] font-semibold uppercase text-slate-400">
                        Rubric Criteria Breakdown:
                      </span>
                      {evalItem.rubric_scores.map((r, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center justify-between text-[11px] bg-white p-2 rounded border border-slate-100"
                        >
                          <span className="text-slate-700 font-medium">
                            {r.criterion}: {r.feedback}
                          </span>
                          <span className="font-mono font-semibold text-slate-900">
                            {r.score} / {r.max_score} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- RUNNER VIEW ---
  const currentQ = assessment.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </button>
          <h2 className="text-base font-bold text-slate-900">{assessment.title}</h2>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
          <Clock className="w-4 h-4 text-blue-700" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      {/* Question Progress Navigation */}
      <div className="flex items-center gap-1.5">
        {assessment.questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined && String(answers[q.id]).trim().length > 0;
          const isCurrent = idx === currentQuestionIndex;

          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-blue-700 text-white'
                  : isAnswered
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Q{idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Question {currentQuestionIndex + 1} of {assessment.questions.length}
          </span>
          <span className="font-semibold text-slate-700">
            {currentQ.points} points
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {currentQ.question}
        </h3>

        {/* Options for Multiple Choice */}
        {currentQ.question_type === 'multiple_choice' && currentQ.options && (
          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQ.id, opt.id)}
                  className={`p-3.5 rounded-md border text-xs font-medium cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80 text-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span>{opt.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Short Answer / Practical Task */}
        {currentQ.question_type !== 'multiple_choice' && (
          <div className="space-y-3 pt-2">
            <textarea
              rows={6}
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
              placeholder="Type your technical explanation or code snippet here..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
            />

            {/* Transparent Rubric Criteria */}
            {currentQ.rubric && currentQ.rubric.criteria && (
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Visible Grading Rubric Criteria:
                </div>
                {currentQ.rubric.criteria.map((c: any, cIdx: number) => (
                  <div
                    key={cIdx}
                    className="flex items-center justify-between text-xs text-slate-600"
                  >
                    <span>
                      • <strong>{c.name}:</strong> {c.description}
                    </span>
                    <span className="font-mono text-slate-500">
                      max {c.max_points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation / Submit Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded text-xs font-medium text-slate-700 disabled:opacity-30 cursor-pointer"
          >
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{submitting ? 'Evaluating...' : 'Submit Assessment'}</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
