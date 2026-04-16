// [script.js] 최종 통합 버전

// 1. 주사위 굴리기 핵심 로직 (2~3단계)
function rollDice(statName, maxVal) {
    const minVal = parseInt(document.getElementById('min-dice').value) || 1;
    const display = document.getElementById('dice-display');

    if (maxVal < 1) {
        display.innerText = "⚠️ 능력치가 1 미만이면 굴릴 수 없습니다!";
        return;
    }

    let result;
    // 최소값 보정 로직: 최소값이 최대값보다 크면 최대값으로 고정
    if (minVal >= maxVal) {
        result = maxVal;
    } else {
        // 최소값이 나올 때까지 무한 반복 (3단계 기능)
        do {
            result = Math.floor(Math.random() * maxVal) + 1;
        } while (result < minVal);
    }

    display.innerText = `🎲 ${statName} 판정: [ ${result} ] (범위: 1~${maxVal})`;
}

// 2. 개별 캐릭터 저장 기능 (1단계)
function saveCharacter() {
    const name = document.getElementById('char-name').value;
    if (!name) return alert("캐릭터 이름을 입력하세요!");

    const s = {
        name: name,
        hp: document.getElementById('hp').value || 0,
        sta: document.getElementById('stamina').value || 0,
        str: document.getElementById('str').value || 0,
        hea: document.getElementById('health').value || 0,
        spd: document.getElementById('speed').value || 0,
        pre: document.getElementById('precision').value || 0,
        int: document.getElementById('intel').value || 0,
        wis: document.getElementById('wis').value || 0,
        cha: document.getElementById('cha').value || 0
    };

    addCharacterCard(s);
    document.getElementById('char-name').value = ""; // 이름 칸 비우기
}

// 3. 엑셀 파일 읽기 로직 (4단계)
document.getElementById('excel-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheetName = workbook.SheetNames[0]; 
        const sheet = workbook.Sheets[sheetName];

        // 셀 값을 안전하게 가져오는 보조 함수
        const getV = (addr, def = 0) => {
            const cell = sheet[addr];
            return cell ? (cell.v || def) : def;
        };

        // 사용자 엑셀 구조 분석 결과:
        // 이름은 C2 또는 C4에 있을 확률이 높습니다. 
        // 결과값은 R열이 아닌 U열(최종 결과)일 가능성이 큽니다.
        
        const name = getV('C2', getV('C4', "무명")); // C2 확인 후 없으면 C4 확인

        const charData = {
            name: name,
            hp:   getV('U4', getV('R4', 0)), // U4 확인 후 없으면 R4 확인
            sta:  getV('U5', getV('R5', 0)),
            str:  getV('U6', getV('R6', 0)),
            hea:  getV('U7', getV('R7', 0)),
            spd:  getV('U8', getV('R8', 0)),
            pre:  getV('U9', getV('R9', 0)),
            int:  getV('U10', getV('R10', 0)),
            wis:  getV('U11', getV('R11', 0)),
            cha:  getV('U12', getV('R12', 0))
        };

        // 기존의 sheet_to_json 루프를 버리고 딱 한 장의 카드만 생성합니다.
        addCharacterCard(charData);
        
        alert(`[${charData.name}] 캐릭터 시트를 성공적으로 불러왔습니다!`);
        e.target.value = ''; // 같은 파일 다시 올릴 수 있게 초기화
    };
    reader.readAsArrayBuffer(file);
});

// 4. 캐릭터 카드 생성 공통 함수
function addCharacterCard(s) {
    const list = document.getElementById('character-list');
    const card = document.createElement('div');
    card.className = 'char-card';
    
    card.innerHTML = `
        <h3>${s.name}</h3>
        <div class="char-stats-summary">
            <span class="stat-btn" onclick="rollDice('체력', ${s.hp})">❤️ 체력: ${s.hp}</span>
            <span class="stat-btn" onclick="rollDice('스테미나', ${s.sta})">⚡ 스테: ${s.sta}</span>
            <span class="stat-btn" onclick="rollDice('힘', ${s.str})">💪 힘: ${s.str}</span>
            <span class="stat-btn" onclick="rollDice('건강', ${s.hea})">🛡️ 건강: ${s.hea}</span>
            <span class="stat-btn" onclick="rollDice('속도', ${s.spd})">🏃 속도: ${s.spd}</span>
            <span class="stat-btn" onclick="rollDice('정밀', ${s.pre})">🎯 정밀: ${s.pre}</span>
            <span class="stat-btn" onclick="rollDice('지능', ${s.int})">🧠 지능: ${s.int}</span>
            <span class="stat-btn" onclick="rollDice('지혜', ${s.wis})">📖 지혜: ${s.wis}</span>
            <span class="stat-btn" onclick="rollDice('매력', ${s.cha})">✨ 매력: ${s.cha}</span>
        </div>
    `;

    list.prepend(card);
}