# AstryStock Design System

재고관리 CMS에서 실제 사용 중인 Astryx 기반 디자인 시스템을 정리한 문서입니다.  
코드 기준일: 2026-11-17

## 0. 메타 정보

| 항목 | 값 |
| --- | --- |
| 애플리케이션 | AstryStock 재고관리 CMS |
| 프레임워크 | React 19.3.1, Vite 8.3.6, TypeScript 7.0.2 |
| Astryx Core | `@astryxdesign/core@0.7.16` |
| 기반 테마 | `@astryxdesign/theme-neutral@0.7.16` |
| StyleX 런타임 | `@stylexjs/stylex@0.19.2` |
| Astryx CLI | `@astryxdesign/cli@0.7.16` |
| 커스텀 테마 | `src/theme.ts`의 `inventoryTheme` |
| 테마 이름 | `inventory-blue` |
| 앱 스타일 | `src/App.css`, `src/index.css` |

Astryx의 사전 컴파일 CSS를 다음 순서로 불러옵니다.

```ts
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral/theme.css'
```

앱 최상단에는 커스텀 테마를 적용합니다.

```tsx
<Theme theme={inventoryTheme} mode="light">
  <AppShell>{/* pages */}</AppShell>
</Theme>
```

`inventoryTheme`은 Astryx의 `defineTheme()`로 만들며 `neutralTheme`을 `extends`합니다. 따라서 표에 따로 적지 않은 Astryx 기본 토큰과 컴포넌트 스타일은 Neutral 테마에서 상속됩니다.

---

## 1. Design Tokens

### 1.1 토큰 사용 원칙

- `src/theme.ts`는 Astryx 토큰을 브랜드 값으로 덮어쓰는 단일 출처입니다.
- `src/App.css`는 색상을 직접 선언하지 않고 `var(--Astryx-token)`을 우선 사용합니다.
- `[라이트, 다크]` 배열은 Astryx가 `light-dark()` 값으로 변환합니다.
- 현재 앱은 `Theme mode="light"`로 고정되어 라이트 값을 표시합니다. 다크 값은 향후 모드 전환을 위해 함께 정의했습니다.
- `color-mix()`는 기존 Astryx 토큰에서 투명도·혼합 색상을 파생할 때만 사용합니다.

### 1.2 브랜드 및 강조 색상 — Astryx 토큰 재정의

| Astryx 토큰 | 라이트 | 다크 | 역할 | 실제 사용처 |
| --- | --- | --- | --- | --- |
| `--color-accent` | `#1687F8` | `#66B6FF` | 브랜드 기본 블루 | 주요 버튼, 포커스, 로고, 링크성 강조 |
| `--color-accent-muted` | `#DCEEFF` | `#123B62` | 옅은 브랜드 배경 | 활성 메뉴, 아바타, 상품 썸네일 |
| `--color-text-accent` | `#0969C8` | `#8CC8FF` | 강조 텍스트 | 활성 메뉴, 브레드크럼, 상품코드 |
| `--color-icon-accent` | `#1687F8` | `#66B6FF` | 강조 아이콘 | Astryx 아이콘의 accent 표현 |
| `--color-info` | `#1687F8` | `#66B6FF` | 정보 상태 | Astryx `Badge variant="info"` 등 |
| `--color-info-muted` | `#DCEEFF` | `#123B62` | 정보 상태 배경 | 전체 재고 카드 아이콘 배경 |
| `--color-on-accent` | Neutral 상속 | Neutral 상속 | 강조색 위 콘텐츠 | 로고 문자, Primary Button 텍스트 |

### 1.3 배경·텍스트·경계 — Astryx 토큰 재정의

