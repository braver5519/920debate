import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  UserX, 
  CheckCircle2, 
  Lightbulb, 
  Plus, 
  Download, 
  Settings, 
  FileSpreadsheet, 
  Sparkles, 
  Search, 
  Copy, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  AlertTriangle,
  FolderSync
} from 'lucide-react';
import { DiscussionTopic, OpinionSubmission, ClassStudent, GoogleSheetConfig } from '../types';
import { HelpTip } from './HelpTooltip';

interface TeacherDashboardProps {
  topics: DiscussionTopic[];
  activeTopicId: string;
  onSelectTopic: (id: string) => void;
  onCreateTopic: (topic: DiscussionTopic) => void;
  submissions: OpinionSubmission[];
  onDeleteSubmission: (id: string) => void;
  roster: ClassStudent[];
  onSaveRoster: (roster: ClassStudent[]) => void;
  sheetConfig: GoogleSheetConfig;
  onOpenSheetModal: () => void;
  onSyncAllToSheet: () => void;
  isSyncing: boolean;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  topics,
  activeTopicId,
  onSelectTopic,
  onCreateTopic,
  submissions,
  onDeleteSubmission,
  roster,
  onSaveRoster,
  sheetConfig,
  onOpenSheetModal,
  onSyncAllToSheet,
  isSyncing
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'unsubmitted' | 'topic_mgmt' | 'export'>('overview');
  const [showRosterEditor, setShowRosterEditor] = useState(false);
  const [rosterText, setRosterText] = useState(
    roster.map(r => `${r.studentNumber}. ${r.studentName}`).join('\n')
  );
  const [copiedUnsubmitted, setCopiedUnsubmitted] = useState(false);

