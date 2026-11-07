import './globals.css';

export const metadata = {
  title: '숭실 캐릭터 찾기',
  description: '숭실대 캠퍼스를 걸으며 유아교육과 캐릭터를 찾고 미션을 풀어요.',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0a6cb0' };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