| Astryx 토큰 | 라이트 | 다크 | 역할 | 실제 사용처 |
| --- | --- | --- | --- | --- |
| `--color-background-body` | `#F4F8FC` | `#111C27` | 앱 전체 배경 | 콘텐츠 영역 |
| `--color-background-surface` | `#FFFFFF` | `#172533` | 전면 표면 | 사이드바, 헤더, 패널, 입력 |
| `--color-background-card` | `#FFFFFF` | `#172533` | Astryx Card 표면 | 상품 상세 정보 카드 |
| `--color-background-muted` | `#EEF5FB` | `#1C2E3E` | 보조 배경 | 테이블 헤더, hover, 미리보기 |
| `--color-text-primary` | `#182230` | `#F3F8FC` | 주요 텍스트 | 제목, 본문, 표 데이터 |
| `--color-text-secondary` | `#637083` | `#A9B8C8` | 보조 텍스트 | 라벨, 설명, 날짜, 캡션 |
| `--color-border` | `#DCE6EF` | `#2B4052` | 기본 경계 | 패널, 행, 레이아웃 구분선 |
| `--color-border-emphasized` | `#B9CAD9` | `#496275` | 강한 경계 | 네이티브 셀렉트와 날짜 입력 |

### 1.4 상태 색상 — Astryx 토큰 재정의 및 상속

상태는 색상만으로 표현하지 않고 `정상`, `부족`, `품절` 텍스트가 포함된 Astryx `Badge`를 항상 함께 사용합니다.

| 상태 | 기본 Astryx 토큰 | 커스텀 값(라이트 / 다크) | 함께 사용한 상속 토큰 | 컴포넌트 |
| --- | --- | --- | --- | --- |
| 정상 | `--color-success` | `#159455` / `#55CE8C` | `--color-success-muted`, `--color-text-success` | Success Badge, ProgressBar, 상태점 |
| 부족 | `--color-warning` | `#E58B16` / `#F6BD5B` | `--color-warning-muted`, `--color-text-warning` | Warning Badge, ProgressBar, 알림 |
| 품절·오류 | `--color-error` | `#D64550` / `#FF7D86` | `--color-error-muted`, `--color-text-error` | Error Badge, ProgressBar, 검증 오류 |
| 안내 | `--color-info` | `#1687F8` / `#66B6FF` | `--color-info-muted`, `--color-text-info` | Info Badge, 대시보드 카드 |

Neutral 테마에서 상속하여 CSS가 직접 참조하는 상태 토큰의 원본 값은 다음과 같습니다.

| Astryx 상속 토큰 | Neutral 라이트 | Neutral 다크 |
| --- | --- | --- |
| `--color-success-muted` | `#BCE0BB` | `#90CA903D` |
| `--color-warning-muted` | `#FAE19E` | `#E2B6233D` |
| `--color-error-muted` | `#FFC4BE` | `#FF98903D` |
| `--color-text-success` | `#2F7D33` | `#90CA90` |
| `--color-text-warning` | `#836700` | `#EEC448` |
| `--color-text-error` | `#C0262C` | `#FFAEA7` |
| `--color-text-info` | `#0067CE` | `#A1CAFF` |

### 1.5 타이포그래피

타이포그래피는 `defineTheme({ typography })`로 설정하며 Astryx가 관련 CSS 토큰을 생성합니다.

| 설정 | 값 | 생성·사용되는 Astryx 토큰 |
| --- | --- | --- |
| 본문 글꼴 | `Pretendard` | `--font-family-body` |
| 제목 글꼴 | `Pretendard` | `--font-family-heading` |
| 대체 글꼴 | `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif` | 위 family 토큰에 포함 |
| 기본 크기 | `14px` | `--font-size-base`, `--text-body-size` 등 |
| 타입 스케일 비율 | `1.2` | Astryx `--font-size-*`, `--text-heading-*` 계열 |
| 제목 3·4 가중치 | `bold` | `--text-heading-3-weight`, `--text-heading-4-weight` |

앱 전용 레이아웃 CSS에는 `10px`, `11px`, `12px`, `13px`, `17px`, `22px`, `28px` 등의 고정 크기도 존재합니다. 이 값들은 Astryx 토큰이 아니라 CMS의 고밀도 정보 구조를 위한 로컬 표현 값입니다.

### 1.6 모서리, 그림자, 모션