  // 새 토의 주제 모달 상태
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSituation, setNewSituation] = useState('');
  const [newGuideQuestion, setNewGuideQuestion] = useState('');
  const [newTopicType, setNewTopicType] = useState<'pros_cons' | 'perspective'>('pros_cons');

  const activeTopic = topics.find(t => t.id === activeTopicId) || topics[0];

  // 현재 토의 주제의 제출물들
  const currentSubmissions = useMemo(() => {
    return submissions.filter(s => s.topicId === activeTopic?.id);
  }, [submissions, activeTopic?.id]);

  // 제출한 학생 번호/이름 셋
  const submittedSet = useMemo(() => {
    const set = new Set<string>();
    currentSubmissions.forEach(s => {
      if (s.studentNumber) set.add(s.studentNumber);
      if (s.studentName) set.add(s.studentName.trim());
    });
    return set;
  }, [currentSubmissions]);

  // 미제출 학생 목록 (명렬표와 비교)
  const unsubmittedStudents = useMemo(() => {
    return roster.filter(student => {
      const byNumber = submittedSet.has(student.studentNumber);
      const byName = submittedSet.has(student.studentName.trim());
      return !byNumber && !byName;
    });
  }, [roster, submittedSet]);

  // 통계 계산
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTopic?.options.forEach(opt => {
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
    const rosterTotal = roster.length;
    const participationPercent = rosterTotal > 0 ? Math.round((total / rosterTotal) * 100) : 0;

    // 소수 의견 찾기
    let minCount = Infinity;
    let minorityOptionIds: string[] = [];

    if (total > 0) {
      activeTopic?.options.forEach(opt => {
        const c = counts[opt.id] || 0;
        if (c > 0 && c < minCount) {
          minCount = c;
        }
      });

      if (minCount !== Infinity && minCount < total / 2) {
        minorityOptionIds = (activeTopic?.options || [])
          .filter(opt => (counts[opt.id] || 0) === minCount)
          .map(opt => opt.id);
      }
    }

    return {
      total,
      rosterTotal,
      participationPercent,
      counts,
      minorityOptionIds
    };
  }, [currentSubmissions, activeTopic, roster.length]);

  // 미제출 학생 명단 클립보드 복사
  const handleCopyUnsubmitted = async () => {
    const text = unsubmittedStudents
      .map(s => `${s.studentNumber}번 ${s.studentName}`)
      .join(', ');
    const fullMessage = `[${activeTopic?.title}] 아직 의견을 내지 않은 학생 (${unsubmittedStudents.length}명):\n${text}`;

    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopiedUnsubmitted(true);
      setTimeout(() => setCopiedUnsubmitted(false), 2000);
    } catch {
      alert('복사되었습니다: ' + fullMessage);
    }
  };

  // 명렬표 저장
  const handleSaveRosterText = () => {
    const lines = rosterText.split('\n').map(l => l.trim()).filter(Boolean);
    const newRoster: ClassStudent[] = [];

    lines.forEach((line, index) => {
      // 1. 김철수 또는 1 김철수 또는 그냥 김철수
      const match = line.match(/^(\d+)[\.\s\-\)]*(.+)$/);
      if (match) {
        newRoster.push({
          studentNumber: match[1],
          studentName: match[2].trim()
        });
      } else {
        newRoster.push({
          studentNumber: String(index + 1),
          studentName: line
        });
      }
    });

    if (newRoster.length > 0) {
      onSaveRoster(newRoster);
      setShowRosterEditor(false);
    } else {
      alert('학생 명단을 최소 1명 이상 입력해 주세요.');
    }
  };

  // 새 토의 주제 생성
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('토의 주제 제목을 입력해 주세요.');
      return;
    }

    const newTopic: DiscussionTopic = {
      id: 'topic-' + Date.now(),
      title: newTitle.trim(),
      situation: newSituation.trim() || '우리 반 친구들의 소중한 생각을 들려주세요.',
      guideQuestion: newGuideQuestion.trim() || '내가 그렇게 생각하는 까닭을 구체적으로 적어주세요.',
      type: newTopicType,
      options: newTopicType === 'pros_cons' ? [
        { id: 'opt-agree', label: '찬성해요', color: 'emerald', emoji: '👍' },
        { id: 'opt-disagree', label: '반대해요', color: 'rose', emoji: '👎' },
        { id: 'opt-neutral', label: '절충 / 다른 생각', color: 'amber', emoji: '💡' }
      ] : [
        { id: 'opt-1', label: '1안 (선택 A)', color: 'emerald', emoji: '🟢' },
        { id: 'opt-2', label: '2안 (선택 B)', color: 'sky', emoji: '🔵' },
        { id: 'opt-3', label: '3안 (선택 C)', color: 'amber', emoji: '🟡' },
      ],
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      grade: activeTopic?.grade || '4',
      classNum: activeTopic?.classNum || '2'
    };

    onCreateTopic(newTopic);
    setShowNewTopicModal(false);
    setNewTitle('');
    setNewSituation('');
    setNewGuideQuestion('');
  };

  // CSV 엑셀 다운로드 (UTF-8 BOM 포함)
  const handleExportCSV = () => {
    const headers = ['제출일시', '학년', '반', '번호', '이름', '토의주제', '선택입장', '의견 및 까닭', '좋아요수'];
    const rows = currentSubmissions.map(s => [
      `"${s.submittedAt}"`,
      `"${s.grade}"`,
      `"${s.classNum}"`,
      `"${s.studentNumber}"`,
      `"${s.studentName}"`,
      `"${s.topicTitle.replace(/"/g, '""')}"`,
      `"${s.optionLabel.replace(/"/g, '""')}"`,
      `"${s.reason.replace(/"/g, '""')}"`,
      s.likes
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `토의의견_${activeTopic?.title.slice(0, 15)}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* 1. 상단 대시보드 타이틀 및 구글 시트 연동 상태 바 */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  교사용 대시보드
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {activeTopic?.grade}학년 {activeTopic?.classNum}반
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                학급 토의 의견 수렴 및 시트 관리
              </h1>
            </div>
          </div>

          {/* 우측 빠른 설정 버튼들 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 구글 시트 연동 버튼 (배지 포함) */}
            <button
              id="dashboard-open-sheet-config-btn"
              type="button"
              onClick={onOpenSheetModal}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                sheetConfig.isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-2 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${sheetConfig.isVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>
                {sheetConfig.isVerified ? '구글 시트 연동됨 🟢' : '구글 시트 연동하기 ⚠️'}
              </span>
            </button>

            {/* 새 주제 만들기 버튼 */}
            <button
              id="create-new-topic-btn"
              type="button"
              onClick={() => setShowNewTopicModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 토의 주제</span>
            </button>
          </div>
        </div>

        {/* 현재 활성 토의 주제 선택 셀렉터 */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-500 shrink-0">
              현재 선택된 주제:
            </span>
            <select
              id="active-topic-selector"
              value={activeTopic?.id}
              onChange={(e) => onSelectTopic(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xl truncate"
            >
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.createdAt})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>엑셀(CSV) 저장</span>
            </button>
            <button
              type="button"
              onClick={onSyncAllToSheet}
              disabled={isSyncing || !sheetConfig.webAppUrl}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>시트로 전체 전송</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 주요 핵심 지표 4개 (Requirement 3: 전체 의견 분포, 소수 의견, 미제출 학생) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 전체 참여율 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            참여율
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">{stats.participationPercent}%</span>
              <span className="text-xs text-slate-400">({stats.total}/{stats.rosterTotal}명)</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.participationPercent}%` }} />
          </div>
        </div>

        {/* 제출 완료 학생 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            제출 완료 학생
          </span>
          <div className="my-2">
            <span className="text-3xl font-black text-emerald-600">{stats.total}</span>
            <span className="text-xs text-slate-400 ml-1">명 완료</span>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
            실시간 집계 중
          </span>
        </div>

        {/* 미제출 학생 (Requirement 3) */}
        <div 
          onClick={() => setActiveTab('unsubmitted')}
          className="bg-white p-5 rounded-3xl border-2 border-rose-200 hover:border-rose-400 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:bg-rose-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <UserX className="w-4 h-4 text-rose-600" />
              아직 미제출 학생
            </span>
            <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              클릭하여 명단 확인
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-rose-600">{unsubmittedStudents.length}</span>
            <span className="text-xs text-slate-400 ml-1">명 남음</span>
          </div>
          <span className="text-[11px] text-rose-700 underline font-semibold">
            명단 확인 및 호명하기 &rarr;
          </span>
        </div>

        {/* 소수 의견 수 (Requirement 3) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            소수 의견 비율
          </span>
          <div className="my-2">
            <span className="text-3xl font-black text-amber-600">
              {stats.minorityOptionIds.length > 0 
                ? (stats.counts[stats.minorityOptionIds[0]] || 0)
                : 0}
            </span>
            <span className="text-xs text-slate-400 ml-1">명 (새로운 시각)</span>
          </div>
          <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
            소수 의견 존중 및 토의 지도
          </span>
        </div>
      </div>

      {/* 3. 대시보드 탭 네비게이션 */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📊 전체 의견 및 소수 의견 분석
        </button>
        <button
          id="tab-unsubmitted-btn"
          type="button"
          onClick={() => setActiveTab('unsubmitted')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'unsubmitted'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>미제출 학생 명단 ({unsubmittedStudents.length}명)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('topic_mgmt')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'topic_mgmt'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ⚙️ 토의 주제 관리 ({topics.length}개)
        </button>
      </div>

      {/* Tab 1: 전체 의견 및 소수 의견 분석 (Requirement 3) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 소수 의견 집중 스포트라이트 배너 */}
          {stats.minorityOptionIds.length > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      소수 의견 스포트라이트 💡
                    </span>
                    <span className="text-xs font-semibold text-amber-800">
                      토의 지도 추천
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-amber-950 mt-1">
                    다수의 생각과 다른 관점을 가진 친구들의 목소리를 들어보세요!
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed">
                    선생님 Tip: 소수의견을 낸 학생이 위축되지 않도록 "새롭고 창의적인 관점을 열어주어서 고마워요"라고 격려하며 발표 기회를 주면 교실 토의가 더욱 풍성해집니다.
                  </p>

                  {/* 소수 의견 제출자들의 의견 목록 */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSubmissions
                      .filter(s => stats.minorityOptionIds.includes(s.optionId))
                      .map(sub => (
                        <div key={sub.id} className="p-3.5 bg-white/90 rounded-2xl border border-amber-200 text-xs sm:text-sm">
                          <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                            <span>{sub.studentNumber}번 {sub.studentName}</span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-black">
                              {sub.optionLabel}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{sub.reason}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 제출된 의견 테이블 & 관리 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>제출된 학생 의견 전체 목록</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {currentSubmissions.length}개
                </span>
              </h3>
            </div>

            {currentSubmissions.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                아직 제출된 의견이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                      <th className="py-3 px-3">번호/이름</th>
                      <th className="py-3 px-3">선택 입장</th>
                      <th className="py-3 px-3">작성한 까닭 (의견)</th>
                      <th className="py-3 px-3">시간</th>
                      <th className="py-3 px-3 text-center">공감</th>
                      <th className="py-3 px-3 text-right">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {sub.studentNumber ? `${sub.studentNumber}번 ` : ''}{sub.studentName}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800">
                            {sub.optionLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 max-w-md">
                          <p className="line-clamp-2">{sub.reason}</p>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 text-xs whitespace-nowrap">
                          {sub.submittedAt.slice(11)}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-rose-600 whitespace-nowrap">
                          ❤️ {sub.likes}
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`'${sub.studentName}' 학생의 의견을 삭제하시겠습니까?`)) {
                                onDeleteSubmission(sub.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: 미제출 학생 명단 (Requirement 3) */}
      {activeTab === 'unsubmitted' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                    <UserX className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    아직 의견을 제출하지 않은 학생 ({unsubmittedStudents.length}명)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  명렬표와 실시간 비교하여 아직 제출하지 않은 학생들을 안내합니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyUnsubmitted}
                  disabled={unsubmittedStudents.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUnsubmitted ? '명단 복사 완료!' : '미제출 명단 복사하기'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRosterEditor(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>학급 명렬표 수정</span>
                </button>
              </div>
            </div>

            {/* 미제출 학생 칩 카드들 */}
            {unsubmittedStudents.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <h4 className="font-bold text-base">축하합니다! 우리 반 모든 학생이 의견을 제출했습니다 🎉</h4>
                <p className="text-xs sm:text-sm mt-1">활발한 토의가 이루어지고 있습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {unsubmittedStudents.map(student => (
                  <div
                    key={student.studentNumber}
                    className="p-3 rounded-2xl border border-rose-200 bg-rose-50/40 text-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center">
                        {student.studentNumber}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {student.studentName}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-500">
                      미제출
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 전체 출석 및 제출 진행 현황 바 */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                학급 전체 학생별 제출 상태 현황판
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {roster.map(student => {
                  const isDone = !unsubmittedStudents.some(u => u.studentNumber === student.studentNumber);
                  const sub = currentSubmissions.find(s => s.studentNumber === student.studentNumber || s.studentName === student.studentName);

                  return (
                    <div
                      key={student.studentNumber}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <span className="font-bold">
                        {student.studentNumber}. {student.studentName}
                      </span>
                      {isDone ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          완료 ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          대기
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <HelpTip title="미제출 학생 독려하기 이렇게 하면 돼요!" variant="amber">
            <p>
              1. <strong>[미제출 명단 복사하기]</strong> 버튼을 누르면 안 낸 학생들의 번호와 이름이 한 번에 복사됩니다.<br />
              2. 칠판 앞 화면에 띄우거나 "5번, 11번 친구 아직 작성 중인가요?" 하고 부드럽게 독려해 주세요!
            </p>
          </HelpTip>
        </div>
      )}

      {/* Tab 3: 토의 주제 관리 (Topic Management) */}
      {activeTab === 'topic_mgmt' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                등록된 토의 주제 목록 ({topics.length}개)
              </h3>
              <button
                type="button"
                onClick={() => setShowNewTopicModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>새 토의 주제 등록</span>
              </button>
            </div>

            <div className="space-y-3">
              {topics.map(t => {
                const isCurrent = t.id === activeTopic?.id;
                const count = submissions.filter(s => s.topicId === t.id).length;

                return (
                  <div
                    key={t.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black">
                            현재 진행 중인 주제
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{t.createdAt} 생성</span>
                        <span className="text-xs font-semibold text-slate-500">
                          제출 의견: {count}개
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">
                        {t.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {t.situation}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => onSelectTopic(t.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
                        >
                          이 주제로 진행하기
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 명렬표 수정 모달 */}
      {showRosterEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              학급 명렬표 수정 (학생 번호 및 이름)
            </h3>
            <p className="text-xs text-slate-500">
              한 줄에 한 명씩 '번호. 이름' 또는 '이름' 형식으로 입력해 주세요.
            </p>
            <textarea
              rows={10}
              value={rosterText}
              onChange={(e) => setRosterText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="1. 강민준&#10;2. 김도윤&#10;3. 김서연"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRosterEditor(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveRosterText}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 토의 주제 생성 모달 */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              새로운 학급 토의 주제 만들기
            </h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  토의 주제 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 급식 시간에 음악을 틀어주는 것에 찬성하나요, 반대하나요?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  배경 상황 설명 (초등학생 눈높이)
                </label>
                <textarea
                  rows={3}
                  value={newSituation}
                  onChange={(e) => setNewSituation(e.target.value)}
                  placeholder="예: 점심시간에 신나는 음악을 들으며 밥을 먹으면 기분이 좋다는 의견과, 시끄러워서 대화하기 어렵다는 의견이 있어요."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  생각해 볼 점 (가이드 질문)
                </label>
                <input
                  type="text"
                  value={newGuideQuestion}
                  onChange={(e) => setNewGuideQuestion(e.target.value)}
                  placeholder="예: 모두가 편안하게 식사하려면 어떤 규칙이 필요할까요?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  토의 유형 선택
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTopicType('pros_cons')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      newTopicType === 'pros_cons'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    👍 찬반 토의 (찬성 / 반대 / 절충)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTopicType('perspective')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      newTopicType === 'perspective'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🎯 3선택지 관점 토의 (1안 / 2안 / 3안)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  토의 주제 만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
