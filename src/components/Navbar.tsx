import React, { useState } from 'react';
import { 
  MessageSquare, 
  BarChart3, 
  History, 
  ShieldCheck, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock,
  KeyRound,
  GraduationCap
} from 'lucide-react';
import { GoogleSheetConfig } from '../types';

interface NavbarProps {
  currentTab: 'form' | 'board' | 'teacher';
  onSelectTab: (tab: 'form' | 'board' | 'teacher') => void;
  onOpenHistory: () => void;
  onOpenSheetModal: () => void;
  sheetConfig: GoogleSheetConfig;
  isTeacherAuthenticated: boolean;
  onAuthenticateTeacher: (pin: string) => boolean;
  onTeacherLock?: () => void;
  grade: string;
  classNum: string;
  isPinModalOpen?: boolean;
  onOpenPinModal?: () => void;
  onClosePinModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenHistory,
  onOpenSheetModal,
  sheetConfig,
  isTeacherAuthenticated,
  onAuthenticateTeacher,
  onTeacherLock,
  grade,
  classNum,
  isPinModalOpen,
  onOpenPinModal,
  onClosePinModal
}) => {
  const [internalPinModal, setInternalPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const showPinModal = isPinModalOpen !== undefined ? isPinModalOpen : internalPinModal;
  const setShowPinModal = (open: boolean) => {
    if (open) {
      if (onOpenPinModal) onOpenPinModal();
      else setInternalPinModal(true);
    } else {
      if (onClosePinModal) onClosePinModal();
      else setInternalPinModal(false);
    }
  };

  const handleTeacherTabClick = () => {
    if (isTeacherAuthenticated) {
      onSelectTab('teacher');
    } else {
      setPinInput('');
      setPinError(false);
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError(true);
      return;
    }
    const success = onAuthenticateTeacher(pinInput.trim());
    if (success) {
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
      onSelectTab('teacher');
    } else {
      setPinError(true);
    }
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          
          {/* 로고 & 학급 배지 */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => onSelectTab('form')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                  우리반 토의 의견 나눔판
                </span>
                <span className="hidden sm:inline-block text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {grade}학년 {classNum}반
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                함께 나누고 배우는 초등 학급 생각 나눔터
              </p>
            </div>
          </div>

          {/* 중앙 및 우측 네비게이션 버튼 그룹 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* 1. 의견 쓰기 (학생) */}
            <button
              id="nav-tab-form"
              type="button"
              onClick={() => onSelectTab('form')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'form'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>✏️</span>
              <span className="hidden xs:inline">의견 쓰기</span>
            </button>

            {/* 2. 전체 나눔판 (학생&교사) */}
            <button
              id="nav-tab-board"
              type="button"
              onClick={() => onSelectTab('board')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'board'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>실시간 현황</span>
            </button>

            {/* 3. 내 기록 */}
            <button
              id="nav-open-history-btn"
              type="button"
              onClick={onOpenHistory}
              className="px-2.5 sm:px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">내 기록</span>
            </button>

            {/* 구글 시트 연동 상태 버튼 */}
            <button
              id="nav-sheet-status-btn"
              type="button"
              onClick={onOpenSheetModal}
              title={sheetConfig.isVerified ? '구글 시트 연동 상태: 정상' : '구글 시트 연동 필요'}
              className={`px-2.5 sm:px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                sheetConfig.isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${sheetConfig.isVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden md:inline">
                {sheetConfig.isVerified ? '시트 연동됨' : '시트 연동'}
              </span>
              <span className={`w-2 h-2 rounded-full ${sheetConfig.isVerified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            </button>

            {/* 교사용 대시보드 버튼 */}
            <button
              id="nav-tab-teacher"
              type="button"
              onClick={handleTeacherTabClick}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'teacher'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>교사 모드</span>
            </button>

            {/* 교사 모드 활성화 시 잠금 버튼 */}
            {isTeacherAuthenticated && onTeacherLock && (
              <button
                type="button"
                onClick={onTeacherLock}
                title="교사 모드 잠금 (학생 화면으로 전환)"
                className="px-2.5 py-2 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline text-[11px]">잠금</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* 교사용 비밀번호 확인 모달 */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                선생님 비밀번호 확인
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                교사 모드에 접속하려면 비밀번호를 입력해 주세요.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                id="teacher-pin-input"
                type="password"
                maxLength={20}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="비밀번호 입력"
                className="w-full text-center text-xl font-mono tracking-widest px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:outline-none"
              />

              {pinError && (
                <div className="text-xs text-rose-600 font-bold">
                  비밀번호가 올바르지 않습니다.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