| 구분 | Astryx 토큰·설정 | 값 또는 출처 | 사용처 |
| --- | --- | --- | --- |
| 입력·버튼 모서리 | `--radius-element` | `6px` | 셀렉트, 날짜 입력, Astryx 컨트롤 |
| 카드·패널 모서리 | `--radius-container` | `12px` | 패널, 카드, 상태 카드 |
| 알약형 모서리 | `--radius-full` | `9999px` | 카운트 배지, 상태 표시 |
| 낮은 그림자 | `--shadow-low` | Neutral 상속 | 카드, hover, 폼 |
| 높은 그림자 | `--shadow-high` | Neutral 상속 | 토스트 |
| 그림자 색 | `--color-shadow` | Neutral 상속 | 패널의 파생 그림자 |
| 빠른 모션 | `--duration-fast` | Neutral 기준 `125ms` | hover, 색상 전환 |
| 보통 모션 | `--duration-medium` | Neutral 기준 `300ms` | 토스트 진입 |
| 테마 모션 | `motion.tempo` | `0.9` | Astryx 전체 모션 속도 |
| 모션 성격 | `motion.character` | `crisp` | 짧고 명확한 관리도구 전환 |

### 1.7 코드가 직접 참조하는 Astryx 토큰 전체 목록

아래 목록은 `src/App.css`와 `src/index.css`의 실제 `var()` 참조를 기준으로 합니다.

```text
--color-accent
--color-accent-muted
--color-background-body
--color-background-muted
--color-background-surface
--color-border
--color-border-emphasized
--color-error-muted
--color-info-muted
--color-on-accent
--color-shadow
--color-success
--color-success-muted
--color-text-accent
--color-text-error
--color-text-info
--color-text-primary
--color-text-secondary
--color-text-success
--color-text-warning
--color-warning
--color-warning-muted
--duration-fast
--duration-medium
--radius-container
--radius-element
--radius-full
--shadow-high
--shadow-low
```

Astryx 컴포넌트 내부에서는 위 목록 외에도 Core와 Neutral의 크기, 간격, 포커스, 입력, 타이포그래피 토큰을 사용합니다. 이 내부 토큰은 프로젝트 CSS가 직접 참조하지 않으므로 목록에 섞지 않았습니다.

---

## 2. 사용된 Astryx 컴포넌트

| Astryx 컴포넌트 | import 경로 | 실제 역할 | 사용 화면 |
| --- | --- | --- | --- |
| `Theme` | `@astryxdesign/core/theme` | `inventoryTheme` 적용 | 전체 |
| `AppShell` | `@astryxdesign/core/AppShell` | 사이드바·상단바·콘텐츠 슬롯 | 전체 |
| `Badge` | `@astryxdesign/core/Badge` | 정상·부족·품절, 입고·출고 상태 | 전체 |
| `Button` | `@astryxdesign/core/Button` | Primary, Secondary, Ghost 액션 | 전체 |
| `Card` | `@astryxdesign/core/Card` | 상품 상세 기본정보·재고 게이지 | 상품 상세 |
| `EmptyState` | `@astryxdesign/core/EmptyState` | 검색 결과 없음, 데이터 없음, 권한 안내 | 목록, 상세, 입출고 |
| `TextInput` | `@astryxdesign/core/TextInput` | 상품 검색, 상품코드·상품명 | 재고 목록, 상품 등록 |
| `NumberInput` | `@astryxdesign/core/NumberInput` | 초기재고, 안전재고, 입출고 수량 | 상품 등록, 입출고 관리 |
| `TextArea` | `@astryxdesign/core/TextArea` | 입출고 메모와 글자 수 | 입출고 관리 |
| `SegmentedControl` | `@astryxdesign/core/SegmentedControl` | 관리자/조회자, 입고/출고 전환 | 헤더, 입출고 관리 |
| `SegmentedControlItem` | 동일 | 세그먼트 항목 | 헤더, 입출고 관리 |
| `Pagination` | `@astryxdesign/core/Pagination` | 페이지당 10개 재고 탐색 | 재고 목록 |
| `ProgressBar` | `@astryxdesign/core/ProgressBar` | 재고/권장재고 게이지 | 상품 상세 |

