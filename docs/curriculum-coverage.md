# 학습 범위와 레슨 대응

확인일: 2026-09-23. 첫 산출물의 교육 범위는 8개 코스·44개 레슨·135개 코드 예제입니다. 현재 원고는 읽기 구간 127개와 시각화 구간 14개, 총 141개 구간으로 구성합니다. 읽기 구간 중 6개는 글만으로 설명합니다. 이 수치는 원고를 검토해 선택한 결과이며 레슨마다 맞춰야 하는 개수나 비율이 아닙니다.

[W3Schools Python 목차](https://www.w3schools.com/python/default.asp)의 Python Tutorial, Python Classes, File Handling은 주제 누락 확인에만 사용했습니다. 코스 경계·구간 구성·문장·관찰 기록 예제는 이 프로젝트에서 작성했습니다. Python의 의미와 동작은 각 레슨의 `sourceUrls`에 있는 공식 문서로 확인합니다.

코스는 값 이해 → 입력과 판단 → 여러 기록 → 반복 → 계산 재사용 → 도구 연결 → 데이터와 행동 → 안전한 저장 순서입니다. 뒤 코스는 앞에서 만든 읽기·계산 방법을 재사용합니다. 모든 레슨은 문제·학습 목표·선행 레슨·본문·예제·요약·확인 문항을 갖습니다. 도식과 단계 자료는 설명에 필요한 구간에만 둡니다. 전체 여정의 본문은 스크롤로 계속 읽을 수 있고, 문항의 정답과 모든 선택지의 근거도 질문 뒤에 이어집니다.

읽기 구간의 글·코드·출력·정적 도식은 계속 남겨 비교할 수 있게 합니다. 시각화 구간에서는 관찰 질문과 본문을 먼저 읽고, 스크롤 위치에 따라 코드의 현재 줄·값·도식·출력·짧은 상태 설명이 함께 갱신되는 과정을 본 뒤 해석 본문으로 이어집니다. 14개 시각화 중 12개에만 화면 고정을 지정했습니다. 본문 글자 효과는 제작자가 지정한 6개 문구에만 적용합니다. 선택 근거와 각 효과의 재생 규칙은 [본문과 연출의 콘텐츠 선택 기록](content-presentation.md)에서 확인할 수 있습니다.

## W3Schools 주제와 실제 설명 위치

아래 링크는 실제 예제의 제목과 고정 식별자로 설명 위치를 가리킵니다. 글만 있는 구간을 앞에 추가해도 예제 주소는 바뀌지 않습니다. “설명”으로 명시한 내용은 본문에서 의미와 사용 기준을 가르치되 별도 설치나 외부 서비스 요청을 실행하지 않습니다. 메서드 전수 목록을 암기하게 만드는 백과식 레퍼런스는 포함하지 않습니다.

| 비교 항목 | 실제 예제 제목과 위치 | 다루는 내용 |
| --- | --- | --- |
| Intro, Get Started, Syntax, Statements | [한 줄로 말을 건네기](../learn/run-python.html#run-python-scene-1) · [위에서 아래로 읽기](../learn/run-python.html#run-python-scene-2) · [직접 실행할 준비](../learn/run-python.html#run-python-scene-3), [if와 들여쓰기로 실행 묶기](../learn/branching.html#branching-scene-1) | 코드·인터프리터·파일 실행, 위에서 아래로 실행, 들여쓰기 |
| Output, Print Numbers, Comments | [한 줄로 말을 건네기](../learn/run-python.html#run-python-scene-1) · [위에서 아래로 읽기](../learn/run-python.html#run-python-scene-2), [안내와 결과를 나누기](../learn/input-output.html#input-output-scene-3) | print, 계산 출력, # 주석, sep·end |
| Variables, Names, Assign Multiple Values, Output Variables | [이름과 값 구분하기](../learn/variables.html#variables-scene-1) · [오른쪽을 먼저 계산하기](../learn/variables.html#variables-scene-2) · [이름으로 값을 사용하기](../learn/variables.html#variables-scene-3) · [재대입으로 연결 바꾸기](../learn/variables.html#variables-scene-4), [이름으로 나누어 받기](../learn/tuples.html#tuples-scene-2) | 이름과 객체의 연결, 대입·재대입, 이름 규칙, 언패킹 |
| Global Variables, Scope | [함수 안 이름과 바깥 이름](../learn/scope.html#scope-scene-1) · [전역 변경이 필요한지 먼저 판단하기](../learn/scope.html#scope-scene-2) · [바깥 함수의 값을 기억하기](../learn/scope.html#scope-scene-3) | 지역·전역 이름, global, nonlocal, 클로저 |
| Data Types, Casting, None | [자료형으로 역할 확인하기](../learn/data-types.html#data-types-scene-1) · [계산할 값으로 변환하기](../learn/data-types.html#data-types-scene-2) · [참·거짓과 값 없음 구별하기](../learn/data-types.html#data-types-scene-3), [비어 있음과 값 없음 구별하기](../learn/booleans.html#booleans-scene-3) | int·float·str·bool·None, type, int·float·str 변환, is None |
| Numbers | [몫과 나머지를 나누어 묻기](../learn/numbers.html#numbers-scene-1) · [계산 순서 드러내기](../learn/numbers.html#numbers-scene-2) · [소수 계산의 오차 알아두기](../learn/numbers.html#numbers-scene-3), [내장 계산과 수학 함수 조합하기](../learn/math.html#math-scene-1) · [근사 비교와 정확한 십진수](../learn/math.html#math-scene-2) · [자료의 대표값과 재현 가능한 무작위 선택](../learn/math.html#math-scene-3) | 몫·나머지·음수 나눗셈, 거듭제곱, float 오차, complex, Decimal, 난수 |
| Strings, Slicing, Modify, Concatenate | [첫 글자와 마지막 글자 찾기](../learn/strings.html#strings-scene-1) · [부분 범위를 잘라 읽기](../learn/strings.html#strings-scene-2) · [값을 문장 안에 넣기](../learn/strings.html#strings-scene-3), [공백과 대소문자 맞추기](../learn/text-tools.html#text-tools-scene-1) · [찾고 바꾸기](../learn/text-tools.html#text-tools-scene-2) · [나누고 다시 잇기](../learn/text-tools.html#text-tools-scene-3) | 위치·슬라이스, 불변성, strip·lower·replace, split·join |
| Format Strings, String Formatting, Escape Characters | [값을 문장 안에 넣기](../learn/strings.html#strings-scene-3) | f-string, 표시 자릿수, 줄바꿈·따옴표 이스케이프 |
| String Methods | [공백과 대소문자 맞추기](../learn/text-tools.html#text-tools-scene-1) · [찾고 바꾸기](../learn/text-tools.html#text-tools-scene-2) · [나누고 다시 잇기](../learn/text-tools.html#text-tools-scene-3) | 찾기·교체·분할·결합의 대표 메서드와 반환값 |
| Booleans | [비교로 질문 만들기](../learn/booleans.html#booleans-scene-1) · [여러 조건을 연결하기](../learn/booleans.html#booleans-scene-2) · [비어 있음과 값 없음 구별하기](../learn/booleans.html#booleans-scene-3) | 비교 결과, and·or·not, 0과 문자열 0의 참값 차이 |
| Arithmetic, Assignment, Comparison, Logical Operators | [몫과 나머지를 나누어 묻기](../learn/numbers.html#numbers-scene-1) · [계산 순서 드러내기](../learn/numbers.html#numbers-scene-2), [비교로 질문 만들기](../learn/booleans.html#booleans-scene-1) · [여러 조건을 연결하기](../learn/booleans.html#booleans-scene-2), [조건의 계산 순서 이용하기](../learn/operators.html#operators-scene-2) | 산술, 증강 대입, 비교, 논리 연결, 단락 평가 |
| Identity, Membership, Bitwise, Precedence | [값·객체·포함을 구별하기](../learn/operators.html#operators-scene-1) · [조건의 계산 순서 이용하기](../learn/operators.html#operators-scene-2) · [비트별 상태를 비교하기](../learn/operators.html#operators-scene-3), [계산 순서 드러내기](../learn/numbers.html#numbers-scene-2) | ==·is·in 구별, &·\|·^·~·<<·>>, 괄호와 우선순위 |
| Ternary Operator | [여러 기준 중 하나 선택하기](../learn/branching.html#branching-scene-2) | 조건식으로 두 값 중 하나 선택 |
| Lists, Access, Change, Add, Remove | [순서가 있는 묶음 만들기](../learn/lists.html#lists-scene-1) · [추가하고 한 항목 수정하기](../learn/lists.html#lists-scene-2) · [위치와 값으로 삭제하기](../learn/lists.html#lists-scene-3) | 인덱스, append·insert·pop·remove·del·clear |
| List Copy, Sort, Join | [같은 리스트를 가리키는 이름](../learn/list-transform.html#list-transform-scene-1) · [별도 리스트로 복사하기](../learn/list-transform.html#list-transform-scene-2) · [원본 정렬과 새 정렬 결과](../learn/list-transform.html#list-transform-scene-3) | 별칭·얕은 복사·슬라이스, sorted와 sort, +·extend |
| Loop Lists, List Comprehension | [항목마다 지시 실행하기](../learn/for-range.html#for-range-scene-1), [변환 결과를 한곳에 모으기](../learn/comprehensions.html#comprehensions-scene-1) · [조건에 맞는 항목만 남기기](../learn/comprehensions.html#comprehensions-scene-2) | 항목별 반복, 변환과 필터를 구별한 새 리스트 |
| Tuples, Access, Update, Unpack, Join | [정해진 역할의 묶음](../learn/tuples.html#tuples-scene-1) · [이름으로 나누어 받기](../learn/tuples.html#tuples-scene-2) · [바꿔야 할 때 새 튜플 만들기](../learn/tuples.html#tuples-scene-3) | 튜플·쉼표·불변성, 일반/별표 언패킹, 변환과 새 튜플 |
| Loop Tuples | [항목마다 지시 실행하기](../learn/for-range.html#for-range-scene-1) · [정해진 횟수만큼 반복하기](../learn/for-range.html#for-range-scene-2) · [번호와 여러 묶음 함께 읽기](../learn/for-range.html#for-range-scene-3), [정해진 역할의 묶음](../learn/tuples.html#tuples-scene-1) · [이름으로 나누어 받기](../learn/tuples.html#tuples-scene-2) | 순서 있는 묶음을 순회하는 공통 for 규칙과 쌍 언패킹 |
| Sets, Access, Add, Remove, Join | [같은 값을 하나로 세기](../learn/sets.html#sets-scene-1) · [두 묶음의 관계 계산하기](../learn/sets.html#sets-scene-2) · [수정할 집합과 고정할 집합](../learn/sets.html#sets-scene-3) | 순서에 기대지 않는 포함 검사, add·discard·remove·update, 네 집합 연산 |
| Frozenset | [수정할 집합과 고정할 집합](../learn/sets.html#sets-scene-3) | 수정 가능한 set과 별도의 불변 frozenset 비교 |
| Dictionaries, Access, Change, Add, Remove | [키와 값의 관계 만들기](../learn/dictionaries.html#dictionaries-scene-1) · [없는 키에 응답하기](../learn/dictionaries.html#dictionaries-scene-2) · [같은 키를 갱신하기](../learn/dictionaries.html#dictionaries-scene-3) | 키·값, get, 키 대입, update·pop, keys·values·items |
| Loop/Copy Dictionaries, Nested Dictionaries | [키가 있는 묶음과 중복 없는 묶음](../learn/comprehensions.html#comprehensions-scene-3), [기록 하나와 기록 묶음 구별하기](../learn/nested-data.html#nested-data-scene-1) · [안쪽의 특정 값만 수정하기](../learn/nested-data.html#nested-data-scene-2) · [얕은 복사의 안쪽 공유 확인하기](../learn/nested-data.html#nested-data-scene-3) | items 순회, 리스트·딕셔너리 중첩, 얕은 복사의 안쪽 공유 |
| If, Elif, Else, Nested If, Pass | [if와 들여쓰기로 실행 묶기](../learn/branching.html#branching-scene-1) · [여러 기준 중 하나 선택하기](../learn/branching.html#branching-scene-2) · [정해진 값에 따라 나누기](../learn/branching.html#branching-scene-3) | 조건·첫 참 경로·공통 후속 지시, 중첩 분기 설명, pass |
| Match | [정해진 값에 따라 나누기](../learn/branching.html#branching-scene-3) | 문자열 case 선택, 기본 case _, Python 3.10 이상 |
| While Loops | [실행 전에 조건 검사하기](../learn/while-loops.html#while-loops-scene-1) · [누적값과 반복 횟수 분리하기](../learn/while-loops.html#while-loops-scene-2) · [끝나는 이유를 확인하기](../learn/while-loops.html#while-loops-scene-3) | 선검사, 누적, 상태 갱신과 종료 이유 |
| For Loops, Range | [항목마다 지시 실행하기](../learn/for-range.html#for-range-scene-1) · [정해진 횟수만큼 반복하기](../learn/for-range.html#for-range-scene-2) · [번호와 여러 묶음 함께 읽기](../learn/for-range.html#for-range-scene-3) | for, range 끝 경계·간격, enumerate·zip, 중첩 반복 |
| Break, Continue, Loop Else | [이번 항목만 건너뛰기](../learn/loop-control.html#loop-control-scene-1) · [발견한 순간 검색 끝내기](../learn/loop-control.html#loop-control-scene-2) · [끝까지 못 찾은 경우 처리하기](../learn/loop-control.html#loop-control-scene-3) | 현재 반복 건너뛰기, 가장 안쪽 반복 종료, break 없는 종료 |
| Functions | [작업 정의와 실행 구별하기](../learn/functions.html#functions-scene-1) · [입력으로 다른 계산 하기](../learn/functions.html#functions-scene-2) · [계약을 설명하고 None 확인하기](../learn/functions.html#functions-scene-3) | 정의와 호출, 매개변수·인자·반환, 문서 문자열, 암묵적 None |
| Arguments, *args, **kwargs | [순서로 전달하거나 이름으로 지정하기](../learn/arguments.html#arguments-scene-1) · [여러 인자를 묶어 받기](../learn/arguments.html#arguments-scene-2) · [기본값 객체를 공유하지 않기](../learn/arguments.html#arguments-scene-3) · [실수하기 쉬운 옵션은 이름으로 받기](../learn/arguments.html#arguments-scene-4) | 위치·키워드·기본값·모으기/풀기, 변경 가능한 기본값 주의, /·* 경계 |
| Decorators | [함수를 받아 새 함수 돌려주기](../learn/decorators.html#decorators-scene-1) · [@ 표기로 감싸기 명시하기](../learn/decorators.html#decorators-scene-2) · [원래 함수 설명을 보존하기](../learn/decorators.html#decorators-scene-3) | 함수 감싸기, @, 인자·반환 전달, functools.wraps |
| Lambda | [함수도 값으로 전달하기](../learn/lambda.html#lambda-scene-1) · [정렬 기준만 알려주기](../learn/lambda.html#lambda-scene-2) · [변환과 선택 구별하기](../learn/lambda.html#lambda-scene-3) | 단일 표현식, 함수 전달, sorted의 key, map과 filter |
| Recursion | [가장 작은 문제부터 정하기](../learn/recursion.html#recursion-scene-1) · [호출이 쌓이고 답이 돌아오기](../learn/recursion.html#recursion-scene-2) · [반복이 더 알맞은 경우](../learn/recursion.html#recursion-scene-3) | 종료 조건, 작은 문제로 축소, 호출/반환 순서, 반복 대안과 깊이 한도 |
| Iterators, Generators | [다음 항목을 꺼내는 대상](../learn/iterators-generators.html#iterators-generators-scene-1) · [yield에서 멈추고 재개하기](../learn/iterators-generators.html#iterators-generators-scene-2) · [짧은 제너레이터 식 쓰기](../learn/iterators-generators.html#iterators-generators-scene-3) | iter·next·소비, StopIteration 설명, yield 재개, 제너레이터 식 |
| Arrays | [순서가 있는 묶음 만들기](../learn/lists.html#lists-scene-1), [리스트와 수치 배열 선택하기](../learn/modules.html#modules-scene-3) | 일반 순서 묶음으로 리스트 사용, 표준 array의 같은 수치형 저장 비교 |
| Modules | [표준 라이브러리의 도구 사용하기](../learn/modules.html#modules-scene-1) · [자기 파일에서 함수 가져오기](../learn/modules.html#modules-scene-2) · [리스트와 수치 배열 선택하기](../learn/modules.html#modules-scene-3) | import·from·as, 실제 보조 모듈, __name__ 가드, 패키지 설명 |
| PIP, VirtualEnv | [지금 실행하는 Python 확인하기](../learn/environments.html#environments-scene-1) · [임시 폴더에서 가상 환경 만들어 보기](../learn/environments.html#environments-scene-2) · [pip와 설치 범위 구별하기](../learn/environments.html#environments-scene-3) | 인터프리터 버전, 실제 임시 venv 생성과 설정 파일 확인, pip 조회/설치/버전 고정 개념 설명 |
| Dates | [달력 날짜를 객체로 만들기](../learn/dates.html#dates-scene-1) · [기간을 더하고 날짜를 빼기](../learn/dates.html#dates-scene-2) · [시각과 시간대를 명시하기](../learn/dates.html#dates-scene-3) | date·timedelta, 달력 경계, 파싱·서식, 시간대 기준 표시 |
| Math | [내장 계산과 수학 함수 조합하기](../learn/math.html#math-scene-1) · [근사 비교와 정확한 십진수](../learn/math.html#math-scene-2) · [자료의 대표값과 재현 가능한 무작위 선택](../learn/math.html#math-scene-3) | min·max·abs·sqrt·ceil·floor, isclose·Decimal, mean·median·random |
| JSON | [객체를 JSON 문자열로 바꾸기](../learn/json-data.html#json-data-scene-1) · [텍스트에서 객체 복원하기](../learn/json-data.html#json-data-scene-2) · [왕복해도 모든 자료형이 같지는 않기](../learn/json-data.html#json-data-scene-3) | dumps·loads, true/null 대응, 문자열과 객체 구별, 왕복 자료형 한계 |
| RegEx | [부분 검색과 전체 검사](../learn/regex.html#regex-scene-1) · [찾은 결과에서 일부 꺼내기](../learn/regex.html#regex-scene-2) · [일치 부분만 치환하기](../learn/regex.html#regex-scene-3) | search/fullmatch, 패턴·반복·그룹, findall·sub |
| Try...Except | [예상한 입력 오류에 응답하기](../learn/exceptions.html#exceptions-scene-1) · [정상 경로와 정리 구별하기](../learn/exceptions.html#exceptions-scene-2) · [함수의 입력 규칙 위반 알리기](../learn/exceptions.html#exceptions-scene-3) | 특정 오류 처리, else·finally, raise·예외 메시지, 성공과 실패 분리 |
| User Input | [한 줄을 입력받기](../learn/input-output.html#input-output-scene-1) · [입력 문자를 수량으로 바꾸기](../learn/input-output.html#input-output-scene-2) · [안내와 결과를 나누기](../learn/input-output.html#input-output-scene-3) | 실제 stdin을 받는 예제, 안내문과 출력, 문자열→정수 변환 |
| OOP, Classes/Objects | [한 종류의 객체 만들기](../learn/objects.html#objects-scene-1) · [생성할 때 상태 준비하기](../learn/objects.html#objects-scene-2) · [개별 객체의 상태 구별하기](../learn/objects.html#objects-scene-3) | 객체 지향, 클래스와 인스턴스, 개별 상태 |
| __init__, self | [생성할 때 상태 준비하기](../learn/objects.html#objects-scene-2) · [개별 객체의 상태 구별하기](../learn/objects.html#objects-scene-3) | 생성 후 초기화, self의 현재 인스턴스, 인자와 속성 구별 |
| Class Properties, Encapsulation | [개별 속성을 추가하고 지우기](../learn/attributes.html#attributes-scene-1) · [공통 값과 개별 값 구별하기](../learn/attributes.html#attributes-scene-2) · [공개된 변경 경로에 규칙 두기](../learn/attributes.html#attributes-scene-3) | 속성 추가/삭제, 공통/개별 속성, property의 조회·대입 규칙, _ 관례·이름 변환 설명 |
| Class Methods | [인스턴스 상태를 사용하는 메서드](../learn/methods.html#methods-scene-1) · [클래스로 만드는 다른 경로 제공하기](../learn/methods.html#methods-scene-2) · [객체 상태가 필요 없는 보조 함수](../learn/methods.html#methods-scene-3) | 인스턴스 메서드, classmethod 대체 생성 경로, staticmethod 검증 함수 |
| Magic Methods: __str__, __repr__ | [사용자 표시와 개발 확인 구별하기](../learn/special-methods.html#special-methods-scene-1) | 사용자 표시와 개발용 표현 구별 |
| Magic Methods: __len__, __contains__ | [길이와 포함 여부 제공하기](../learn/special-methods.html#special-methods-scene-2) | len과 in에 내부 자료의 의미 연결 |
| Magic Methods: __eq__, __lt__ | [값 비교와 정렬 기준 정의하기](../learn/special-methods.html#special-methods-scene-3) | 값 동등성과 정렬, NotImplemented 처리 |
| Magic Methods: __add__, __call__ | [덧셈과 호출에 의미 부여하기](../learn/special-methods.html#special-methods-scene-4) | 원본을 보존한 새 객체 덧셈, 호출 가능한 객체 |
| Inheritance | [공통 속성과 행동 이어받기](../learn/inheritance.html#inheritance-scene-1) · [부모 초기화 후 새 정보 더하기](../learn/inheritance.html#inheritance-scene-2) · [같은 메서드 이름에 새 행동 제공하기](../learn/inheritance.html#inheritance-scene-3) | 부모 행동 사용, super 초기화, 재정의와 계약 유지 |
| Polymorphism | [같은 함수가 여러 종류에 동작하기](../learn/polymorphism.html#polymorphism-scene-1) · [상속 없이 같은 요청에 답하기](../learn/polymorphism.html#polymorphism-scene-2) · [반환 의미까지 같은 계약 유지하기](../learn/polymorphism.html#polymorphism-scene-3) | 기본 도구, 상속 없는 덕 타이핑, 입력·반환 계약 |
| Inner Classes | [클래스 안에서 다른 클래스 정의하기](../learn/nested-classes.html#nested-classes-scene-1) · [바깥 정보를 쓰려면 직접 전달하기](../learn/nested-classes.html#nested-classes-scene-2) · [중첩과 구성을 구별하기](../learn/nested-classes.html#nested-classes-scene-3) | 중첩된 이름 경로, 바깥 객체의 명시적 전달, 구성과의 구별 |
| File Handling, Read Files | [파일 위치와 글자 해석 정하기](../learn/read-files.html#read-files-scene-1) · [한 줄씩 읽고 자동으로 닫기](../learn/read-files.html#read-files-scene-2) · [문자 수와 바이트 수 구별하기](../learn/read-files.html#read-files-scene-3) | 경로·UTF-8·전체/줄 읽기, with 자동 닫기, 텍스트/이진 구별 |
| Write/Create Files | [새 파일 생성과 끝에 추가](../learn/write-files.html#write-files-scene-1) · [덮어쓰기의 영향을 확인하기](../learn/write-files.html#write-files-scene-2) | 실제 임시 파일로 x·a·w·write_text 비교 |
| Delete Files | [방금 만든 파일과 빈 폴더 삭제하기](../learn/write-files.html#write-files-scene-3) | 임시 파일 unlink, 비어 있는 임시 폴더 rmdir, 존재 여부 재확인 |
| 여러 주제를 함께 사용하는 실습 | [한 줄의 입력 계약 정하기](../learn/final-project.html#final-project-scene-1) · [유효한 줄만 장소별로 더하기](../learn/final-project.html#final-project-scene-2) · [저장한 파일을 다시 읽어 대조하기](../learn/final-project.html#final-project-scene-3) | 입력 계약, 오류가 있는 여러 기록 집계, 실제 JSON 저장 뒤 재조회 |

별도 전문 과정인 NumPy·Pandas·SciPy·Django·Matplotlib·머신러닝·자료구조와 알고리즘·MySQL·MongoDB, 외부 네트워크 요청, 계정·서버 구축은 포함하지 않습니다. 입력과 파일 예제는 제공한 작은 데이터로 재현하며 패키지 설치를 요구하지 않습니다. 가상 환경 예제는 `with_pip=False`로 실제 환경을 만들고 설정 파일 생성을 확인합니다. 새 환경의 Python을 직접 지정하는 명령은 본문에서 설명하며, 이 예제의 True를 현재 인터프리터 변경의 증거로 간주하지 않습니다. pip 명령 설명은 패키지를 내려받았다는 실행 증거로 간주하지 않습니다.

## 레슨별 구현 기준

다음 목록은 현재 교육 원본 JSON의 제목·문제·목표·선행 레슨·주제와 모든 구간의 순서를 정리한 것입니다. 선행 레슨은 모두 목차에서 현재 레슨보다 먼저 나옵니다. 슬러그는 파일과 URL에 쓰는 고정 식별자이며 화면 제목을 대체하는 용어가 아닙니다.

구간 이름 앞의 **읽기**와 **시각화**는 표시 방식을 구별합니다. **읽기·글만**은 코드·그림 없이 본문으로 설명하는 구간입니다. 나머지 읽기 구간에는 정적 코드·출력이 있으며 필요한 경우 정적 도식을 함께 둡니다. 이 구분은 학습 내용의 중요도나 필수 여부를 뜻하지 않습니다.

### 값으로 생각하기 (5레슨)

계산한 값에 이름을 붙이고 설명할 수 있을까요?

1. **처음 실행하고 결과 읽기** (`run-python`)

   - 문제: 컴퓨터에 계산을 요청하려는데 무엇을 적고 어디서 결과를 읽는지 모릅니다.
   - 목표: 코드와 출력을 구분하고 세 줄의 실행 순서를 설명합니다.
   - 선행 레슨: 없음
   - 주제: Python · 실행 · print · 주석 · 문법
   - 구간: 읽기·글만: [처음에는 결과부터 읽어 봅니다](../learn/run-python.html#run-python-reading-introduction) → 읽기: [한 줄로 말을 건네기](../learn/run-python.html#run-python-scene-1) → 읽기: [위에서 아래로 읽기](../learn/run-python.html#run-python-scene-2) → 읽기: [직접 실행할 준비](../learn/run-python.html#run-python-scene-3)

2. **값에 이름을 연결하기** (`variables`)

   - 문제: 같은 수를 여러 계산에 쓰고 나중에 바꾸고 싶습니다.
   - 목표: 대입과 재대입을 이름과 객체의 연결로 설명합니다.
   - 선행 레슨: [처음 실행하고 결과 읽기](../learn/run-python.html)
   - 주제: 변수 · 이름 · 객체 · 대입 · 재대입
   - 구간: 읽기·글만: [관찰한 수에 이름 붙이기](../learn/variables.html#variables-reading-introduction) → 읽기: [이름과 값 구분하기](../learn/variables.html#variables-scene-1) → 읽기: [오른쪽을 먼저 계산하기](../learn/variables.html#variables-scene-2) → 읽기: [이름으로 값을 사용하기](../learn/variables.html#variables-scene-3) → 시각화: [재대입으로 연결 바꾸기](../learn/variables.html#variables-scene-4)

3. **같아 보이는 값 구별하기** (`data-types`)

   - 문제: 화면에는 둘 다 12인데 하나는 계산되고 하나는 글처럼 이어집니다.
   - 목표: 자료형에 따라 가능한 연산이 달라짐을 설명하고 필요한 변환을 선택합니다.
   - 선행 레슨: [값에 이름을 연결하기](../learn/variables.html)
   - 주제: 자료형 · int · float · str · bool · None · 형 변환
   - 구간: 읽기: [자료형으로 역할 확인하기](../learn/data-types.html#data-types-scene-1) → 읽기: [계산할 값으로 변환하기](../learn/data-types.html#data-types-scene-2) → 읽기: [참·거짓과 값 없음 구별하기](../learn/data-types.html#data-types-scene-3)

4. **수량과 나머지 계산하기** (`numbers`)

   - 문제: 17개를 네 개씩 포장했을 때 완성된 포장 수와 남은 수량을 구하고 싶습니다.
   - 목표: 나눗셈의 종류를 구별하고 소수의 표시와 정확성을 설명합니다.
   - 선행 레슨: [같아 보이는 값 구별하기](../learn/data-types.html)
   - 주제: 산술 연산 · 나눗셈 · 나머지 · 거듭제곱 · 부동소수점 · complex
   - 구간: 읽기: [몫과 나머지를 나누어 묻기](../learn/numbers.html#numbers-scene-1) → 읽기: [계산 순서 드러내기](../learn/numbers.html#numbers-scene-2) → 읽기: [소수 계산의 오차 알아두기](../learn/numbers.html#numbers-scene-3)

5. **글의 위치와 표현 다루기** (`strings`)

   - 문제: 기록 코드에서 날짜 부분만 꺼내고 읽기 좋은 안내문을 만들고 싶습니다.
   - 목표: 문자열의 위치·부분 범위·서식을 구분해 사용합니다.
   - 선행 레슨: [같아 보이는 값 구별하기](../learn/data-types.html)
   - 주제: 문자열 · 인덱스 · 슬라이스 · 이스케이프 · f-string
   - 구간: 읽기: [첫 글자와 마지막 글자 찾기](../learn/strings.html#strings-scene-1) → 읽기: [부분 범위를 잘라 읽기](../learn/strings.html#strings-scene-2) → 읽기: [값을 문장 안에 넣기](../learn/strings.html#strings-scene-3)

### 입력을 판단으로 바꾸기 (5레슨)

입력한 글을 읽고 상황에 맞는 답을 고를 수 있을까요?

6. **입력한 글을 정리하기** (`text-tools`)

   - 문제: 앞뒤 공백과 대소문자 차이 때문에 같은 장소를 다른 값으로 처리합니다.
   - 목표: 문자열 메서드로 공백·형태·구분자를 정리합니다.
   - 선행 레슨: [글의 위치와 표현 다루기](../learn/strings.html)
   - 주제: 메서드 · strip · lower · replace · split · join · 문자열 검색
   - 구간: 읽기: [공백과 대소문자 맞추기](../learn/text-tools.html#text-tools-scene-1) → 읽기: [찾고 바꾸기](../learn/text-tools.html#text-tools-scene-2) → 읽기: [나누고 다시 잇기](../learn/text-tools.html#text-tools-scene-3)

7. **입력을 받아 답 만들기** (`input-output`)

   - 문제: 사용자가 입력한 관찰 횟수로 합계를 계산해야 합니다.
   - 목표: input()의 문자열 결과를 변환하고 print()로 답을 구성합니다.
   - 선행 레슨: [같아 보이는 값 구별하기](../learn/data-types.html)
   - 주제: input · print · 표준 입력 · 표준 출력 · 형 변환
   - 구간: 읽기: [한 줄을 입력받기](../learn/input-output.html#input-output-scene-1) → 읽기: [입력 문자를 수량으로 바꾸기](../learn/input-output.html#input-output-scene-2) → 읽기: [안내와 결과를 나누기](../learn/input-output.html#input-output-scene-3)

8. **조건을 참과 거짓으로 읽기** (`booleans`)

   - 문제: 수량이 기준을 넘었는지와 기록이 비어 있는지 판단해야 합니다.
   - 목표: 비교 결과와 논리 연산을 bool 값으로 설명합니다.
   - 선행 레슨: [같아 보이는 값 구별하기](../learn/data-types.html)
   - 주제: 불리언 · 비교 · and · or · not · 참값 판정 · None
   - 구간: 읽기: [비교로 질문 만들기](../learn/booleans.html#booleans-scene-1) → 읽기: [여러 조건을 연결하기](../learn/booleans.html#booleans-scene-2) → 읽기: [비어 있음과 값 없음 구별하기](../learn/booleans.html#booleans-scene-3)

9. **상황에 맞는 실행 경로 고르기** (`branching`)

   - 문제: 관찰 횟수에 따라 서로 다른 안내를 출력해야 합니다.
   - 목표: if·elif·else와 match에서 실행되는 분기를 설명합니다.
   - 선행 레슨: [조건을 참과 거짓으로 읽기](../learn/booleans.html)
   - 주제: if · elif · else · 들여쓰기 · 조건식 · match · case · pass
   - 구간: 시각화: [if와 들여쓰기로 실행 묶기](../learn/branching.html#branching-scene-1) → 읽기: [여러 기준 중 하나 선택하기](../learn/branching.html#branching-scene-2) → 읽기: [정해진 값에 따라 나누기](../learn/branching.html#branching-scene-3)

10. **연산의 뜻과 우선순위 확인하기** (`operators`)

   - 문제: 비슷하게 생긴 연산 기호 때문에 조건이 의도와 다르게 동작합니다.
   - 목표: 값 비교·동일성·포함 여부·비트 연산을 구별합니다.
   - 선행 레슨: [값에 이름을 연결하기](../learn/variables.html) · [수량과 나머지 계산하기](../learn/numbers.html) · [조건을 참과 거짓으로 읽기](../learn/booleans.html)
   - 주제: 연산자 · == · is · in · 단락 평가 · 증강 대입 · 비트 연산 · 우선순위
   - 구간: 읽기: [값·객체·포함을 구별하기](../learn/operators.html#operators-scene-1) → 읽기: [조건의 계산 순서 이용하기](../learn/operators.html#operators-scene-2) → 읽기: [비트별 상태를 비교하기](../learn/operators.html#operators-scene-3)

### 여러 값을 정리하기 (6레슨)

여러 기록을 필요한 순서와 기준으로 찾을 수 있을까요?

11. **리스트의 순서와 항목 바꾸기** (`lists`)

   - 문제: 관찰 장소를 순서대로 기록하고 잘못 적은 항목을 고쳐야 합니다.
   - 목표: 리스트의 항목을 읽고 추가·수정·삭제한 결과를 설명합니다.
   - 선행 레슨: [값에 이름을 연결하기](../learn/variables.html) · [글의 위치와 표현 다루기](../learn/strings.html)
   - 주제: 리스트 · 인덱스 · append · insert · pop · remove · 배열
   - 구간: 읽기: [순서가 있는 묶음 만들기](../learn/lists.html#lists-scene-1) → 읽기: [추가하고 한 항목 수정하기](../learn/lists.html#lists-scene-2) → 읽기: [위치와 값으로 삭제하기](../learn/lists.html#lists-scene-3)

12. **리스트를 복사하고 정렬하기** (`list-transform`)

   - 문제: 원본 관찰 기록은 유지하면서 다른 순서로 비교하고 싶습니다.
   - 목표: 같은 객체 연결·얕은 복사·정렬 결과를 구별합니다.
   - 선행 레슨: [리스트의 순서와 항목 바꾸기](../learn/lists.html)
   - 주제: 별칭 · 얕은 복사 · copy · sorted · sort · 슬라이스 · extend
   - 구간: 시각화: [같은 리스트를 가리키는 이름](../learn/list-transform.html#list-transform-scene-1) → 읽기: [별도 리스트로 복사하기](../learn/list-transform.html#list-transform-scene-2) → 읽기: [원본 정렬과 새 정렬 결과](../learn/list-transform.html#list-transform-scene-3)

13. **한 묶음의 의미를 고정하기** (`tuples`)

   - 문제: 좌표처럼 항목 수와 순서의 의미가 정해진 값을 함께 전달해야 합니다.
   - 목표: 튜플의 불변성과 언패킹을 설명하고 항목을 꺼냅니다.
   - 선행 레슨: [리스트의 순서와 항목 바꾸기](../learn/lists.html)
   - 주제: 튜플 · 불변 · 언패킹 · 별표 언패킹 · tuple
   - 구간: 읽기: [정해진 역할의 묶음](../learn/tuples.html#tuples-scene-1) → 읽기: [이름으로 나누어 받기](../learn/tuples.html#tuples-scene-2) → 읽기: [바꿔야 할 때 새 튜플 만들기](../learn/tuples.html#tuples-scene-3)

14. **중복과 공통 항목 찾기** (`sets`)

   - 문제: 두 번 방문한 장소는 하나로 세고 두 기록의 공통 장소를 찾고 싶습니다.
   - 목표: 집합의 중복 제거와 합집합·교집합·차집합을 사용합니다.
   - 선행 레슨: [리스트의 순서와 항목 바꾸기](../learn/lists.html)
   - 주제: 집합 · set · frozenset · 합집합 · 교집합 · 차집합 · 대칭 차집합
   - 구간: 읽기: [같은 값을 하나로 세기](../learn/sets.html#sets-scene-1) → 읽기: [두 묶음의 관계 계산하기](../learn/sets.html#sets-scene-2) → 읽기: [수정할 집합과 고정할 집합](../learn/sets.html#sets-scene-3)

15. **이름표로 값 찾기** (`dictionaries`)

   - 문제: 순번을 외우지 않고 장소 이름으로 관찰 횟수를 찾고 싶습니다.
   - 목표: 딕셔너리의 키와 값을 읽고 추가·수정·삭제합니다.
   - 선행 레슨: [리스트의 순서와 항목 바꾸기](../learn/lists.html)
   - 주제: 딕셔너리 · 키 · 값 · get · items · update · pop
   - 구간: 읽기: [키와 값의 관계 만들기](../learn/dictionaries.html#dictionaries-scene-1) → 읽기: [없는 키에 응답하기](../learn/dictionaries.html#dictionaries-scene-2) → 읽기: [같은 키를 갱신하기](../learn/dictionaries.html#dictionaries-scene-3)

16. **중첩된 기록 읽기** (`nested-data`)

   - 문제: 장소마다 날짜와 여러 관찰 수량이 연결된 기록을 다뤄야 합니다.
   - 목표: 중첩 데이터의 접근 경로와 얕은 복사의 공유 관계를 설명합니다.
   - 선행 레슨: [리스트를 복사하고 정렬하기](../learn/list-transform.html) · [이름표로 값 찾기](../learn/dictionaries.html)
   - 주제: 중첩 · 리스트 안 딕셔너리 · 중첩 접근 · 얕은 복사
   - 구간: 읽기: [기록 하나와 기록 묶음 구별하기](../learn/nested-data.html#nested-data-scene-1) → 읽기: [안쪽의 특정 값만 수정하기](../learn/nested-data.html#nested-data-scene-2) → 시각화: [얕은 복사의 안쪽 공유 확인하기](../learn/nested-data.html#nested-data-scene-3)

### 반복을 맡기기 (4레슨)

같은 작업을 값마다 반복하고 멈출 때를 정할 수 있을까요?

17. **모든 항목에 같은 작업 하기** (`for-range`)

   - 문제: 장소가 늘어날 때마다 출력 코드를 한 줄씩 더 쓰고 있습니다.
   - 목표: for가 항목을 꺼내는 순서와 range의 끝 경계를 설명합니다.
   - 선행 레슨: [리스트의 순서와 항목 바꾸기](../learn/lists.html) · [한 묶음의 의미를 고정하기](../learn/tuples.html)
   - 주제: for · range · enumerate · zip · 중첩 반복
   - 구간: 읽기: [항목마다 지시 실행하기](../learn/for-range.html#for-range-scene-1) → 읽기: [정해진 횟수만큼 반복하기](../learn/for-range.html#for-range-scene-2) → 읽기: [번호와 여러 묶음 함께 읽기](../learn/for-range.html#for-range-scene-3)

18. **끝날 조건까지 반복하기** (`while-loops`)

   - 문제: 목표 수량에 도달하는 데 몇 번이 걸릴지 반복 전에 알 수 없습니다.
   - 목표: while의 조건 검사와 상태 갱신으로 종료를 설명합니다.
   - 선행 레슨: [조건을 참과 거짓으로 읽기](../learn/booleans.html) · [연산의 뜻과 우선순위 확인하기](../learn/operators.html)
   - 주제: while · 조건 반복 · 누적 · 무한 반복
   - 구간: 시각화: [실행 전에 조건 검사하기](../learn/while-loops.html#while-loops-scene-1) → 읽기: [누적값과 반복 횟수 분리하기](../learn/while-loops.html#while-loops-scene-2) → 읽기: [끝나는 이유를 확인하기](../learn/while-loops.html#while-loops-scene-3)

19. **건너뛸 때와 멈출 때 정하기** (`loop-control`)

   - 문제: 잘못된 기록은 제외하고 찾던 항목을 발견하면 검색을 끝내고 싶습니다.
   - 목표: continue·break·반복문의 else가 실행되는 조건을 구별합니다.
   - 선행 레슨: [상황에 맞는 실행 경로 고르기](../learn/branching.html) · [모든 항목에 같은 작업 하기](../learn/for-range.html) · [끝날 조건까지 반복하기](../learn/while-loops.html)
   - 주제: continue · break · 반복문 else · 검색
   - 구간: 시각화: [이번 항목만 건너뛰기](../learn/loop-control.html#loop-control-scene-1) → 읽기: [발견한 순간 검색 끝내기](../learn/loop-control.html#loop-control-scene-2) → 읽기: [끝까지 못 찾은 경우 처리하기](../learn/loop-control.html#loop-control-scene-3)

20. **필요한 값만 새 묶음으로 만들기** (`comprehensions`)

   - 문제: 유효한 관찰 수량만 골라 같은 단위로 바꾼 목록이 필요합니다.
   - 목표: 컴프리헨션을 반복·필터·변환의 순서로 해석합니다.
   - 선행 레슨: [상황에 맞는 실행 경로 고르기](../learn/branching.html) · [중복과 공통 항목 찾기](../learn/sets.html) · [이름표로 값 찾기](../learn/dictionaries.html) · [모든 항목에 같은 작업 하기](../learn/for-range.html)
   - 주제: 리스트 컴프리헨션 · 필터 · 딕셔너리 컴프리헨션 · 집합 컴프리헨션
   - 구간: 읽기: [변환 결과를 한곳에 모으기](../learn/comprehensions.html#comprehensions-scene-1) → 읽기: [조건에 맞는 항목만 남기기](../learn/comprehensions.html#comprehensions-scene-2) → 읽기: [키가 있는 묶음과 중복 없는 묶음](../learn/comprehensions.html#comprehensions-scene-3)

### 해결 방법을 재사용하기 (7레슨)

한 번 작성한 계산을 다른 입력에도 쓸 수 있을까요?

21. **계산에 이름을 붙여 재사용하기** (`functions`)

   - 문제: 같은 합계 계산을 여러 곳에 복사하면 수정할 곳이 늘어납니다.
   - 목표: 함수 정의·호출·인자·반환값을 연결해 설명합니다.
   - 선행 레슨: [값에 이름을 연결하기](../learn/variables.html)
   - 주제: 함수 · def · 호출 · 매개변수 · 인자 · return · 문서 문자열
   - 구간: 시각화: [작업 정의와 실행 구별하기](../learn/functions.html#functions-scene-1) → 읽기: [입력으로 다른 계산 하기](../learn/functions.html#functions-scene-2) → 읽기: [계약을 설명하고 None 확인하기](../learn/functions.html#functions-scene-3)

22. **함수 입력의 규칙 정하기** (`arguments`)

   - 문제: 같은 함수에서 기본 단위·선택 옵션·여러 수량을 일관되게 받고 싶습니다.
   - 목표: 위치·키워드·기본 인자와 가변 인자의 연결 방식을 설명합니다.
   - 선행 레슨: [한 묶음의 의미를 고정하기](../learn/tuples.html) · [이름표로 값 찾기](../learn/dictionaries.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html)
   - 주제: 인자 · 매개변수 · 기본값 · 키워드 인자 · args · kwargs · 위치 전용 · 키워드 전용
   - 구간: 읽기: [순서로 전달하거나 이름으로 지정하기](../learn/arguments.html#arguments-scene-1) → 읽기: [여러 인자를 묶어 받기](../learn/arguments.html#arguments-scene-2) → 읽기: [기본값 객체를 공유하지 않기](../learn/arguments.html#arguments-scene-3) → 읽기: [실수하기 쉬운 옵션은 이름으로 받기](../learn/arguments.html#arguments-scene-4)

23. **이름이 유효한 범위 구별하기** (`scope`)

   - 문제: 함수 안에서 이름을 바꿨는데 바깥 값이 그대로여서 혼란스럽습니다.
   - 목표: 지역·전역·바깥 함수 이름의 조회와 변경을 구별합니다.
   - 선행 레슨: [값에 이름을 연결하기](../learn/variables.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html)
   - 주제: 이름 범위 · 지역 · 전역 · global · nonlocal · 클로저
   - 구간: 읽기: [함수 안 이름과 바깥 이름](../learn/scope.html#scope-scene-1) → 읽기: [전역 변경이 필요한지 먼저 판단하기](../learn/scope.html#scope-scene-2) → 시각화: [바깥 함수의 값을 기억하기](../learn/scope.html#scope-scene-3)

24. **필요한 값부터 하나씩 만들기** (`iterators-generators`)

   - 문제: 전체 결과를 한 번에 만들지 않고 필요한 만큼 차례대로 처리하고 싶습니다.
   - 목표: 반복 가능한 객체·반복자·제너레이터의 소비와 재개를 설명합니다.
   - 선행 레슨: [모든 항목에 같은 작업 하기](../learn/for-range.html) · [필요한 값만 새 묶음으로 만들기](../learn/comprehensions.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html)
   - 주제: 반복 가능한 객체 · 반복자 · iter · next · 제너레이터 · yield · 제너레이터 식
   - 구간: 읽기: [다음 항목을 꺼내는 대상](../learn/iterators-generators.html#iterators-generators-scene-1) → 시각화: [yield에서 멈추고 재개하기](../learn/iterators-generators.html#iterators-generators-scene-2) → 읽기: [짧은 제너레이터 식 쓰기](../learn/iterators-generators.html#iterators-generators-scene-3)

25. **짧은 계산을 함수에 전달하기** (`lambda`)

   - 문제: 기록을 수량 기준으로 정렬하려는데 딕셔너리 자체는 바로 비교할 수 없습니다.
   - 목표: lambda의 입력·표현식과 정렬 기준 함수의 역할을 설명합니다.
   - 선행 레슨: [리스트를 복사하고 정렬하기](../learn/list-transform.html) · [중첩된 기록 읽기](../learn/nested-data.html) · [필요한 값만 새 묶음으로 만들기](../learn/comprehensions.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html)
   - 주제: lambda · 일급 함수 · key · map · filter
   - 구간: 읽기: [함수도 값으로 전달하기](../learn/lambda.html#lambda-scene-1) → 읽기: [정렬 기준만 알려주기](../learn/lambda.html#lambda-scene-2) → 읽기: [변환과 선택 구별하기](../learn/lambda.html#lambda-scene-3)

26. **작은 같은 문제로 나누기** (`recursion`)

   - 문제: 0 이상의 정수 n이 주어졌을 때 1부터 n까지의 합을 구해야 합니다. n이 0이면 합을 0으로 정합니다.
   - 목표: 재귀의 종료 조건·축소 단계·돌아오는 반환값을 추적합니다.
   - 선행 레슨: [상황에 맞는 실행 경로 고르기](../learn/branching.html) · [모든 항목에 같은 작업 하기](../learn/for-range.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html)
   - 주제: 재귀 · 종료 조건 · 호출 스택 · 재귀 한도
   - 구간: 읽기: [가장 작은 문제부터 정하기](../learn/recursion.html#recursion-scene-1) → 시각화: [호출이 쌓이고 답이 돌아오기](../learn/recursion.html#recursion-scene-2) → 읽기: [반복이 더 알맞은 경우](../learn/recursion.html#recursion-scene-3)

27. **함수 앞뒤에 공통 작업 붙이기** (`decorators`)

   - 문제: 여러 함수의 실행 시작과 종료를 알리는 코드를 반복해서 쓰고 있습니다.
   - 목표: 함수를 감싸는 함수와 @ 표기의 관계를 설명합니다.
   - 선행 레슨: [함수 입력의 규칙 정하기](../learn/arguments.html) · [이름이 유효한 범위 구별하기](../learn/scope.html)
   - 주제: 데코레이터 · 감싸는 함수 · 고차 함수 · functools.wraps
   - 구간: 시각화: [함수를 받아 새 함수 돌려주기](../learn/decorators.html#decorators-scene-1) → 읽기: [@ 표기로 감싸기 명시하기](../learn/decorators.html#decorators-scene-2) → 읽기: [원래 함수 설명을 보존하기](../learn/decorators.html#decorators-scene-3)

### 외부 도구와 데이터 연결하기 (6레슨)

검증된 도구로 날짜와 텍스트 데이터를 처리할 수 있을까요?

28. **모듈을 불러와 연결하기** (`modules`)

   - 문제: 다른 파일의 함수와 Python에 포함된 도구를 재사용하고 싶습니다.
   - 목표: 모듈 가져오기·자체 모듈 연결·리스트와 수치 배열의 차이를 설명합니다.
   - 선행 레슨: [리스트의 순서와 항목 바꾸기](../learn/lists.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html)
   - 주제: 모듈 · import · from · 별칭 · 패키지 · __name__ · array
   - 구간: 읽기: [표준 라이브러리의 도구 사용하기](../learn/modules.html#modules-scene-1) → 읽기: [자기 파일에서 함수 가져오기](../learn/modules.html#modules-scene-2) → 읽기: [리스트와 수치 배열 선택하기](../learn/modules.html#modules-scene-3)

29. **프로젝트마다 도구 환경 나누기** (`environments`)

   - 문제: 프로젝트 A에서 설치한 패키지가 프로젝트 B와 충돌할까 걱정됩니다.
   - 목표: 인터프리터·가상 환경·pip의 역할과 실행 경계를 구별합니다.
   - 선행 레슨: [처음 실행하고 결과 읽기](../learn/run-python.html) · [모듈을 불러와 연결하기](../learn/modules.html)
   - 주제: 인터프리터 · 가상 환경 · venv · pip · 패키지 설치 · 의존성
   - 구간: 읽기·글만: [같은 컴퓨터, 다른 프로젝트](../learn/environments.html#environments-reading-introduction) → 읽기: [지금 실행하는 Python 확인하기](../learn/environments.html#environments-scene-1) → 읽기: [임시 폴더에서 가상 환경 만들어 보기](../learn/environments.html#environments-scene-2) → 읽기: [pip와 설치 범위 구별하기](../learn/environments.html#environments-scene-3)

30. **날짜를 값으로 계산하기** (`dates`)

   - 문제: 날짜를 문자열로 더했더니 다음 날짜가 계산되지 않습니다.
   - 목표: date·timedelta·datetime의 역할을 구별하고 날짜 차이를 계산합니다.
   - 선행 레슨: [모듈을 불러와 연결하기](../learn/modules.html)
   - 주제: 날짜 · date · timedelta · datetime · 시간대 · isoformat · strptime · strftime
   - 구간: 읽기: [달력 날짜를 객체로 만들기](../learn/dates.html#dates-scene-1) → 읽기: [기간을 더하고 날짜를 빼기](../learn/dates.html#dates-scene-2) → 읽기: [시각과 시간대를 명시하기](../learn/dates.html#dates-scene-3)

31. **수학 도구로 결과 확인하기** (`math`)

   - 문제: 기본 연산만으로는 평균·거리·소수 비교의 의도가 잘 드러나지 않습니다.
   - 목표: 수학·통계·정확한 십진 계산에 알맞은 도구를 고릅니다.
   - 선행 레슨: [수량과 나머지 계산하기](../learn/numbers.html) · [모듈을 불러와 연결하기](../learn/modules.html)
   - 주제: math · statistics · isclose · Decimal · random · 난수
   - 구간: 읽기: [내장 계산과 수학 함수 조합하기](../learn/math.html#math-scene-1) → 읽기: [근사 비교와 정확한 십진수](../learn/math.html#math-scene-2) → 읽기: [자료의 대표값과 재현 가능한 무작위 선택](../learn/math.html#math-scene-3)

32. **일정한 글 패턴 찾기** (`regex`)

   - 문제: 메모에서 관찰 코드만 찾고 코드 전체의 형식도 검사해야 합니다.
   - 목표: 정규 표현식의 검색·전체 일치·추출·치환을 구별합니다.
   - 선행 레슨: [입력한 글을 정리하기](../learn/text-tools.html) · [상황에 맞는 실행 경로 고르기](../learn/branching.html) · [모듈을 불러와 연결하기](../learn/modules.html)
   - 주제: 정규 표현식 · 패턴 · re · search · fullmatch · findall · group · sub
   - 구간: 읽기: [부분 검색과 전체 검사](../learn/regex.html#regex-scene-1) → 읽기: [찾은 결과에서 일부 꺼내기](../learn/regex.html#regex-scene-2) → 읽기: [일치 부분만 치환하기](../learn/regex.html#regex-scene-3)

33. **다른 도구에서도 읽을 수 있는 기록 만들기** (`json-data`)

   - 문제: Python 안의 기록을 다른 프로그램과 교환할 텍스트로 만들고 싶습니다.
   - 목표: JSON 문자열과 Python 객체를 구분해 직렬화·역직렬화합니다.
   - 선행 레슨: [중첩된 기록 읽기](../learn/nested-data.html) · [모듈을 불러와 연결하기](../learn/modules.html)
   - 주제: JSON · 직렬화 · 역직렬화 · dumps · loads · null
   - 구간: 읽기: [객체를 JSON 문자열로 바꾸기](../learn/json-data.html#json-data-scene-1) → 읽기: [텍스트에서 객체 복원하기](../learn/json-data.html#json-data-scene-2) → 읽기: [왕복해도 모든 자료형이 같지는 않기](../learn/json-data.html#json-data-scene-3)

### 함께 움직이는 데이터 만들기 (7레슨)

데이터와 그 데이터를 바꾸는 규칙을 한곳에 둘 수 있을까요?

34. **데이터와 행동을 객체로 묶기** (`objects`)

   - 문제: 기록의 장소와 수량을 함께 다루는 이름 있는 구조가 필요합니다.
   - 목표: 클래스·인스턴스·초기화·self의 관계를 설명합니다.
   - 선행 레슨: [값에 이름을 연결하기](../learn/variables.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html)
   - 주제: 클래스 · 객체 · 인스턴스 · 속성 · __init__ · self · 객체 지향
   - 구간: 읽기: [한 종류의 객체 만들기](../learn/objects.html#objects-scene-1) → 읽기: [생성할 때 상태 준비하기](../learn/objects.html#objects-scene-2) → 읽기: [개별 객체의 상태 구별하기](../learn/objects.html#objects-scene-3)

35. **속성의 공유와 변경 규칙 정하기** (`attributes`)

   - 문제: 모든 기록에 공통인 단위와 개별 수량을 구분하고 잘못된 변경을 막고 싶습니다.
   - 목표: 클래스 속성·인스턴스 속성·캡슐화와 property의 역할을 구별합니다.
   - 선행 레슨: [데이터와 행동을 객체로 묶기](../learn/objects.html) · [함수 앞뒤에 공통 작업 붙이기](../learn/decorators.html)
   - 주제: 속성 · 클래스 속성 · 인스턴스 속성 · 캡슐화 · property · 이름 변환 · del
   - 구간: 읽기: [개별 속성을 추가하고 지우기](../learn/attributes.html#attributes-scene-1) → 시각화: [공통 값과 개별 값 구별하기](../learn/attributes.html#attributes-scene-2) → 읽기: [공개된 변경 경로에 규칙 두기](../learn/attributes.html#attributes-scene-3)

36. **객체의 행동에 이름 붙이기** (`methods`)

   - 문제: 수량을 바꾸는 규칙을 코드 여러 곳에서 반복하지 않으려 합니다.
   - 목표: 인스턴스·클래스·정적 메서드의 첫 인자와 목적을 구별합니다.
   - 선행 레슨: [데이터와 행동을 객체로 묶기](../learn/objects.html) · [함수 앞뒤에 공통 작업 붙이기](../learn/decorators.html)
   - 주제: 메서드 · 인스턴스 메서드 · classmethod · staticmethod · cls
   - 구간: 읽기: [인스턴스 상태를 사용하는 메서드](../learn/methods.html#methods-scene-1) → 읽기: [클래스로 만드는 다른 경로 제공하기](../learn/methods.html#methods-scene-2) → 읽기: [객체 상태가 필요 없는 보조 함수](../learn/methods.html#methods-scene-3)

37. **공통 행동을 이어받아 바꾸기** (`inheritance`)

   - 문제: 여러 기록 종류가 기본 정보는 같지만 안내문 일부가 다릅니다.
   - 목표: 상속·부모 초기화·메서드 재정의의 실행 관계를 설명합니다.
   - 선행 레슨: [객체의 행동에 이름 붙이기](../learn/methods.html)
   - 주제: 상속 · 부모 클래스 · 자식 클래스 · super · 재정의
   - 구간: 읽기: [공통 속성과 행동 이어받기](../learn/inheritance.html#inheritance-scene-1) → 읽기: [부모 초기화 후 새 정보 더하기](../learn/inheritance.html#inheritance-scene-2) → 읽기: [같은 메서드 이름에 새 행동 제공하기](../learn/inheritance.html#inheritance-scene-3)

38. **같은 요청을 여러 종류에 보내기** (`polymorphism`)

   - 문제: 기록 종류가 늘 때마다 종류별 조건문을 계속 추가하고 있습니다.
   - 목표: 동일한 호출 계약을 여러 객체가 제공하는 다형성을 설명합니다.
   - 선행 레슨: [객체의 행동에 이름 붙이기](../learn/methods.html)
   - 주제: 다형성 · 덕 타이핑 · 호출 계약
   - 구간: 읽기: [같은 함수가 여러 종류에 동작하기](../learn/polymorphism.html#polymorphism-scene-1) → 읽기: [상속 없이 같은 요청에 답하기](../learn/polymorphism.html#polymorphism-scene-2) → 읽기: [반환 의미까지 같은 계약 유지하기](../learn/polymorphism.html#polymorphism-scene-3)

39. **기본 연산과 객체 연결하기** (`special-methods`)

   - 문제: 직접 만든 객체를 print·len·정렬·덧셈 같은 기본 도구와 함께 쓰고 싶습니다.
   - 목표: 특수 메서드가 표준 연산과 연결되는 방식을 설명합니다.
   - 선행 레슨: [연산의 뜻과 우선순위 확인하기](../learn/operators.html) · [리스트를 복사하고 정렬하기](../learn/list-transform.html) · [객체의 행동에 이름 붙이기](../learn/methods.html)
   - 주제: 특수 메서드 · __str__ · __repr__ · __len__ · __contains__ · __eq__ · __lt__ · __add__ · __call__ · NotImplemented
   - 구간: 읽기: [사용자 표시와 개발 확인 구별하기](../learn/special-methods.html#special-methods-scene-1) → 읽기: [길이와 포함 여부 제공하기](../learn/special-methods.html#special-methods-scene-2) → 읽기: [값 비교와 정렬 기준 정의하기](../learn/special-methods.html#special-methods-scene-3) → 읽기: [덧셈과 호출에 의미 부여하기](../learn/special-methods.html#special-methods-scene-4)

40. **관련된 작은 자료형을 안에 두기** (`nested-classes`)

   - 문제: 보고서에서만 쓰는 상태 자료형을 보고서와 함께 찾기 쉽게 묶고 싶습니다.
   - 목표: 중첩 클래스의 이름 경로와 바깥 인스턴스 연결의 한계를 설명합니다.
   - 선행 레슨: [데이터와 행동을 객체로 묶기](../learn/objects.html) · [객체의 행동에 이름 붙이기](../learn/methods.html)
   - 주제: 중첩 클래스 · 이름 공간 · 명시적 참조 · 구성
   - 구간: 읽기: [클래스 안에서 다른 클래스 정의하기](../learn/nested-classes.html#nested-classes-scene-1) → 읽기: [바깥 정보를 쓰려면 직접 전달하기](../learn/nested-classes.html#nested-classes-scene-2) → 읽기: [중첩과 구성을 구별하기](../learn/nested-classes.html#nested-classes-scene-3)

### 결과를 안전하게 남기기 (4레슨)

잘못된 입력을 처리하고 다음 실행에 쓸 결과를 저장할 수 있을까요?

41. **예외를 구별해 처리하기** (`exceptions`)

   - 문제: 숫자가 아닌 입력 하나 때문에 전체 기록 처리가 멈춥니다.
   - 목표: 예외 종류·처리 범위·정상 경로·정리 작업을 구별합니다.
   - 선행 레슨: [같아 보이는 값 구별하기](../learn/data-types.html) · [상황에 맞는 실행 경로 고르기](../learn/branching.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html)
   - 주제: 예외 · try · except · else · finally · raise · ValueError · TypeError
   - 구간: 시각화: [예상한 입력 오류에 응답하기](../learn/exceptions.html#exceptions-scene-1) → 읽기: [정상 경로와 정리 구별하기](../learn/exceptions.html#exceptions-scene-2) → 읽기: [함수의 입력 규칙 위반 알리기](../learn/exceptions.html#exceptions-scene-3)

42. **저장된 파일에서 기록 읽기** (`read-files`)

   - 문제: 매번 같은 기록을 다시 입력하지 않고 파일 내용을 읽고 싶습니다.
   - 목표: 경로·텍스트 인코딩·읽기 범위·자동 닫기를 설명합니다.
   - 선행 레슨: [모든 항목에 같은 작업 하기](../learn/for-range.html) · [모듈을 불러와 연결하기](../learn/modules.html)
   - 주제: 파일 · 경로 · 상대 경로 · 인코딩 · UTF-8 · with · open · read · readline · 이진
   - 구간: 읽기·글만: [출력 뒤에도 기록을 남기려면](../learn/read-files.html#read-files-reading-introduction) → 읽기: [파일 위치와 글자 해석 정하기](../learn/read-files.html#read-files-scene-1) → 시각화: [한 줄씩 읽고 자동으로 닫기](../learn/read-files.html#read-files-scene-2) → 읽기: [문자 수와 바이트 수 구별하기](../learn/read-files.html#read-files-scene-3)

43. **파일을 만들고 안전하게 정리하기** (`write-files`)

   - 문제: 계산 결과를 저장해야 하지만 기존 기록을 실수로 덮거나 지우고 싶지 않습니다.
   - 목표: 생성·덮어쓰기·추가 모드와 파일·빈 폴더 삭제의 차이를 설명합니다.
   - 선행 레슨: [저장된 파일에서 기록 읽기](../learn/read-files.html)
   - 주제: 파일 쓰기 · x 모드 · w 모드 · a 모드 · mkdir · unlink · rmdir · 임시 폴더
   - 구간: 읽기: [새 파일 생성과 끝에 추가](../learn/write-files.html#write-files-scene-1) → 읽기: [덮어쓰기의 영향을 확인하기](../learn/write-files.html#write-files-scene-2) → 읽기: [방금 만든 파일과 빈 폴더 삭제하기](../learn/write-files.html#write-files-scene-3)

44. **관찰 기록을 읽고 요약해 저장하기** (`final-project`)

   - 문제: 여러 관찰 줄에서 유효한 수량을 모으고 다음에 읽을 요약을 남기고 싶습니다.
   - 목표: 입력 검증·집계·JSON 저장을 각각 검증 가능한 단계로 연결합니다.
   - 선행 레슨: [입력한 글을 정리하기](../learn/text-tools.html) · [이름표로 값 찾기](../learn/dictionaries.html) · [건너뛸 때와 멈출 때 정하기](../learn/loop-control.html) · [계산에 이름을 붙여 재사용하기](../learn/functions.html) · [다른 도구에서도 읽을 수 있는 기록 만들기](../learn/json-data.html) · [예외를 구별해 처리하기](../learn/exceptions.html) · [파일을 만들고 안전하게 정리하기](../learn/write-files.html)
   - 주제: 종합 실습 · 입력 검증 · 집계 · JSON 저장 · 다시 읽기
   - 구간: 읽기·글만: [작은 규칙을 하나의 작업으로 연결하기](../learn/final-project.html#final-project-reading-introduction) → 읽기: [한 줄의 입력 계약 정하기](../learn/final-project.html#final-project-scene-1) → 읽기: [유효한 줄만 장소별로 더하기](../learn/final-project.html#final-project-scene-2) → 읽기: [저장한 파일을 다시 읽어 대조하기](../learn/final-project.html#final-project-scene-3) → 읽기·글만: [저장한 결과에서 다시 질문하기](../learn/final-project.html#final-project-reading-reflection)
