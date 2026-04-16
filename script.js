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
        const rows = XLSX.utils.sheet_to_json(sheet);

        rows.forEach(row => {
            addCharacterCard({
                name: row['이름'] || "무명",
                hp: row['체력'] || 0,
                sta: row['스테미나'] || 0,
                str: row['힘'] || 0,
                hea: row['건강'] || 0,
                spd: row['속도'] || 0,
                pre: row['정밀'] || 0,
                int: row['지능'] || 0,
                wis: row['지혜'] || 0,
                cha: row['매력'] || 0
            });
        });
        alert(`${rows.length}명의 캐릭터를 불러왔습니다!`);
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