### 2.1 주요 variant와 상태

| 컴포넌트 | 사용 variant·상태 |
| --- | --- |
| Button | `primary`, `secondary`, `ghost`, `sm`, `isDisabled`, `isLoading` |
| Badge | `success`, `warning`, `error`, `info`, `neutral` |
| ProgressBar | `success`, `warning`, `error`, `isLabelHidden` |
| TextInput | `search`, `hasClear`, `isRequired`, `status.error` |
| NumberInput | `isIntegerOnly`, `hasClear`, `min`, `max`, `units`, `status.error` |
| TextArea | `maxLength=200`, `htmlMaxLength=200`, `isOptional` |
| SegmentedControl | `sm`, `fill`, controlled `value` |
| Card | `padding=5` |
| EmptyState | 기본, `isCompact` |

---

## 3. 커스텀 컴포넌트와 Astryx 조합

아래 요소는 독립적인 Astryx 컴포넌트가 아니라 프로젝트 코드에서 조합하거나 네이티브 HTML로 구현했습니다.

| 커스텀 요소 | 구성 | 사용한 Astryx 토큰·컴포넌트 | 사용 위치 |
| --- | --- | --- | --- |
| `Sidebar` | `aside`, nav button, 브랜드 마크, 알림 수 | `AppShell.sideNav`, accent/background/border 토큰 | 전체 |
| `Header` | 브레드크럼, 제목, 프로필 | `SegmentedControl`, text/border 토큰 | 전체 |
| `StatusBadge` | 재고 상태 → variant 매핑 | `Badge` | 전체 |
| 상태 요약 카드 | 숫자, 상태 아이콘, 설명, 링크 동작 | surface/status/shadow 토큰 | 대시보드 |
| 주의 상품 목록 | 상품 셀, 수량, 상태 | `Badge`, 상태 토큰 | 대시보드 |
| 필터 바 | `TextInput` + 네이티브 `select` | `TextInput`, border/radius 토큰 | 재고 목록 |
| 데이터 테이블 | 네이티브 `table` + Astryx 상태 표시 | `Badge`, `Pagination`, 표면·경계 토큰 | 목록, 상세, 입출고, 알림 |
| 상품 폼 | Astryx 입력 + 네이티브 카테고리 선택 | `TextInput`, `NumberInput`, `Button` | 상품 등록 |
| 입출고 폼 | Astryx 입력 + 네이티브 상품·날짜 선택 | SegmentedControl, NumberInput, TextArea, Button | 입출고 관리 |
| 재고 미리보기 | 현재고 → 처리 후 재고 + 상태 | `StatusBadge` | 입출고 관리 |
| 앱 토스트 | 고정 위치 `role="status"` 알림 | text/surface/shadow/motion 토큰 | 저장 성공 |
| 상품 썸네일 | 상품명 첫 글자 기반 플레이스홀더 | accent-muted/text-accent 토큰 | 목록, 대시보드, 알림 |

현재 버전은 Astryx의 `Table`, `SideNav`, `Toast`, `Selector`, `DateInput`을 직접 사용하지 않습니다. 해당 기능은 네이티브 요소 또는 프로젝트 조합으로 구현되어 있으므로 Astryx 컴포넌트로 문서화하지 않습니다.

---

## 4. Atomic Design 분류

### 4.1 Atoms

| Atom | 기반 | 역할 |
| --- | --- | --- |
| Action Button | Astryx `Button` | 주요·보조·텍스트 액션 |
| Status Badge | Astryx `Badge` | 정상·부족·품절 상태 |
| Text Field | Astryx `TextInput` | 검색과 텍스트 입력 |
| Number Field | Astryx `NumberInput` | 수량 입력과 검증 |
| Text Area | Astryx `TextArea` | 200자 메모 입력 |
| Select Field | 네이티브 `select` + Astryx 토큰 | 카테고리·상태·상품 선택 |
| Date Field | 네이티브 `input[type=date]` + Astryx 토큰 | 미래 날짜 제한 |
| Product Thumbnail | 커스텀 | 텍스트 기반 상품 식별자 |
| Priority Marker | 커스텀 | 알림 우선순위 숫자 |

