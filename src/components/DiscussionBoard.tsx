import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Heart, 
  MessageCircle, 
  Sparkles, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  CloudCheck, 
  Flame, 
  PenTool, 
  Users, 
  Compass,
  Lightbulb
} from 'lucide-react';
import { DiscussionTopic, OpinionSubmission } from '../types';

interface DiscussionBoardProps {
  topic: DiscussionTopic;
  submissions: OpinionSubmission[];
  onToggleLike: (submissionId: string) => void;
  onNavigateToForm: () => void;
  onViewMyHistory: () => void;
  totalStudentsInClass?: number;
}

export const DiscussionBoard: React.FC<DiscussionBoardProps> = ({
  topic,
  submissions,
  onToggleLike,
  onNavigateToForm,
  onViewMyHistory,
  totalStudentsInClass = 20
}) => {
  const [filterOptionId, setFilterOptionId] = useState<string>('all');
  const [filterMinorityOnly, setFilterMinorityOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');

  // 현재 토픽에 대한 제출만 필터링
  const currentSubmissions = useMemo(() => {
    return submissions.filter(s => s.topicId === topic.id);
  }, [submissions, topic.id]);

  // 각 옵션별 득표 통계 계산
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    topic.options.forEach(opt => {
      counts[opt.id] = 0;
    });

    currentSubmissions.forEach(sub => {
      if (counts[sub.optionId] !== undefined) {
        counts[sub.optionId]++;
      } else {
        counts[sub.optionId] = 1;
      }
    });

    const total = currentSubmissions.length;
    
    // 소수 의견 찾기 (표를 얻었으나 가장 적은 표를 받은 옵션들)
    let minCount = Infinity;
    let minorityOptionIds: string[] = [];

    if (total > 0) {
      topic.options.forEach(opt => {
        const c = counts[opt.id] || 0;
        if (c > 0 && c < minCount) {
          minCount = c;
        }
      });

      if (minCount !== Infinity && minCount < total / 2) {
        minorityOptionIds = topic.options
          .filter(opt => (counts[opt.id] || 0) === minCount)
          .map(opt => opt.id);
      }
    }

    return {
      total,
      counts,
      minorityOptionIds,
      participationRate: Math.min(100, Math.round((total / totalStudentsInClass) * 100))
    };
  }, [currentSubmissions, topic.options, totalStudentsInClass]);

  // 필터 및 정렬 적용된 목록
  const displayedSubmissions = useMemo(() => {
    let list = [...currentSubmissions];

    if (filterMinorityOnly && stats.minorityOptionIds.length > 0) {
      list = list.filter(s => stats.minorityOptionIds.includes(s.optionId));
    } else if (filterOptionId !== 'all') {
      list = list.filter(s => s.optionId === filterOptionId);
    }

    if (sortBy === 'likes') {
      list.sort((a, b) => b.likes - a.likes);
    } else {
      // 최신순
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    return list;
  }, [currentSubmissions, filterOptionId, filterMinorityOnly, sortBy, stats.minorityOptionIds]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* 1. 상단 토의 헤더 & 빠른 액션 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">
                {topic.grade}학년 {topic.classNum}반 실시간 나눔판
              </span>
              <span className="text-xs text-slate-500 font-medium">
                총 {stats.total}명 참여 ({stats.participationRate}% 제출 완료)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {topic.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="goto-write-opinion-btn"
              type="button"
              onClick={onNavigateToForm}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              <span>나도 의견 쓰기</span>
            </button>
            <button
              id="board-view-history-btn"
              type="button"
              onClick={onViewMyHistory}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>내 기록</span>
            </button>
          </div>
        </div>

        {/* 2. 실시간 반 전체 의견 분포 그래프 (Requirement 2) */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>우리 반 실시간 의견 분포 그래프</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              실시간 집계 중
            </span>
          </div>

          {stats.total === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-sm font-medium">
                아직 제출된 의견이 없습니다. 첫 번째로 의견을 내보세요! 🚀
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 멀티 컬러 가로 누적 막대 그래프 */}
              <div className="w-full h-8 sm:h-10 rounded-2xl overflow-hidden flex shadow-inner bg-slate-100 p-1 gap-1">
                {topic.options.map(opt => {
                  const count = stats.counts[opt.id] || 0;
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  if (percentage === 0) return null;

                  let colorClass = 'bg-indigo-500';
                  if (opt.color === 'emerald') colorClass = 'bg-emerald-500';
                  else if (opt.color === 'rose') colorClass = 'bg-rose-500';
                  else if (opt.color === 'amber') colorClass = 'bg-amber-500';

                  return (
                    <div
                      key={opt.id}
                      style={{ width: `${percentage}%` }}
                      className={`${colorClass} h-full rounded-xl transition-all duration-500 flex items-center justify-center text-white text-xs sm:text-sm font-black overflow-hidden px-1`}
                      title={`${opt.label}: ${count}명 (${Math.round(percentage)}%)`}
                    >
                      {percentage > 12 && (
                        <span className="truncate">
                          {opt.emoji} {Math.round(percentage)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 개별 관점 상세 카드 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topic.options.map(opt => {
                  const count = stats.counts[opt.id] || 0;
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const isMinority = stats.minorityOptionIds.includes(opt.id) && count > 0;

                  let themeBorder = 'border-slate-200 bg-white';
                  let badgeBg = 'bg-slate-100 text-slate-700';

                  if (opt.color === 'emerald') {
                    themeBorder = 'border-emerald-200 bg-emerald-50/30';
                    badgeBg = 'bg-emerald-100 text-emerald-800';
                  } else if (opt.color === 'rose') {
                    themeBorder = 'border-rose-200 bg-rose-50/30';
                    badgeBg = 'bg-rose-100 text-rose-800';
                  } else if (opt.color === 'amber') {
                    themeBorder = 'border-amber-200 bg-amber-50/30';
                    badgeBg = 'bg-amber-100 text-amber-800';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-2xl border ${themeBorder} transition-all relative overflow-hidden`}
                    >
                      {isMinority && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black tracking-tight">
                          소수 의견 💡
                        </span>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="font-bold text-sm sm:text-base text-slate-800 leading-tight">
                          {opt.label}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mt-3">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">
                          {count}
                          <span className="text-xs font-normal text-slate-500 ml-1">명</span>
                        </span>
                        <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full ${badgeBg}`}>
                          {percentage}%
                        </span>
                      </div>

                      {/* 개별 진행 바 */}
                      <div className="w-full bg-slate-200/80 rounded-full h-2 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            opt.color === 'emerald'
                              ? 'bg-emerald-500'
                              : opt.color === 'rose'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 소수 의견 존중 및 격려 배너 */}
              {stats.minorityOptionIds.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs sm:text-sm text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">토의 예절 한 줄:</strong> 소수 의견도 우리 반을 더욱 지혜롭게 만드는 소중한 생각이에요. 다른 의견을 가진 친구의 까닭을 귀 기울여 들어봅시다!
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. 의견 필터 및 정렬 탭바 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* 입장별 필터 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => { setFilterOptionId('all'); setFilterMinorityOnly(false); }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterOptionId === 'all' && !filterMinorityOnly
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 보기 ({currentSubmissions.length})
          </button>

          {topic.options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { setFilterOptionId(opt.id); setFilterMinorityOnly(false); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterOptionId === opt.id && !filterMinorityOnly
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
              <span className="opacity-80">({stats.counts[opt.id] || 0})</span>
            </button>
          ))}

          {stats.minorityOptionIds.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterMinorityOnly(true)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                filterMinorityOnly
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              <span>💡 소수 의견만 모아보기</span>
            </button>
          )}
        </div>

        {/* 정렬 방식 토글 */}
        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 justify-end">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            정렬:
          </span>
          <button
            type="button"
            onClick={() => setSortBy('newest')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              sortBy === 'newest'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            최신순
          </button>
          <button
            type="button"
            onClick={() => setSortBy('likes')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              sortBy === 'likes'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            <span>공감 많은 순</span>
          </button>
        </div>
      </div>

      {/* 4. 학생 의견 카드 피드 */}
      {displayedSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-700">
            해당 조건의 의견이 아직 없습니다.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            다른 필터를 누르거나 직접 의견을 등록해 보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedSubmissions.map((sub) => {
            const option = topic.options.find(o => o.id === sub.optionId);
            const isMinority = stats.minorityOptionIds.includes(sub.optionId);

            let cardBorder = 'border-slate-200 hover:border-slate-300';
            let badgeStyle = 'bg-slate-100 text-slate-800';

            if (option?.color === 'emerald') {
              badgeStyle = 'bg-emerald-100 text-emerald-800 border border-emerald-300/60';
              cardBorder = 'hover:border-emerald-300';
            } else if (option?.color === 'rose') {
              badgeStyle = 'bg-rose-100 text-rose-800 border border-rose-300/60';
              cardBorder = 'hover:border-rose-300';
            } else if (option?.color === 'amber') {
              badgeStyle = 'bg-amber-100 text-amber-800 border border-amber-300/60';
              cardBorder = 'hover:border-amber-300';
            }

            return (
              <div
                key={sub.id}
                id={`opinion-card-${sub.id}`}
                className={`bg-white rounded-3xl p-5 sm:p-6 shadow-sm border transition-all hover:shadow-md flex flex-col justify-between ${cardBorder}`}
              >
                <div>
                  {/* 카드 상단: 학생 정보 및 입장 뱃지 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-100">
                        {sub.studentNumber ? `${sub.studentNumber}번` : '학생'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-base text-slate-900">
                            {sub.studentName}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({sub.grade}학년 {sub.classNum}반)
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {sub.submittedAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 ${badgeStyle}`}>
                        <span>{option?.emoji}</span>
                        <span>{sub.optionLabel}</span>
                      </span>
                      {isMinority && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md">
                          소수 의견
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 카드 본문: 까닭 및 근거 */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line my-3">
                    {sub.reason}
                  </div>
                </div>

                {/* 카드 하단: 공감 버튼 및 구글 시트 전송 마크 */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>시트 기록됨</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleLike(sub.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-all border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${sub.likes > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                    <span>공감해요</span>
                    <span className="bg-white px-1.5 py-0.5 rounded-md text-[11px] text-rose-600 border border-slate-100 font-black">
                      {sub.likes}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
