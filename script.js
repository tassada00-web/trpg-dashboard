// [script.js] 최종 통합 및 디스코드 연동 버전

// 고정 웹후크 주소
const DEFAULT_WEBHOOK_URL = "https://discord.com/api/webhooks/1494322378564698152/Ywbob5pJ0zuOg199qDBayCLru8ZZDGlDM3dw2tvB56LW9Vkkja3X6HhdLz_E6yO4WYHs";

// 1. 주사위 굴리기 및 디스코드 전송 (캐릭터 이름 추가)
function rollDice(charName, statName, maxVal) {
    const minVal = parseInt(document.getElementById('min-dice').value) || 1;
    const display = document.getElementById('dice-display');

    if (maxVal < 1) {
        display.innerText = "⚠️ 능력치 부족!";
        return;
    }

    let result;
    if (minVal >= maxVal) { 
        result = maxVal; 
    } else {
        do { 
            result = Math.floor(Math.random() * maxVal) + 1; 
        } while (result < minVal);
    }

    const resultText = `🎲 ${statName} 판정: [ ${result} ] (1~${maxVal})`;
    display.innerText = resultText;

    // 디스코드로 전송
    sendToDiscord(charName, statName, result, maxVal);
}

// 2. 디스코드 전송 함수
function sendToDiscord(charName, statName, result, maxVal) {
    // 화면에 주소 입력칸이 있다면 그 값을 우선시하고, 비어있으면 고정 주소 사용
    const inputUrl = document.getElementById('webhook-url')?.value;
    const webhookUrl = inputUrl || DEFAULT_WEBHOOK_URL;
    
    if (!webhookUrl || webhookUrl === "") return;

    const payload = {
        content: `**[${charName}]** 캐릭터의 판정 결과\n> 📊 **항목**: ${statName}\n> 🎲 **결과**: **${result}** / ${maxVal}`,
        username: "GM Dashboard"
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(() => console.log("디스코드 전송 성공"))
    .catch(err => console.error("전송 실패:", err));
}

// 3. 개별 캐릭터 저장 기능
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
    document.getElementById('char-name').value = "";
}

// 4. 엑셀 파일 읽기 로직 (특정 좌표 방식)
document.getElementById('excel-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const getV = (addr, def = 0) => {
            const cell = sheet[addr];
            return cell ? (cell.v || def) : def;
        };

        const charData = {
            name: getV('C2', getV('C4', "무명")),
            hp:   getV('U4', getV('R4', 0)),
            sta:  getV('U5', getV('R5', 0)),
            str:  getV('U6', getV('R6', 0)),
            hea:  getV('U7', getV('R7', 0)),
            spd:  getV('U8', getV('R8', 0)),
            pre:  getV('U9', getV('R9', 0)),
            int:  getV('U10', getV('R10', 0)),
            wis:  getV('U11', getV('R11', 0)),
            cha:  getV('U12', getV('R12', 0)),
            dmg:  getV('U13', getV('R13', 0)),     // 추가
            dmgSub: getV('U14', getV('R14', 0)),  // 추가
            def:  getV('U15', getV('R15', 0))
        };

        addCharacterCard(charData);
        alert(`[${charData.name}] 시트 로드 및 디스코드 연결 완료!`);
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
});

// 5. 캐릭터 카드 생성 공통 함수
function addCharacterCard(s) {
    const list = document.getElementById('character-list');
    const card = document.createElement('div');
    card.className = 'char-card';
    
    // rollDice에 캐릭터 이름을 인자로 전달하도록 수정
    card.innerHTML = `
        <h3>${s.name}</h3>
        <div class="char-stats-summary">
            <span class="stat-btn" onclick="rollDice('${s.name}', '체력', ${s.hp})">❤️ 체력: ${s.hp}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '스테미나', ${s.sta})">⚡ 스테: ${s.sta}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '힘', ${s.str})">💪 힘: ${s.str}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '건강', ${s.hea})">🛡️ 건강: ${s.hea}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '속도', ${s.spd})">🏃 속도: ${s.spd}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '정밀', ${s.pre})">🎯 정밀: ${s.pre}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '지능', ${s.int})">🧠 지능: ${s.int}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '지혜', ${s.wis})">📖 지혜: ${s.wis}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '매력', ${s.cha})">✨ 매력: ${s.cha}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '데미지', ${s.dmg})">⚔️ 데미지: ${s.dmg}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '보조 데미지', ${s.dmgSub})">🛡️ 보조 데미지: ${s.dmgSub}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '방어력', ${s.def})">🛡️ 방어력: ${s.def}</span>

        </div>
    `;

    list.prepend(card);
}