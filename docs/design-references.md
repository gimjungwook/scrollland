# 스크롤 연출 참고와 실제 적용

확인일: 2026-09-23. 학습 중 필요한 입력은 세로 스크롤 하나입니다. 코드 강조, 이름과 객체의 관계, 현재 설명, 출력이 같은 스크롤 진행률에 따라 변합니다. 이전의 정적 문서 중심 디자인과 버튼으로 단계 선택하는 방식은 이 요구에 맞지 않아 교체했습니다.

## 조사 근거

아래 9개 공식 페이지와 제작자 예제의 공개 HTML·CSS·JavaScript를 확인했습니다. 이번 추가 조사에서 참고 사이트의 모든 움직임을 브라우저로 재생한 것은 아닙니다. ScrollLand 자체의 브라우저 검증은 [구현 검증 기록](verification.md)에 따로 적었습니다. 원본 이미지·영상·로고·예제 문장을 복제하지 않았습니다.

| 참고 사례 | 확인한 구성 | 이번 구현에 적용한 판단 |
| --- | --- | --- |
| [Apple AirPods Pro](https://www.apple.com/airpods-pro/) | 공식 HTML의 VideoScrub과 고정된 제품 관찰 구간 | 같은 대상을 유지하면서 관계가 바뀌도록 합니다. 코드와 도식을 고정한 무대에서 이름의 연결과 객체 상태를 갱신합니다. |
| [Apple MacBook Pro](https://www.apple.com/macbook-pro/) | 제품 확대와 구간별 강조·투명도 선언 | 도입의 큰 제목, 코드와 객체의 확대, 값 7에서 8로의 변화를 같은 진행률에 묶었습니다. 학습 코드의 가독성은 유지합니다. |
| [GSAP Scroll](https://gsap.com/scroll/) | 고정 구간과 스크롤 타임라인, 확대·회전·선 그리기 | `scrub: true`와 CSS sticky를 결합했습니다. 멈추면 멈추고, 되돌리면 같은 상태를 복원합니다. |
| [Steve Gardner — Airplanes](https://codepen.io/ste-vg/pen/GRooLza) | 같은 모델의 시점 변화, 설계도 전환, 설명선 | 도식 객체의 식별자를 유지하고, 관계선의 경로와 객체 위치를 보간합니다. 객체를 매 프레임 새로 만드는 방식은 사용하지 않습니다. |
| [Ksenia Kondrashova — On-Scroll Gooey Overlay](https://codepen.io/ksenia-k/pen/NWmMxLg) | 진행률·안내문·화살표·내용이 연결된 전환 | 연출 요소를 공통 진행률에 연결하는 원칙만 적용했습니다. 액체 모양 전환은 코드 이해에 필요한 변화가 아니어서 채택하지 않았습니다. |
| [Bramus — Cover Card to Fixed Header](https://scroll-driven-animations.style/demos/cover-to-fixed-header/css/) | 큰 표지와 고정 헤더의 연결 | 큰 레슨 제목 뒤에도 현재 레슨을 상단에 표시합니다. 표지 자체를 헤더로 변형하는 효과는 구현하지 않았습니다. |
| [Bramus — Stacking Cards](https://scroll-driven-animations.style/demos/stacking-cards/css/) | sticky와 스크롤 기반 축소의 결합 | 호출 상태를 순서와 반환 관계로 보여주는 데 참고했습니다. 현 버전은 장면별 상태 도식이며 3차원 카드 적층은 구현하지 않았습니다. |
| [Bramus — Horizontal Scroll Section](https://scroll-driven-animations.style/demos/horizontal-section/css/) | 세로 스크롤을 내부 가로 이동에 연결 | 사용자의 별도 가로 입력 없이 도식의 항목 위치를 갱신합니다. 본문·코드를 가로로 흘리지는 않습니다. |
| [Bramus — 3D Shoe Explorer](https://scroll-driven-animations.style/demos/3d-shoe-explorer/css/) | 모델과 제목을 같은 진행률로 갱신 | 서로 다른 시각 요소가 같은 상태를 설명하도록 묶었습니다. 신발 모델·3차원 엔진·가로 입력은 사용하지 않습니다. |

이전 조사에서 확인한 [Python Tutor](https://pythontutor.com/), [Red Blob Games](https://www.redblobgames.com/pathfinding/a-star/introduction.html), [Josh Comeau](https://www.joshwcomeau.com/css/transforms/), [Distill](https://distill.pub/2017/momentum/), [Bret Victor](https://worrydream.com/LadderOfAbstraction/), [Bartosz Ciechanowski](https://ciechanow.ski/mechanical-watch/)의 설명·코드·대상 연결 원칙도 유지합니다. 이들의 클릭·드래그·재생 제어는 학습에 요구하지 않습니다. [W3Schools](https://www.w3schools.com/python/default.asp)는 교육 범위 비교에 사용하며 코스 경계와 예제는 직접 구성합니다.

## 화면에 적용한 규칙

- 어두운 잉크색 무대 `#101815`, 밝은 글자 `#f1f4eb`, 현재 값과 연결을 나타내는 황록색 `#c2ee77`, 레슨 사이의 밝은 종이색 `#e8ede3`를 사용합니다. 참고 사이트에서 추출한 색상이 아닙니다.
- 큰 제목과 도입 연출 뒤에 44개 레슨을 한 페이지로 이어 붙였습니다. 레슨을 진행할 때 클릭하지 않아도 됩니다. 목차 링크는 선택적인 빠른 이동입니다.
- 코드와 도식을 같은 고정 무대에 놓고, 그 아래 현재 상태와 설명을 표시합니다. 작은 화면에서는 코드와 도식을 세로로 배치합니다.
- 장면 진행률 하나가 실행 줄·도식·출력·설명을 결정합니다. 변화 뒤에는 위치를 유지하는 구간을 두어 읽을 시간을 제공합니다.
- 이름·객체·자료구조·조건·호출·처리 흐름·상태 변화에 맞춰 도식 배치를 구분합니다. 같은 객체는 값이 바뀌어도 식별자가 유지됩니다. 복사로 생긴 객체와 재대입된 연결은 구분합니다.
- 확인 문항은 스크롤을 더 내리면 정답과 모든 오답 이유가 나타납니다. 응답·점수·통과 조건은 없습니다.
- 시간만으로 계속 재생하는 연출, 스크롤 잠금, 강제 다음 장면 이동, 휠 가로채기, 필수 버튼을 추가하지 않았습니다.
- 움직임 줄이기 또는 연출 초기화 실패 시 전체 설명·코드·출력·단계별 값·종료 비교를 정적 순서로 표시합니다.

글꼴은 Google Fonts의 Noto Sans KR과 IBM Plex Mono를 요청하며, 연결되지 않으면 시스템 글꼴로 표시합니다. 연출 라이브러리는 저장소에 포함되어 있습니다.

## 동작의 근거와 한계

공식 [ScrollTrigger 문서](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)의 `scrub` 계약을 따릅니다. 장면은 `top top`에서 `bottom bottom`까지 진행합니다. 같은 진행률로 되돌아왔을 때 코드·출력·도식의 결과가 같아야 합니다. [refresh 문서](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh()/)에 따라 배치가 달라지면 구간을 다시 측정합니다. 명시적인 URL 앵커로 처음 진입한 경우에만 연출 높이 계산 후 해당 위치를 맞추며, 일반 학습 진행을 자동으로 이동시키지 않습니다.

이 기록은 구현한 시각·동작의 근거입니다. 참고 사이트의 교육 효과, 학생의 학습 효과, 사용자의 디자인 승인을 확인했다는 뜻은 아닙니다.
