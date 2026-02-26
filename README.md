# CARON - 신차 장기렌트 & 리스 승계 전문

## 배포 방법

### 1. 프로젝트 준비
```bash
npm install
npm run dev    # 로컬 테스트
npm run build  # 빌드
```

### 2. Firebase 설정
1. Firebase 콘솔 → Firestore Database → 데이터베이스 만들기 → 테스트 모드
2. 위치: asia-northeast3 (서울) 권장
3. Firestore Rules 설정:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cars/{document} {
      allow read: if true;
      allow write: if true;
    }
    match /inquiries/{document} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 3. Vercel 배포
1. GitHub에 코드 push
2. Vercel에서 Import Project
3. Framework: Vite 선택
4. Deploy

### 기능
- **일반 사용자**: 차량 검색/필터/상세 확인, 담당자 전화, 승계 문의
- **관리자** (비밀번호: caron2580): 차량 CRUD, 사진 20장, 문의 관리, 승계완료 처리
- **이미지**: 압축 후 Firestore에 Base64로 저장 (Storage 불필요)
- **실시간 동기화**: Firestore onSnapshot
- **반응형**: PC/태블릿/모바일 자동 대응
