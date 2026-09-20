import { DiscussionTopic, OpinionSubmission, ClassStudent } from '../types';

export const CONFIGURED_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxvHY1PDag863nsOIvo5xv8i9ogBHRGSusixkYs08L4Jby34MfPZq39qikGgU4X9kZ8/exec';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * [우리반 토의 의견 나눔판] 구글 시트 연동 스크립트 (Code.gs)
 * 
 * 💡 이 코드를 복사해서 구글 스프레드시트의 [확장 프로그램] > [Apps Script] 창에 
 * 기존 내용을 지우고 그대로 붙여넣은 뒤 [배포] > [새 배포]를 진행해 주세요.
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // 1. 시트가 비어있다면 첫 번째 줄에 머리글(헤더)을 자동으로 만듭니다.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "제출일시", 
        "학년", 
        "반", 
        "번호", 
        "이름", 
        "토의주제", 
        "선택입장", 
        "의견 및 까닭", 
        "제출ID"
      ]);
      // 헤더 스타일링 (색상 및 굵게)
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#E0F2FE"); // 연한 파란색
      sheet.setFrozenRows(1);
    }

    // 2. 전달받은 데이터 파싱 (JSON 또는 Form 데이터 모두 지원)
    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // 3. 테스트 연결 신호인지 확인
    if (data.action === "ping" || data.action === "test") {
      return ContentService.createTextOutput(
        JSON.stringify({ 
          status: "success", 
          message: "구글 시트와 성공적으로 연결되었습니다!",
          sheetName: sheet.getName(),
          time: new Date().toLocaleString("ko-KR")
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. 학생 의견 데이터 한 행 추가
    var now = new Date();
    var timeString = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
      timeString,
      data.grade || "",
      data.classNum || "",
      data.studentNumber || "",
      data.studentName || "",
      data.topicTitle || "",
      data.optionLabel || "",
      data.reason || "",
      data.id || ""
    ]);

    // 5. 성공 응답 반환
    return ContentService.createTextOutput(
      JSON.stringify({ 
        status: "success", 
        message: "성공적으로 구글 시트에 기록되었습니다.",
        student: data.studentName,
        row: sheet.getLastRow()
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ 
        status: "error", 
        message: error.toString() 
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // 브라우저에서 직접 링크를 열었을 때 안내 문구
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "ready",
      message: "우리반 토의 의견 나눔판 웹 앱 스크립트가 정상적으로 작동 중입니다. 웹페이지에서 배포 URL을 등록해 주세요!",
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
`;

export const INITIAL_TOPICS: DiscussionTopic[] = [
  {
    id: 'topic-1',
    title: '우리 반 자리 바꾸기를 한 달에 한 번씩 제비뽑기로 하는 것에 찬성하나요, 반대하나요?',
    situation: '현재 우리 반은 짝꿍과 자리를 매달 한 번씩 제비뽑기로 정하고 있어요. 공평하다는 의견도 있고, 키나 시력, 친한 친구와 앉고 싶은 마음 때문에 고민이라는 의견도 있습니다.',
    guideQuestion: '내가 그렇게 생각하는 까닭을 구체적인 경험이나 이유와 함께 말해주세요.',
    type: 'pros_cons',
    options: [
      {
        id: 'opt-agree',
        label: '찬성해요 (제비뽑기가 좋아요)',
        color: 'emerald',
        emoji: '👍',
        description: '골고루 여러 친구와 친해질 수 있고 공평해요.'
      },
      {
        id: 'opt-disagree',
        label: '반대해요 (다른 방법이 필요해요)',
        color: 'rose',
        emoji: '👎',
        description: '키나 시력, 공부 분위기를 고려해서 정하면 좋겠어요.'
      },
      {
        id: 'opt-neutral',
        label: '절충/기타 (새로운 규칙이 필요해요)',
        color: 'amber',
        emoji: '💡',
        description: '제비뽑기를 기본으로 하되, 특별한 사정은 배려해주면 좋겠어요.'
      }
    ],
    isActive: true,
    createdAt: '2026-09-20',
    grade: '4',
    classNum: '2'
  },
  {
    id: 'topic-2',
    title: '쉬는 시간에 교실에서 보드게임 놀이를 허용하는 것에 찬성하나요, 반대하나요?',
    situation: '비가 오는 날이나 쉬는 시간에 교실에서 다 함께 보드게임을 하면 즐겁다는 친구들도 있지만, 소음이 크거나 부품을 잃어버려서 다툼이 생기기도 해요.',
    guideQuestion: '우리 반 친구들 모두가 즐겁고 안전하게 지내려면 어떤 선택이 좋을까요?',
    type: 'pros_cons',
    options: [
      {
        id: 'opt-agree',
        label: '찬성해요 (보드게임 좋아요)',
        color: 'emerald',
        emoji: '🎲',
        description: '친구들과 협동하며 재미있게 놀 수 있어요.'
      },
      {
        id: 'opt-disagree',
        label: '반대해요 (보드게임은 어려워요)',
        color: 'rose',
        emoji: '🚫',
        description: '교실이 너무 시끄러워지고 정리하기 힘들어요.'
      },
      {
        id: 'opt-neutral',
        label: '조건부 찬성 (규칙을 정해서 해요)',
        color: 'indigo',
        emoji: '⚖️',
        description: '점심시간에만 하고, 정리 당번을 정하면 좋겠어요.'
      }
    ],
    isActive: false,
    createdAt: '2026-09-15',
    grade: '4',
    classNum: '2'
  }
];

export const INITIAL_ROSTER: ClassStudent[] = [
  { studentNumber: '1', studentName: '강민준' },
  { studentNumber: '2', studentName: '김도윤' },
  { studentNumber: '3', studentName: '김서연' },
  { studentNumber: '4', studentName: '김하은' },
  { studentNumber: '5', studentName: '박서준' },
  { studentNumber: '6', studentName: '박지우' },
  { studentNumber: '7', studentName: '배수아' },
  { studentNumber: '8', studentName: '송민호' },
  { studentNumber: '9', studentName: '신예은' },
  { studentNumber: '10', studentName: '오지훈' },
  { studentNumber: '11', studentName: '윤도현' },
  { studentNumber: '12', studentName: '이서윤' },
  { studentNumber: '13', studentName: '이시우' },
  { studentNumber: '14', studentName: '이지안' },
  { studentNumber: '15', studentName: '임하린' },
  { studentNumber: '16', studentName: '장우진' },
  { studentNumber: '17', studentName: '정유나' },
  { studentNumber: '18', studentName: '조은우' },
  { studentNumber: '19', studentName: '최예준' },
  { studentNumber: '20', studentName: '한지민' },
];

export const INITIAL_SUBMISSIONS: OpinionSubmission[] = [
  {
    id: 'sub-1',
    topicId: 'topic-1',
    topicTitle: '우리 반 자리 바꾸기를 한 달에 한 번씩 제비뽑기로 하는 것에 찬성하나요, 반대하나요?',
    grade: '4',
    classNum: '2',
    studentNumber: '3',
    studentName: '김서연',
    optionId: 'opt-agree',
    optionLabel: '찬성해요 (제비뽑기가 좋아요)',
    reason: '평소에 이야기를 잘 나누지 못했던 친구들과도 짝이 되어서 친해질 수 있는 좋은 기회이기 때문입니다. 제비뽑기가 가장 공평하다고 생각해요.',
    submittedAt: '2026-09-20 09:15',
    likes: 6,
    syncedToSheet: false
  },
  {
    id: 'sub-2',
    topicId: 'topic-1',
    topicTitle: '우리 반 자리 바꾸기를 한 달에 한 번씩 제비뽑기로 하는 것에 찬성하나요, 반대하나요?',
    grade: '4',
    classNum: '2',
    studentNumber: '5',
    studentName: '박서준',
    optionId: 'opt-agree',
    optionLabel: '찬성해요 (제비뽑기가 좋아요)',
    reason: '원하는 친구끼리만 앉으면 반이 끼리끼리 나뉠 수 있는데, 랜덤으로 뽑으면 모두가 골고루 섞여서 반 전체 분위기가 더 좋아질 것 같아요.',
    submittedAt: '2026-09-20 09:18',
    likes: 4,
    syncedToSheet: false
  },
  {
    id: 'sub-3',
    topicId: 'topic-1',
    topicTitle: '우리 반 자리 바꾸기를 한 달에 한 번씩 제비뽑기로 하는 것에 찬성하나요, 반대하나요?',
    grade: '4',
    classNum: '2',
    studentNumber: '7',
    studentName: '배수아',
    optionId: 'opt-disagree',
    optionLabel: '반대해요 (다른 방법이 필요해요)',
    reason: '눈이 나쁜 친구는 안경을 써도 뒤에 앉으면 칠판 글씨가 흐릿하게 보여서 수업에 집중하기 힘들 수 있어요. 시력이나 키를 먼저 배려해 주어야 합니다.',
    submittedAt: '2026-09-20 09:21',
    likes: 8,
    syncedToSheet: false
  },
  {
    id: 'sub-4',
    topicId: 'topic-1',
    topicTitle: '우리 반 자리 바꾸기를 한 달에 한 번씩 제비뽑기로 하는 것에 찬성하나요, 반대하나요?',
    grade: '4',
    classNum: '2',
    studentNumber: '12',
    studentName: '이서윤',
    optionId: 'opt-agree',
    optionLabel: '찬성해요 (제비뽑기가 좋아요)',
    reason: '한 달에 한 번 바꾸는 것은 지루하지 않고 기분 전환도 되어서 공부할 때 더 신선한 느낌이 듭니다.',
    submittedAt: '2026-09-20 09:25',
    likes: 2,
    syncedToSheet: false
  },
  {
    id: 'sub-5',
    topicId: 'topic-1',
    topicTitle: '우리 반 자리 바꾸기를 한 달에 한 번씩 제비뽑기로 하는 것에 찬성하나요, 반대하나요?',
    grade: '4',
    classNum: '2',
    studentNumber: '16',
    studentName: '장우진',
    optionId: 'opt-neutral',
    optionLabel: '절충/기타 (새로운 규칙이 필요해요)',
    reason: '제비뽑기는 좋지만, 시력이 안 좋은 친구나 수업 시간에 주의가 필요한 친구를 위해 앞줄 2~3자리는 선생님 지정석으로 미리 두고 나머지만 제비뽑기하면 좋겠습니다.',
    submittedAt: '2026-09-20 09:30',
    likes: 12,
    syncedToSheet: false
  },
  {
    id: 'sub-6',
    topicId: 'topic-1',
    topicTitle: '우리 반 자리 바꾸기를 한 달에 한 번씩 제비뽑기로 하는 것에 찬성하나요, 반대하나요?',
    grade: '4',
    classNum: '2',
    studentNumber: '1',
    studentName: '강민준',
    optionId: 'opt-agree',
    optionLabel: '찬성해요 (제비뽑기가 좋아요)',
    reason: '누구 하나 불만 없이 모두 운에 맡기는 거니까 다툼이 생기지 않아서 좋습니다.',
    submittedAt: '2026-09-20 09:34',
    likes: 3,
    syncedToSheet: false
  },
  {
    id: 'sub-7',
    topicId: 'topic-1',
    topicTitle: '우리 반 자리 바꾸기를 한 달에 한 번씩 제비뽑기로 하는 것에 찬성하나요, 반대하나요?',
    grade: '4',
    classNum: '2',
    studentNumber: '14',
    studentName: '이지안',
    optionId: 'opt-disagree',
    optionLabel: '반대해요 (다른 방법이 필요해요)',
    reason: '너무 자주 바꾸면 새로운 짝꿍과 적응하는 데 시간이 걸려서 학기 초에는 산만해질 수 있어요. 두 달에 한 번씩 바꾸는 것이 더 적당합니다.',
    submittedAt: '2026-09-20 09:40',
    likes: 5,
    syncedToSheet: false
  }
];
