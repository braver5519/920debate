import React, { useState } from 'react';
import { 
  X, 
  History, 
  User, 
  Calendar, 
  Sparkles, 
  Heart, 
  BookOpen, 
  Search, 
  FileText,
  Award,
  ChevronRight
} from 'lucide-react';
import { OpinionSubmission, StudentProfile } from '../types';

interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: OpinionSubmission[];
  currentProfile: StudentProfile;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  isOpen,
  onClose,
  submissions,
  currentProfile
}) => {
  const [searchName, setSearchName] = useState(currentProfile.studentName || '');

  if (!isOpen) return null;

  // 이름 또는 번호로 필터링 (기본은 현재 입력된 학생 이름)
  const filteredSubmissions = submissions.filter(sub => {
    if (!searchName.trim()) return true;
    return (
      sub.studentName.toLowerCase().includes(searchName.trim().toLowerCase()) ||
      sub.studentNumber === searchName.trim()
    );
  });

  // 고유 토의 주제 수
  const uniqueTopics = new Set(filteredSubmissions.map(s => s.topicId)).size;
  const totalLikes = filteredSubmissions.reduce((acc, curr) => acc + curr.likes, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="student-history-modal"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* 모달 상단 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                나의 토의 포트폴리오
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
                내 토의 참여 기록 모아보기
              </h2>
            </div>
          </div>
          <p className="text-purple-100 text-xs sm:text-sm mt-2">
            내가 지금까지 어떤 토의에 참여했고, 어떤 의견과 까닭을 남겼는지 한눈에 돌아보세요!
          </p>
        </div>

        {/* 학생 검색 및 통계 배너 */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 shrink-0 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="학생 이름이나 번호로 검색 (예: 김서연)"
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {currentProfile.studentName && searchName !== currentProfile.studentName && (
              <button
                type="button"
                onClick={() => setSearchName(currentProfile.studentName)}
                className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
              >
                내 이름({currentProfile.studentName})으로 검색
              </button>
            )}
          </div>

          {/* 누적 참여 요약 뱃지 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium block">참여한 토의</span>
              <span className="text-lg sm:text-xl font-extrabold text-purple-700">
                {uniqueTopics}개 주제
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium block">제출한 의견</span>
              <span className="text-lg sm:text-xl font-extrabold text-indigo-700">
                {filteredSubmissions.length}회
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium block">받은 공감수</span>
              <span className="text-lg sm:text-xl font-extrabold text-rose-600 flex items-center justify-center gap-1">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500 inline" />
                {totalLikes}개
              </span>
            </div>
          </div>
        </div>

        {/* 참여 이력 리스트 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-800">
          {filteredSubmissions.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-base">
                '{searchName}' 학생의 이전 토의 기록이 없습니다.
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                이름 철자가 맞는지 확인하거나, 오늘의 토의에 첫 번째 의견을 작성해 보세요!
              </p>
            </div>
          ) : (
            filteredSubmissions.map((sub, idx) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-purple-300 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      토의 #{filteredSubmissions.length - idx}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                      {sub.topicTitle}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 shrink-0">
                    {sub.submittedAt}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                    내 입장: {sub.optionLabel}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>친구 공감 {sub.likes}개</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-800 leading-relaxed border border-slate-100 whitespace-pre-line">
                  <strong className="text-slate-600 text-xs block mb-1">내가 작성한 까닭:</strong>
                  {sub.reason}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 닫기 바 */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            기록은 같은 브라우저에 안전하게 보관됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