### 4.2 Molecules

| Molecule | 하위 요소 | 역할 |
| --- | --- | --- |
| `StatusBadge` | Badge + 상태 계산 | 재고 수량을 시맨틱 상태로 변환 |
| Product Cell | Thumbnail + 상품명 + 코드 | 테이블과 리스트의 상품 식별 |
| Filter Bar | 검색 + 카테고리 + 상태 + 초기화 | 재고 목록 탐색 |
| Stock Preview | 현재고 + 화살표 + 결과 + StatusBadge | 입출고 결과 사전 확인 |
| Profile Control | Avatar + 이름 + 권한 | 현재 사용자와 역할 표시 |
| Metric Card | 상태 아이콘 + 수치 + 설명 | 상태별 상품 수 탐색 |

### 4.3 Organisms

| Organism | 구성 | 화면 |
| --- | --- | --- |
| Application Shell | Sidebar + Header + Content | 전체 |
| Inventory Table | Filter Bar + Result Summary + Table + Pagination | 재고 목록 |
| Attention List | Product Cell + 수량 + StatusBadge | 대시보드 |
| Product Registration Form | Text/Number/Select fields + Actions | 상품 등록 |
| Movement Registration Form | SegmentedControl + fields + Stock Preview | 입출고 관리 |
| Movement History | Data Table + Badge + 수량 표현 | 입출고 관리, 상세 |
| Low-stock Alert Table | Priority + Product Cell + Stock + StatusBadge | 부족 알림 |

### 4.4 Templates

| Template | 구조 | 적용 화면 |
| --- | --- | --- |
| Dashboard Template | Welcome + Metrics + 2-column panels | 대시보드 |
| List Template | Page actions + Filter Bar + Table + Pagination | 재고 목록 |
| Detail Template | Back action + Summary cards + History | 상품 상세 |
| Form Template | Centered introduction + Form card + Footer actions | 상품 등록 |
| Split Management Template | Registration form + Recent history | 입출고 관리 |
| Alert Template | Summary banner + Priority table | 재고 부족 알림 |

---

## 5. 페이지 구성

| 화면 | 템플릿 | 주요 Astryx 컴포넌트 |
| --- | --- | --- |
| 대시보드 | Dashboard Template | Button, Badge, EmptyState |
| 재고 목록 | List Template | TextInput, Button, Badge, Pagination, EmptyState |
| 상품 상세 | Detail Template | Button, Badge, Card, ProgressBar, EmptyState |
| 상품 등록 | Form Template | TextInput, NumberInput, Button |
| 입출고 관리 | Split Management Template | SegmentedControl, NumberInput, TextArea, Badge, Button, EmptyState |
| 재고 부족 알림 | Alert Template | Badge |

---

## 6. 사용 규칙

### 색상

- Do: 주요 액션은 `--color-accent` 계열을 사용합니다.
- Do: 상태는 `Badge`의 텍스트와 상태색을 함께 표시합니다.
- Do: 표면은 body → surface → muted 순으로 계층을 만듭니다.
- Don't: 컴포넌트에 브랜드 HEX 값을 직접 넣지 않습니다.
- Don't: 경고와 오류를 색상만으로 구분하지 않습니다.

### 컴포넌트

- Do: 버튼, 입력, 배지, 페이지네이션, 진행률은 Astryx 컴포넌트를 우선합니다.
- Do: 수량 입력은 `NumberInput isIntegerOnly`와 범위를 함께 지정합니다.
- Do: 비동기 저장은 `Button isLoading`과 `isDisabled`를 함께 사용합니다.
- Don't: 조회자에게 관리 액션을 disabled 상태로 보여주지 않습니다. 권한 정책상 숨깁니다.
- Don't: 단순 정보 그룹마다 Card를 중첩하지 않습니다.

### 데이터 밀도

