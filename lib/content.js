// 장소·캐릭터·미션 — 원장님 그림과 미션이 정해지면 이 파일만 바꾸면 된다.
// img: public/chars 안의 그림 파일 / type: quiz(객관식) · photo(사진) · text(글) · ai(AI 활용 과제)
// 위도·경도는 숭실대 홈페이지 캠퍼스맵 기준(숭실 마을과 같은 값).
export const PLACES = [
  {
    id: 'westminster', name: '웨스트민스터홀', lat: 37.4967804, lng: 126.9584436,
    hint: '파란 유리 건물, 교육대학원이 있는 곳', char: { name: '새싹이', img: '/chars/p1.svg' },
    mission: {
      type: 'quiz', q: '유아교육 현장에서 AI를 쓸 때 가장 먼저 지켜야 할 것은 무엇일까요?',
      options: ['아이의 개인정보 보호', '가장 비싼 도구 고르기', '모든 수업을 AI로 바꾸기', '답을 그대로 쓰기'],
      answer: 0, explain: '아이의 이름·사진 같은 개인정보는 AI에 넣기 전에 꼭 지우거나 바꿔 주세요.',
    },
  },
  {
    id: 'library', name: '중앙도서관', lat: 37.4962615, lng: 126.9586203,
    hint: '조용한 자료의 집', char: { name: '책돌이', img: '/chars/p2.svg' },
    mission: { type: 'ai', q: 'AI에게 「만 3세 그림책 활동 아이디어 3가지」를 물어보고, 받은 답을 붙여 넣어 주세요.' },
  },
  {
    id: 'mirae', name: '미래관', lat: 37.4956307, lng: 126.9583674,
    hint: '하얀 외벽의 강의동', char: { name: '미래', img: '/chars/p3.svg' },
    mission: { type: 'text', q: '10년 뒤 어린이집 교실에서 AI는 어떤 모습일까요? 한두 문장으로 적어 주세요.' },
  },
  {
    id: 'hankj', name: '한경직기념관', lat: 37.4956196, lng: 126.9576165,
    hint: '앞마당이 있는 기념관', char: { name: '마당이', img: '/chars/p4.svg' },
    mission: { type: 'photo', q: '이곳에서 아이들에게 보여 주고 싶은 가을을 사진으로 찍어 올려 주세요.' },
  },
  {
    id: 'baird', name: '베어드홀', lat: 37.4965129, lng: 126.9563359,
    hint: '대학본부가 있는 건물', char: { name: '반짝이', img: '/chars/p5.svg' },
    mission: {
      type: 'quiz', q: 'AI가 만들어 준 활동 계획안을 교실에서 쓰기 전에 교사가 해야 할 일은?',
      options: ['그대로 복사한다', '우리 반 아이들에게 맞는지 살펴보고 고친다', '다른 AI에게만 다시 묻는다', '아이들에게 고르게 한다'],
      answer: 1, explain: '우리 반 아이들을 가장 잘 아는 사람은 선생님이에요. 마지막 판단은 교사의 몫입니다.',
    },
  },
  {
    id: 'field', name: '대운동장', lat: 37.4973346, lng: 126.9560911,
    hint: '넓게 트인 운동장', char: { name: '뛰뛰', img: '/chars/p6.svg' },
    mission: { type: 'photo', q: '바깥놀이 아이디어가 떠오르는 장면을 사진으로 찍어 올려 주세요.' },
  },
  {
    id: 'student', name: '학생회관', lat: 37.4970898, lng: 126.9570321,
    hint: '학생들이 모이는 곳', char: { name: '모아', img: '/chars/p7.svg' },
    mission: { type: 'ai', q: 'AI에게 「학부모에게 보낼 가을 소풍 안내문 첫 문장」을 부탁하고, 마음에 드는 답을 붙여 넣어 주세요.' },
  },
  {
    id: 'jinri', name: '진리관', lat: 37.4969098, lng: 126.9574665,
    hint: '짙은 회색 벽돌 강의동', char: { name: '진이', img: '/chars/p8.svg' },
    mission: { type: 'text', q: '오늘 워크숍에서 우리 원에 바로 적용하고 싶은 것 하나를 적어 주세요.' },
  },
];

export const placeById = id => PLACES.find(p => p.id === id);
export const NEAR_METERS = 40;      // 장소에서 이만큼 안에 들어오면 캐릭터가 나타난다
export const TYPE_LABEL = { quiz: '퀴즈', photo: '사진', text: '글쓰기', ai: 'AI 과제' };
