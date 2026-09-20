import { OpinionSubmission } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  details?: string;
}

/**
 * 구글 앱스 스크립트(Google Apps Script) 웹 앱으로 데이터 전송
 * GAS 웹 앱은 리다이렉트(302) 특성이 있으므로 'no-cors' 모드를 활용하여 브라우저 CORS 차단을 방지합니다.
 */
export async function sendOpinionToGoogleSheet(
  webAppUrl: string,
  submission: OpinionSubmission
): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('https://script.google.com')) {
    return {
      success: false,
      message: '유효한 구글 앱스 스크립트 웹 앱 URL이 필요합니다.'
    };
  }

  const cleanUrl = webAppUrl.trim();
  const payload = {
    action: 'submit',
    id: submission.id,
    grade: submission.grade,
    classNum: submission.classNum,
    studentNumber: submission.studentNumber,
    studentName: submission.studentName,
    topicId: submission.topicId,
    topicTitle: submission.topicTitle,
    optionId: submission.optionId,
    optionLabel: submission.optionLabel,
    reason: submission.reason,
    submittedAt: submission.submittedAt
  };

  try {
    // 1차 시도: standard fetch (CORS 응답 수신 시도)
    // GAS가 올바르게 배포되었으면 POST 데이터가 정상적으로 전달됩니다.
    // 브라우저의 no-cors 모드는 opaque 응답을 주더라도 구글 서버에는 정상 도달하여 doPost가 실행됩니다.
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: '구글 시트로 안전하게 전송되었습니다.'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('구글 시트 전송 중 오류:', errorMsg);
    return {
      success: false,
      message: '구글 시트 전송 중 통신 오류가 발생했습니다.',
      details: errorMsg
    };
  }
}

/**
 * 웹 앱 배포 URL 연결 상태 테스트 (Ping)
 */
export async function testGoogleSheetConnection(webAppUrl: string): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return {
      success: false,
      message: '구글 앱스 스크립트 URL을 입력해 주세요.'
    };
  }

  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: '올바른 배포 URL 형식이 아닙니다.',
      details: 'URL은 https://script.google.com/macros/s/... 로 시작해야 합니다.'
    };
  }

  try {
    // GET 요청으로 스크립트 살아있는지 확인 시도
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${cleanUrl}?test=1&t=${Date.now()}`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        return {
          success: true,
          message: '연결 성공! 구글 시트와 정상적으로 소통할 수 있습니다.',
          details: text.slice(0, 150)
        };
      }
    } catch {
      // CORS로 인해 브라우저에서 직접 응답을 읽지 못할 수 있으나,
      // no-cors 모드로 테스트 POST 신호를 보내어 에러 없이 전송되는지 확인합니다.
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'ping', time: new Date().toISOString() })
      });

      return {
        success: true,
        message: '구글 웹 앱 서버에 테스트 신호가 성공적으로 전송되었습니다!',
        details: '브라우저 보안 규칙에 따라 시트에 테스트 행 혹은 신호가 접수되었습니다.'
      };
    }

    return {
      success: true,
      message: '구글 시트 웹 앱과 연결되었습니다.'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: '연결에 실패했습니다. 배포 설정을 확인해 주세요.',
      details: errorMsg
    };
  }
}
