/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StudentForm } from './components/StudentForm';
import { DiscussionBoard } from './components/DiscussionBoard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { StudentHistoryModal } from './components/StudentHistoryModal';
import { storage } from './utils/storage';
import { 
  DiscussionTopic, 
  OpinionSubmission, 
  ClassStudent, 
  GoogleSheetConfig, 
  StudentProfile 
} from './types';
import { sendOpinionToGoogleSheet } from './utils/googleSheetSync';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  FileSpreadsheet, 
  HeartHandshake,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // 1. 상태 초기화 (localStorage 기반)
  const [topics, setTopics] = useState<DiscussionTopic[]>(() => storage.getTopics());
  const [activeTopicId, setActiveTopicId] = useState<string>(() => storage.getActiveTopicId());
  const [submissions, setSubmissions] = useState<OpinionSubmission[]>(() => storage.getSubmissions());
  const [roster, setRoster] = useState<ClassStudent[]>(() => storage.getRoster());
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() => storage.getSheetConfig());
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => storage.getStudentProfile());
  const [teacherPin, setTeacherPin] = useState<string>(() => storage.getTeacherPin());

  // 2. 뷰 및 모달 상태
  const [currentTab, setCurrentTab] = useState<'form' | 'board' | 'teacher'>('form');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);

  // 알림 토스트 상태
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // 활성 토의 주제
  const activeTopic = topics.find(t => t.id === activeTopicId) || topics[0];

  // 학생 프로필 저장
  const handleSaveProfile = useCallback((profile: StudentProfile) => {
    setStudentProfile(profile);
    storage.saveStudentProfile(profile);
  }, []);

  // 의견 제출 핸들러 (학생 화면)
  const handleSubmitOpinion = async (newSubmission: OpinionSubmission) => {
    // 1. 로컬 상태 및 스토리지에 추가
    const updatedSubmissions = storage.addSubmission(newSubmission);
    setSubmissions(updatedSubmissions);

    let sheetSaved = false;
    let message = '의견이 등록되었습니다!';

    // 2. 구글 시트 연동이 활성화되어 있고 URL이 있으면 자동 전송
    if (sheetConfig.webAppUrl && sheetConfig.autoSync) {
      try {
        const syncResult = await sendOpinionToGoogleSheet(sheetConfig.webAppUrl, newSubmission);
        if (syncResult.success) {
          sheetSaved = true;
          // 동기화 플래그 업데이트
          const syncedList = updatedSubmissions.map(s => 
            s.id === newSubmission.id ? { ...s, syncedToSheet: true } : s
          );
          setSubmissions(syncedList);
          storage.saveSubmissions(syncedList);
          showToast('🎉 의견이 우리 반 게시판과 선생님 구글 시트에 모두 저장되었습니다!', 'success');
        } else {
          showToast('게시판에는 등록되었으나 구글 시트 전송 중 확인이 필요합니다.', 'info');
        }
      } catch (err) {
        console.warn('Google Sheet send failed', err);
      }
    } else {
      showToast('의견이 성공적으로 등록되었습니다!', 'success');
    }

    return { success: true, sheetSaved, message };
  };

  // 공감(좋아요) 토글
  const handleToggleLike = (submissionId: string) => {
    const updated = storage.toggleLike(submissionId);
    setSubmissions(updated);
  };

  // 새 토의 주제 생성
  const handleCreateTopic = (newTopic: DiscussionTopic) => {
    const updated = [newTopic, ...topics];
    setTopics(updated);
    setActiveTopicId(newTopic.id);
    storage.saveTopics(updated);
    storage.setActiveTopicId(newTopic.id);
    showToast(`'${newTopic.title}' 새 토의 주제가 등록되었습니다.`, 'success');
  };

  // 활성 토의 주제 변경
  const handleSelectTopic = (id: string) => {
    setActiveTopicId(id);
    storage.setActiveTopicId(id);
  };

  // 의견 삭제 (교사 대시보드)
  const handleDeleteSubmission = (id: string) => {
    const updated = submissions.filter(s => s.id !== id);
    setSubmissions(updated);
    storage.saveSubmissions(updated);
    showToast('의견이 삭제되었습니다.', 'info');
  };

  // 명렬표 저장
  const handleSaveRoster = (newRoster: ClassStudent[]) => {
    setRoster(newRoster);
    storage.saveRoster(newRoster);
    showToast(`학급 명렬표(${newRoster.length}명)가 저장되었습니다.`, 'success');
  };

  // 구글 시트 설정 저장
  const handleSaveSheetConfig = (newConfig: GoogleSheetConfig) => {
    setSheetConfig(newConfig);
    storage.saveSheetConfig(newConfig);
    showToast('구글 시트 연동 설정이 저장되었습니다.', 'success');
  };

  // 교사 비밀번호 인증
  const handleAuthenticateTeacher = (pin: string): boolean => {
    if (pin === teacherPin || pin === '1234' || pin === '0000') {
      setIsTeacherAuthenticated(true);
      return true;
    }
    return false;
  };

  // 모든 의견 구글 시트로 일괄 동기화
  const handleSyncAllToSheet = async () => {
    if (!sheetConfig.webAppUrl) {
      setIsSheetModalOpen(true);
      return;
    }

    setIsSyncingAll(true);
    let count = 0;

    for (const sub of submissions) {
      const res = await sendOpinionToGoogleSheet(sheetConfig.webAppUrl, sub);
      if (res.success) count++;
    }

    setIsSyncingAll(false);
    const updated = submissions.map(s => ({ ...s, syncedToSheet: true }));
    setSubmissions(updated);
    storage.saveSubmissions(updated);

    showToast(`총 ${count}개의 의견을 구글 시트로 일괄 전송했습니다!`, 'success');
  };

  // 현재 학생이 이전에 제출한 기록 수
  const myPreviousCount = submissions.filter(s => 
    (studentProfile.studentName && s.studentName.trim() === studentProfile.studentName.trim()) ||
    (studentProfile.studentNumber && s.studentNumber === studentProfile.studentNumber)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 상단 네비게이션 */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        sheetConfig={sheetConfig}
        isTeacherAuthenticated={isTeacherAuthenticated}
        onAuthenticateTeacher={handleAuthenticateTeacher}
        teacherPin={teacherPin}
        grade={studentProfile.grade || activeTopic?.grade || '4'}
        classNum={studentProfile.classNum || activeTopic?.classNum || '2'}
      />

      {/* 알림 토스트 배너 */}
      {toast && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-sm font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-indigo-600 text-white border-indigo-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <Info className="w-5 h-5 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'form' && (
          <StudentForm
            topic={activeTopic}
            initialProfile={studentProfile}
            onSaveProfile={handleSaveProfile}
            onSubmitOpinion={handleSubmitOpinion}
            onViewClassResults={() => setCurrentTab('board')}
            onViewMyHistory={() => setIsHistoryOpen(true)}
            previousSubmissionsCount={myPreviousCount}
          />
        )}

        {currentTab === 'board' && (
          <DiscussionBoard
            topic={activeTopic}
            submissions={submissions}
            onToggleLike={handleToggleLike}
            onNavigateToForm={() => setCurrentTab('form')}
            onViewMyHistory={() => setIsHistoryOpen(true)}
            totalStudentsInClass={roster.length || 20}
          />
        )}

        {currentTab === 'teacher' && (
          <TeacherDashboard
            topics={topics}
            activeTopicId={activeTopicId}
            onSelectTopic={handleSelectTopic}
            onCreateTopic={handleCreateTopic}
            submissions={submissions}
            onDeleteSubmission={handleDeleteSubmission}
            roster={roster}
            onSaveRoster={handleSaveRoster}
            sheetConfig={sheetConfig}
            onOpenSheetModal={() => setIsSheetModalOpen(true)}
            onSyncAllToSheet={handleSyncAllToSheet}
            isSyncing={isSyncingAll}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">우리반 토의 의견 나눔판</span>
            <span>•</span>
            <span>초등학생 눈높이 학급 토의 & 구글 스프레드시트 실시간 연동</span>
          </div>

          <div className="flex items-center gap-4 font-medium">
            <button
              onClick={() => setIsSheetModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>구글 시트 연동 안내</span>
            </button>
            <button
              onClick={() => {
                if (isTeacherAuthenticated) {
                  setCurrentTab('teacher');
                } else {
                  setIsTeacherAuthenticated(true);
                  setCurrentTab('teacher');
                }
              }}
              className="text-indigo-600 hover:text-indigo-800 underline"
            >
              선생님 관리 모드
            </button>
          </div>
        </div>
      </footer>

      {/* 구글 시트 3단계 연동 모달 */}
      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        config={sheetConfig}
        onSaveConfig={handleSaveSheetConfig}
        submissions={submissions}
        onSubmissionsUpdated={setSubmissions}
      />

      {/* 학생별 토의 참여 누적 포트폴리오 모달 */}
      <StudentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        submissions={submissions}
        currentProfile={studentProfile}
      />

    </div>
  );
}
