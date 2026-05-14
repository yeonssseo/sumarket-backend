# 수마켓 (SuMarket) 백엔드

수원대학교 중고 교재 거래 플랫폼 백엔드 API 서버

## 기술 스택
- Node.js + Express
- MySQL (mysql2)
- JWT 인증
- Cloudinary (이미지 업로드)
- Nodemailer (이메일 인증)

## 시작하기

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env` 파일에서 본인의 MySQL 비밀번호, Cloudinary 키 등을 입력하세요.

### 3. 데이터베이스 초기화
MySQL에서 `src/config/init.sql` 파일을 실행하세요.
```bash
mysql -u root -p < src/config/init.sql
```

### 4. 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 확인 가능합니다.