- 테이블 행 높이는 약 `52px`, 헤더는 `42px`입니다.
- 페이지당 기본 항목 수는 10개입니다.
- 상품명은 한 줄 말줄임과 `title` 속성으로 전체 이름을 제공합니다.
- 숫자는 `Intl.NumberFormat('ko-KR')`로 천 단위 구분합니다.

---

## 7. 재사용 가이드

### 7.1 새 프로젝트 적용 순서

1. Astryx Core, Neutral Theme, StyleX 런타임을 설치합니다.
2. `reset.css`, `astryx.css`, `theme.css` 순으로 import합니다.
3. `src/theme.ts`의 `inventoryTheme`을 복사합니다.
4. 앱 루트를 `<Theme theme={inventoryTheme}>`로 감쌉니다.
5. `AppShell`을 최상위 레이아웃으로 사용합니다.
6. 이 문서의 Atom → Molecule → Organism 순서로 화면을 조합합니다.
7. `npm run build`, `npm run lint`, `npm run astryx:doctor`로 검증합니다.

### 7.2 브랜드 블루만 변경할 때

`src/theme.ts`에서 다음 Astryx 토큰만 우선 변경합니다.

```text
--color-accent
--color-accent-muted
--color-text-accent
--color-icon-accent
--color-info
--color-info-muted
```

배경 톤까지 바꾸려면 다음 토큰을 함께 조정합니다.

```text
--color-background-body
--color-background-surface
--color-background-card
--color-background-muted
--color-border
--color-border-emphasized
```

### 7.3 최소 사용 예시

```tsx
import {Badge} from '@astryxdesign/core/Badge'
import {Button} from '@astryxdesign/core/Button'
import {Theme} from '@astryxdesign/core/theme'
import {inventoryTheme} from './theme'

export function Example() {
  return (
    <Theme theme={inventoryTheme} mode="light">
      <Badge label="부족" variant="warning" />
      <Button label="입고 등록" variant="primary" />
    </Theme>
  )
}
```

---

## 8. 분류가 애매했던 항목

| 항목 | 분류 | 판단 근거 |
| --- | --- | --- |
| StatusBadge | Molecule | Astryx Badge 하나를 감싸지만 재고 도메인의 상태 계산과 variant 매핑을 포함합니다. |
| Metric Card | Molecule | 독립적으로 반복되지만 한 화면의 요약 단위이며 별도 데이터 기능은 없습니다. |
| Filter Bar | Molecule | 여러 입력 Atom을 조합하지만 목록과 분리된 독립 데이터 기능은 없습니다. |
| Native Data Table | Organism | 헤더, 정렬, 행 탐색, 상태 표시, 페이지네이션과 함께 독립적인 업무 블록을 이룹니다. |
| App Toast | Atom에 가까운 커스텀 피드백 | DOM 구조는 단순하지만 전역 위치와 자동 소멸 동작을 가집니다. 현재는 재사용 컴포넌트로 분리되지 않았습니다. |

---

## 9. 현재 구현의 개선 후보

다음은 문서에 존재하는 기능이 아니라, 현 상태를 정확히 설명하기 위한 기술 부채 목록입니다.

- 네이티브 테이블을 Astryx `Table`로 교체하면 키보드 탐색과 스타일 일관성을 높일 수 있습니다.
- 네이티브 셀렉트를 Astryx `Selector`/`MultiSelector`로 교체하면 검색형·다중 선택 UX를 통일할 수 있습니다.
- 네이티브 날짜 입력을 Astryx `DateInput`으로 교체하면 테마와 날짜 제약 표현이 일관됩니다.
- 커스텀 토스트를 Astryx `useToast()`로 교체하면 스태킹, 중복 제거, 자동 닫힘 접근성을 확보할 수 있습니다.
- 커스텀 사이드바를 Astryx `SideNav`로 교체하면 `aria-current`와 축소 동작을 디자인 시스템에 위임할 수 있습니다.
- 앱 CSS의 고정 간격값을 Astryx `--spacing-*` 토큰으로 단계적으로 치환할 수 있습니다.
