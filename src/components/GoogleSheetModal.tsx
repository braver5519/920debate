import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  Table, 
  Code2, 
  Rocket, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { GoogleSheetConfig, OpinionSubmission } from '../types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../data/initialData';
import { testGoogleSheetConnection, sendOpinionToGoogleSheet } from '../utils/googleSheetSync';
import { HelpTip } from './HelpTooltip';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  onSaveConfig: (config: GoogleSheetConfig) => void;
  submissions: OpinionSubmission[];
  onSubmissionsUpdated?: (submissions: OpinionSubmission[]) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  submissions,
  onSubmissionsUpdated
}) => {
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncAllMessage, setSyncAllMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showFullCode, setShowFullCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = GOOGLE_APPS_SCRIPT_TEMPLATE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({
        success: false,
        message: '구글 앱스 스크립트 웹 앱 URL을 먼저 입력해 주세요!'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testGoogleSheetConnection(url);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      const updatedConfig: GoogleSheetConfig = {
        ...config,
        webAppUrl: url.trim(),
        lastTestedAt: new Date().toLocaleString('ko-KR'),
        isVerified: true,
        autoSync: autoSync
      };
      onSaveConfig(updatedConfig);
    }
  };

  const handleSave = () => {
    const updatedConfig: GoogleSheetConfig = {
      ...config,
      webAppUrl: url.trim(),
      autoSync: autoSync,
      isVerified: testResult?.success ?? config.isVerified
    };
    onSaveConfig(updatedConfig);
    onClose();
  };

  const handleSyncAllSubmissions = async () => {
    if (!url.trim()) {
      alert('먼저 웹 앱 URL을 등록하고 테스트를 완료해 주세요.');
      return;
    }

    setIsSyncingAll(true);
    setSyncAllMessage(null);
    let successCount = 0;

    for (const sub of submissions) {
      const res = await sendOpinionToGoogleSheet(url, sub);
      if (res.success) {
        successCount++;
      }
    }

    setIsSyncingAll(false);
    setSyncAllMessage(`총 ${submissions.length}개 중 ${successCount}개의 의견을 시트로 전송 완료했습니다!`);

    if (onSubmissionsUpdated) {
      const updated = submissions.map(s => ({ ...s, syncedToSheet: true }));
      onSubmissionsUpdated(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="google-sheet-modal-container"
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            id="close-sheet-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wide">
                  선생님 전용 설정
                </span>
                {config.isVerified && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 연동됨
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
                구글 스프레드시트 실시간 연동 설정
              </h2>
            </div>
          </div>
          <p className="text-emerald-50 text-xs sm:text-sm mt-2 font-medium leading-relaxed">
            학생들이 제출한 소중한 의견이 선생님의 구글 시트로 즉시 자동 기록됩니다. 아래 3단계 안내를 그대로 따라해 보세요!
          </p>
        </div>

        {/* 바디 스크롤 영역 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
          
          {/* 전체 진행 3단계 네비게이션 카드 */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeStep === 1 
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">1</span>
              <span>시트 & 스크립트</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeStep === 2 
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">2</span>
              <span>Code.gs 복사</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeStep === 3 
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">3</span>
              <span>배포 & 링크 등록</span>
            </button>
          </div>

          {/* 1단계 안내 카드 */}
          <div className={`p-5 rounded-2xl border transition-all ${activeStep === 1 ? 'border-emerald-400 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-200' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  ①
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    구글 시트 새로 만들기 & Apps Script 열기
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    의견을 저장할 구글 시트를 만들고 스크립트 편집기를 엽니다.
                  </p>
                </div>
              </div>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-2xs shrink-0"
              >
                <span>새 시트 바로 열기</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-4 pl-12 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">가</span>
                <span>위 <strong>[새 시트 바로 열기]</strong> 버튼을 누르거나, 구글 드라이브에서 빈 스프레드시트를 하나 만듭니다. (시트 이름 예: <em>4학년 2반 토의 의견함</em>)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">나</span>
                <span>스프레드시트 상단 메뉴에서 <strong>[확장 프로그램] ➔ [Apps Script]</strong>를 클릭하세요. 새 탭으로 편집기 화면이 열립니다.</span>
              </div>
            </div>

            <HelpTip title="선생님을 위한 쉬운 팁!" variant="blue">
              <p>시트에 미리 칸(표)을 만들지 않아도 돼요! 이 스크립트가 첫 번째 줄에 <strong>[제출일시, 학년, 반, 번호, 이름, 토의주제, 선택입장, 의견 및 까닭]</strong> 머리글을 예쁜 파란색으로 알아서 자동으로 만들어줍니다.</p>
            </HelpTip>
          </div>

          {/* 2단계 안내 카드 */}
          <div className={`p-5 rounded-2xl border transition-all ${activeStep === 2 ? 'border-emerald-400 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-200' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  ②
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Code.gs 코드 복사하고 붙여넣기
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    준비된 전송 코드를 복사해서 Apps Script 화면에 그대로 붙여넣습니다.
                  </p>
                </div>
              </div>

              <button
                id="copy-gas-code-btn"
                type="button"
                onClick={handleCopyCode}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs shrink-0 ${
                  isCopied
                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200 hover:scale-[1.02]'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>복사 완료! (붙여넣기 하세요)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Code.gs 코드 전체 복사하기</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 pl-12 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">가</span>
                <span>열린 Apps Script 창의 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-xs">Code.gs</code> 파일 안에 적혀있는 기본 글씨(<code className="text-xs">function myFunction()...</code>)를 <strong>모두 지우고 빈 화면</strong>으로 만듭니다.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">나</span>
                <span>위 <strong>[Code.gs 코드 전체 복사하기]</strong> 버튼을 누른 뒤, 빈 화면에 <strong>붙여넣기(Ctrl + V 또는 Cmd + V)</strong> 하세요.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">다</span>
                <span>상단 툴바의 <strong>디스크 모양 아이콘(💾 프로젝트 저장)</strong>을 꼭 눌러주세요!</span>
              </div>
            </div>

            {/* 코드 열어보기 토글 */}
            <div className="mt-3 pl-12">
              <button
                type="button"
                onClick={() => setShowFullCode(!showFullCode)}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline flex items-center gap-1"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showFullCode ? '코드 미리보기 숨기기' : '복사할 코드 내용 직접 확인하기'}</span>
              </button>

              {showFullCode && (
                <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs max-h-48 overflow-y-auto border border-slate-700">
                  <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
                </div>
              )}
            </div>
          </div>

          {/* 3단계 안내 카드 */}
          <div className={`p-5 rounded-2xl border transition-all ${activeStep === 3 ? 'border-emerald-400 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-200' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                ③
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  웹 앱으로 배포하고 링크 가져오기
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  코드를 웹 앱으로 배포하여 학생들이 어디서든 제출할 수 있는 통로를 만듭니다.
                </p>
              </div>
            </div>

            <div className="mt-4 pl-12 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">가</span>
                <span>Apps Script 우측 상단의 파란색 <strong>[배포] ➔ [새 배포]</strong>를 누릅니다.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">나</span>
                <span>왼쪽 톱니바퀴 [유형 선택]에서 <strong>[웹 앱(Web app)]</strong>을 선택합니다.</span>
              </div>
              
              {/* 핵심 주의사항 배너 */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 my-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm mb-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>⚠️ 가장 중요한 부분! (꼭 확인하세요)</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-amber-950 font-medium">
                  <li><strong>다음 사용자 계정으로 실행:</strong> <span className="underline">나 (내 이메일)</span> 그대로 유지</li>
                  <li><strong>액세스 권한이 있는 사용자:</strong> 반드시 <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">모든 사용자(Anyone)</span> 로 변경해 주세요!</li>
                </ul>
                <p className="text-xs text-amber-800 mt-1.5">
                  * 학생들은 구글 계정 로그인이 없어도 시트에 글을 쓸 수 있어야 하므로 꼭 '모든 사용자'로 선택해야 합니다.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">다</span>
                <span>파란색 <strong>[배포]</strong> 버튼을 누릅니다. (구글 권한 승인 창이 뜨면 <strong>[액세스 승인] ➔ 내 계정 선택 ➔ [고급] ➔ [제목 없는 프로젝트(안전하지 않음)으로 이동] ➔ [허용]</strong>을 차례로 클릭합니다.)</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">라</span>
                <span>배포가 완료되면 화면에 표시되는 <strong>[웹 앱 URL]</strong>(복사 아이콘)을 복사해 아래 입력 칸에 넣어주세요!</span>
              </div>
            </div>
          </div>

          {/* 배포 URL 입력 및 연결 테스트 박스 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-300 shadow-xs">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-600" />
              <span>배포된 웹 앱 URL 등록 및 연결 테스트</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Apps Script에서 복사한 웹 앱 URL을 붙여넣고 [연동 상태 테스트하기]를 눌러보세요.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  웹 앱 배포 URL (Web App URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="web-app-url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono bg-white shadow-2xs"
                  />
                  <button
                    id="test-sheet-connection-btn"
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !url.trim()}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>연결 테스트 중...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>연동 상태 테스트하기</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 테스트 결과 안내창 */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm transition-all ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {testResult.success ? '🎉 구글 시트 연결 성공!' : '⚠️ 연결 실패: 설정을 다시 확인해 주세요'}
                      </h4>
                      <p className="mt-1">{testResult.message}</p>
                      {testResult.details && (
                        <p className="mt-1 font-mono text-xs opacity-80">{testResult.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 자동 전송 옵션 */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>학생이 의견을 제출할 때마다 구글 시트로 실시간 자동 저장</span>
                </label>

                {submissions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncAllSubmissions}
                    disabled={isSyncingAll || !url.trim()}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSyncingAll ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>현재 모인 의견 ({submissions.length}개) 시트로 일괄 전송</span>
                  </button>
                )}
              </div>

              {syncAllMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium">
                  {syncAllMessage}
                </div>
              )}
            </div>
          </div>

          {/* 문제 해결 FAQ 카드 */}
          <HelpTip title="오류가 나거나 저장이 안 될 땐 이렇게 해보세요!" variant="amber">
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
              <li>• <strong>배포 후 링크 끝자리:</strong> 웹 앱 URL은 반드시 <code className="bg-amber-100 px-1 rounded font-mono">/exec</code> 로 끝나야 합니다. (<code className="bg-amber-100 px-1 rounded font-mono">/edit</code> 는 편집기 링크이므로 안 돼요!)</li>
              <li>• <strong>코드를 수정한 경우:</strong> Apps Script에서 코드를 수정하셨다면, 꼭 다시 우측 상단 <strong>[배포] ➔ [새 배포]</strong>를 눌러야 새 코드가 적용됩니다.</li>
              <li>• <strong>모든 사용자 권한:</strong> 배포 시 [액세스 권한]이 '나만'으로 되어 있으면 학생들의 제출이 막힙니다. 꼭 '모든 사용자(Anyone)'로 되어 있는지 확인해 주세요.</li>
            </ul>
          </HelpTip>

        </div>

        {/* 하단 버튼 바 */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {config.lastTestedAt ? (
              <span>마지막 연결 성공: {config.lastTestedAt}</span>
            ) : (
              <span>아직 연결 테스트가 진행되지 않았습니다.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-colors"
            >
              닫기
            </button>
            <button
              id="save-sheet-config-btn"
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>설정 완료 및 저장</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
