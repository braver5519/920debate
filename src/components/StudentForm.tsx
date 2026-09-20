import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  User, 
  MessageSquare, 
  BookOpen, 
  HelpCircle, 
  Send, 
  History, 
  HeartHandshake,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DiscussionTopic, DiscussionOption, OpinionSubmission, StudentProfile } from '../types';
import { HelpTip } from './HelpTooltip';

interface StudentFormProps {
  topic: DiscussionTopic;
  initialProfile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
  onSubmitOpinion: (submission: OpinionSubmission) => Promise<{ success: boolean; sheetSaved?: boolean; message?: string }>;
  onViewClassResults: () => void;
  onViewMyHistory: () => void;
  previousSubmissionsCount: number;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  topic,
  initialProfile,
  onSaveProfile,
  onSubmitOpinion,
  onViewClassResults,
  onViewMyHistory,
  previousSubmissionsCount
}) => {
  const [grade, setGrade] = useState(initialProfile.grade || topic.grade || '4');
  const [classNum, setClassNum] = useState(initialProfile.classNum || topic.classNum || '2');
  const [studentNumber, setStudentNumber] = useState(initialProfile.studentNumber || '');
  const [studentName, setStudentName] = useState(initialProfile.studentName || '');
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 프로필 정보가 바뀔 때마다 자동 저장
  useEffect(() => {
    if (studentName.trim() || studentNumber.trim()) {
      onSaveProfile({
        grade,
        classNum,
        studentNumber,
        studentName
      });
    }
  }, [grade, classNum, studentNumber, studentName, onSaveProfile]);

  const handleStarterClick = (starterText: string) => {
    if (!reason.trim()) {
      setReason(starterText + ' ');
    } else {
      setReason(prev => prev + '\n' + starterText + ' ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 친절한 유효성 검사
    if (!grade.trim() || !classNum.trim()) {
      setValidationError('학년과 반을 먼저 선택해 주세요!');
      return;
    }
    if (!studentName.trim()) {
      setValidationError('이름을 적어주세요. 그래야 선생님과 친구들이 알 수 있어요!');
      return;
    }
    if (!selectedOptionId) {
      setValidationError('나의 입장(찬성/반대 또는 관점)을 하나 선택해 주세요!');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setValidationError('왜 그렇게 생각하는지 까닭을 조금 더 자세히 적어주세요 (5글자 이상)!');
      return;
    }

    const chosenOption = topic.options.find(o => o.id === selectedOptionId);
    if (!chosenOption) return;

    const newSubmission: OpinionSubmission = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      topicId: topic.id,
      topicTitle: topic.title,
      grade,
      classNum,
      studentNumber: studentNumber.trim(),
      studentName: studentName.trim(),
      optionId: chosenOption.id,
      optionLabel: chosenOption.label,
      reason: reason.trim(),
      submittedAt: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      likes: 0,
      syncedToSheet: false
    };

    setIsSubmitting(true);

    try {
      await onSubmitOpinion(newSubmission);
      
      // 축하 폭죽 효과! 초등학생이 가장 좋아하는 부분
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if canvas is blocked
      }

      setSubmitSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWriteAnother = () => {
    setSubmitSuccess(false);
    setSelectedOptionId('');
    setReason('');
  };

  if (submitSuccess) {
    return (
      <div 
        id="submission-success-view"
        className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-200 text-center my-6"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs sm:text-sm font-bold border border-emerald-200 mb-2">
          제출 완료! 멋진 생각이에요 👍
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {studentName} 친구의 의견이 잘 등록되었어요!
        </h2>

        <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-md mx-auto leading-relaxed">
          선생님 구글 시트와 우리 반 토의 게시판에 안전하게 전달되었습니다.
          이제 다른 친구들은 어떤 생각을 가지고 있는지 함께 확인해 볼까요?
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch justify-center gap-3">
          <button
            id="view-class-results-btn"
            type="button"
            onClick={onViewClassResults}
            className="px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>우리 반 친구들 의견 그래프 보러가기</span>
          </button>

          <button
            id="view-my-history-after-submit-btn"
            type="button"
            onClick={onViewMyHistory}
            className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <History className="w-5 h-5 text-slate-500" />
            <span>내가 쓴 이전 토의 기록 보기</span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleWriteAnother}
            className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
          >
            내용을 수정하거나 다시 제출하고 싶으신가요? (클릭)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* 1. 오늘의 토의 주제 안내 카드 (친절하고 큼직한 레이아웃) */}
      <div 
        id="today-topic-card"
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 overflow-hidden relative"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>오늘의 토의 주제</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {topic.grade}학년 {topic.classNum}반
            </span>
          </div>

          {previousSubmissionsCount > 0 && (
            <button
              type="button"
              onClick={onViewMyHistory}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>내 참여 기록 ({previousSubmissionsCount}개)</span>
            </button>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {topic.title}
        </h1>

        {/* 상황 설명 카드 */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-sm sm:text-base leading-relaxed space-y-2">
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-900 block mb-0.5">상황 이야기</strong>
              <p className="text-slate-700">{topic.situation}</p>
            </div>
          </div>
          {topic.guideQuestion && (
            <div className="pt-2 border-t border-amber-200/60 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold text-amber-900">
                생각해 보기: {topic.guideQuestion}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. 학생 의견 작성 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-8">
        
        {/* Step 1: 학생 인적 사항 입력 (저학년도 쉽게 누를 수 있는 넉넉한 입력칸) */}
        <div id="step-student-info" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
              1
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              누구의 생각인가요? (나를 알려주세요)
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 pl-9">
            이름과 번호를 적어주면 다음 시간에도 내가 쓴 글을 다시 모아볼 수 있어요.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* 학년 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                학년
              </label>
              <select
                id="student-grade-select"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-base font-bold bg-slate-50 text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={String(num)}>{num}학년</option>
                ))}
              </select>
            </div>

            {/* 반 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                반
              </label>
              <select
                id="student-class-select"
                value={classNum}
                onChange={(e) => setClassNum(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-base font-bold bg-slate-50 text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={String(num)}>{num}반</option>
                ))}
              </select>
            </div>

            {/* 번호 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                번호
              </label>
              <input
                id="student-number-input"
                type="number"
                min="1"
                max="50"
                placeholder="예: 7"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-base font-bold bg-white text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                이름 <span className="text-rose-500">*</span>
              </label>
              <input
                id="student-name-input"
                type="text"
                placeholder="예: 김토의"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-base font-bold bg-white text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Step 2: 나의 입장 선택 (저학년도 실수 없이 누를 수 있는 대형 카드 버튼!) */}
        <div id="step-stance-selection" className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
              2
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              나의 입장을 선택해 주세요
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 pl-9">
            가장 내 마음에 가까운 버튼을 하나 꾹 눌러주세요!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {topic.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              
              // 색상 테마 계산
              let bgStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80';
              if (option.color === 'emerald') {
                bgStyle = isSelected
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-3 ring-emerald-300 shadow-md'
                  : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50';
              } else if (option.color === 'rose') {
                bgStyle = isSelected
                  ? 'bg-rose-50 border-rose-500 text-rose-950 ring-3 ring-rose-300 shadow-md'
                  : 'bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:bg-rose-50';
              } else if (option.color === 'amber') {
                bgStyle = isSelected
                  ? 'bg-amber-50 border-amber-500 text-amber-950 ring-3 ring-amber-300 shadow-md'
                  : 'bg-amber-50/40 border-amber-200 hover:border-amber-300 hover:bg-amber-50';
              } else {
                bgStyle = isSelected
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-3 ring-indigo-300 shadow-md'
                  : 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50';
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  id={`stance-option-${option.id}`}
                  onClick={() => setSelectedOptionId(option.id)}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center text-center justify-between min-h-[140px] cursor-pointer group relative ${bgStyle}`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                      ✓
                    </span>
                  )}

                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                    {option.emoji}
                  </span>

                  <span className="font-extrabold text-base sm:text-lg leading-tight">
                    {option.label}
                  </span>

                  {option.description && (
                    <span className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {option.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: 까닭과 생각 쓰기 + 문장 시작 도우미 칩 */}
        <div id="step-reason-writing" className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
              3
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              왜 그렇게 생각하나요? (까닭과 이유 적기) <span className="text-rose-500">*</span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 pl-9">
            친구들이 고개를 끄덕일 수 있도록 구체적인 까닭이나 경험을 자세히 적어보세요.
          </p>

          {/* 문장 시작 도우미 칩 버튼들 */}
          <div className="pl-9 pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>문장 도우미:</span>
            </span>
            {[
              '왜냐하면,',
              '내 생각에는,',
              '예를 들어 우리 반에서',
              '친구들의 입장을 생각해보면,',
              '그렇게 하면 좋은 점은'
            ].map((starter, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleStarterClick(starter)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 text-xs font-medium transition-colors border border-slate-200 cursor-pointer"
              >
                + "{starter}"
              </button>
            ))}
          </div>

          <div className="pt-2">
            <textarea
              id="student-reason-textarea"
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="친구들의 의견도 존중하면서, 내 생각을 바르고 친절하게 적어주세요. (예: 제비뽑기를 하면 누구나 공평하게 여러 친구와 짝이 되어 친해질 수 있기 때문입니다.)"
              className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-base leading-relaxed bg-white text-slate-800 placeholder:text-slate-400 resize-y shadow-2xs"
            />
            <div className="flex justify-between items-center text-xs text-slate-400 mt-1 px-2">
              <span>충분히 구체적으로 적을수록 훌륭한 토의가 돼요!</span>
              <span>{reason.length}자 작성 중</span>
            </div>
          </div>
        </div>

        {/* 유효성 검사 에러 표시 */}
        {validationError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-bold">{validationError}</span>
          </div>
        )}

        {/* 초등학생 친절 도움말 안내 */}
        <HelpTip title="저학년 친구들도 어렵지 않아요!" variant="emerald">
          <p>
            1. 이름과 번호를 적고 <br />
            2. 마음에 드는 큰 버튼(찬성 / 반대 / 기타)을 누른 다음 <br />
            3. '왜냐하면' 도우미 단추를 눌러 이유를 한 문장 이상 적어보세요!
          </p>
        </HelpTip>

        {/* Step 4: 대형 제출 버튼 (저학년도 실수 없이 누를 수 있는 넉넉한 크기!) */}
        <div className="pt-2">
          <button
            id="submit-student-opinion-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 px-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] text-white font-extrabold text-xl sm:text-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>선생님과 시트로 전송하는 중...</span>
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                <span>🌟 내 의견 제출하기 (터치하세요!)</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
