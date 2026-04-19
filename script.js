// [script.js] 모든 기능 통합 버전 (자동출력, 다이스로그, 로컬저장소, 12종능력치)

const DEFAULT_WEBHOOK_URL = "https://discord.com/api/webhooks/1494322378564698152/Ywbob5pJ0zuOg199qDBayCLru8ZZDGlDM3dw2tvB56LW9Vkkja3X6HhdLz_E6yO4WYHs";
let lastRollData = null; // 마지막 주사위 결과 임시 저장
let savedCharacters = JSON.parse(localStorage.getItem('trpg_characters')) || [];

// 1. 페이지 로드 시 저장된 캐릭터들 불러오기
window.onload = function() {
    savedCharacters.forEach(char => renderCard(char));
};

// 2. 주사위 굴리기 (최소보정, 외부추가값, 자동출력 반영)
function rollDice(charName, statName, maxVal) {
    const minVal = parseInt(document.getElementById('min-dice').value) || 1;
    const extraVal = parseInt(document.getElementById('extra-dice').value) || 0;
    const isAuto = document.getElementById('auto-output').checked; 
    const display = document.getElementById('dice-display');
    const outputBtn = document.getElementById('output-btn');

    // 최종 최대치 = 능력치 + 외부 추가값
    const finalMax = maxVal + extraVal;

    if (finalMax < 1) {
        display.innerText = "⚠️ 최대치가 1 미만입니다!";
        outputBtn.style.display = "none";
        return;
    }

    let result;
    if (minVal >= finalMax) {
        result = finalMax;
    } else {
        do {
            result = Math.floor(Math.random() * finalMax) + 1;
        } while (result < minVal);
    }

    // 데이터 저장
    lastRollData = { charName, statName, result, maxVal: finalMax };

    // 화면 표시 및 사이드바 로그 기록
    display.innerText = `🎲 [${charName}] ${statName}: ${result} (1~${finalMax})`;
    addLog(charName, statName, result, finalMax);

    // 자동 출력 옵션 확인
    if (isAuto) {
        confirmSend();
    } else {
        outputBtn.style.display = "inline-block";
    }
}

// 3. 사이드바 주사위 로그 추가
function addLog(name, stat, res, max) {
    const container = document.getElementById('dice-log-container');
    const log = document.createElement('div');
    log.className = 'log-item';
    const now = new Date().toLocaleTimeString();
    log.innerHTML = `<span style="color:#888; font-size:10px;">${now}</span><br><b>${name}</b> - ${stat}: <span style="color:#fbbf24">${res}</span> / ${max}`;
    container.prepend(log);
}

function clearLog() { document.getElementById('dice-log-container').innerHTML = ""; }

// 4. 캐릭터 저장 (입력창 데이터를 LocalStorage에 영구 저장)
function saveCharacter() {
    const name = document.getElementById('char-name').value;
    if (!name) return alert("캐릭터 이름을 입력하세요!");

    const char = {
        id: Date.now(),
        name: name,
        hp: parseInt(document.getElementById('hp').value) || 0,
        sta: parseInt(document.getElementById('stamina').value) || 0,
        str: parseInt(document.getElementById('str').value) || 0,
        hea: parseInt(document.getElementById('health').value) || 0,
        spd: parseInt(document.getElementById('speed').value) || 0,
        pre: parseInt(document.getElementById('precision').value) || 0,
        int: parseInt(document.getElementById('intel').value) || 0,
        wis: parseInt(document.getElementById('wis').value) || 0,
        cha: parseInt(document.getElementById('cha').value) || 0,
        dmg: parseInt(document.getElementById('dmg').value) || 0,
        dmgSub: parseInt(document.getElementById('dmg-sub').value) || 0,
        def: parseInt(document.getElementById('def').value) || 0
    };

    savedCharacters.push(char);
    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
    renderCard(char);
    
    // 입력창 초기화
    document.getElementById('char-name').value = "";
    const inputs = document.querySelectorAll('.stats-grid input');
    inputs.forEach(input => input.value = "");
}

// 5. 캐릭터 카드 화면에 그리기 (삭제 버튼 포함)
function renderCard(s) {
    const list = document.getElementById('character-list');
    const card = document.createElement('div');
    card.className = 'char-card';
    card.id = `char-${s.id}`;
    
    card.innerHTML = `
        <button class="delete-btn" onclick="deleteCharacter(${s.id})">×</button>
        <h3>${s.name}</h3>
        <div class="char-stats-summary">
            <span class="stat-btn" onclick="rollDice('${s.name}', '체력', ${s.hp})">❤️ ${s.hp}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '스테', ${s.sta})">⚡ ${s.sta}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '힘', ${s.str})">💪 ${s.str}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '건강', ${s.hea})">🛡️ ${s.hea}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '속도', ${s.spd})">🏃 ${s.spd}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '정밀', ${s.pre})">🎯 ${s.pre}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '지능', ${s.int})">🧠 ${s.int}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '지혜', ${s.wis})">📖 ${s.wis}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '매력', ${s.cha})">✨ ${s.cha}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '데미지', ${s.dmg})">⚔️ ${s.dmg}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '보조뎀', ${s.dmgSub})">🗡️ ${s.dmgSub}</span>
            <span class="stat-btn" onclick="rollDice('${s.name}', '방어력', ${s.def})">🛡️ ${s.def}</span>
        </div>
    `;
    list.prepend(card);
}

// 6. 캐릭터 삭제
function deleteCharacter(id) {
    if(!confirm("이 캐릭터를 삭제하시겠습니까?")) return;
    savedCharacters = savedCharacters.filter(c => c.id !== id);
    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
    document.getElementById(`char-${id}`).remove();
}

// 7. 디스코드 전송 확인 및 실행
function confirmSend() {
    if (!lastRollData) return;
    sendToDiscord(lastRollData.charName, lastRollData.statName, lastRollData.result, lastRollData.maxVal);
    document.getElementById('output-btn').style.display = "none";
}

function sendToDiscord(charName, statName, result, maxVal) {
    const inputUrl = document.getElementById('webhook-url').value;
    const webhookUrl = inputUrl || DEFAULT_WEBHOOK_URL;
    if (!webhookUrl) return;

    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `**[${charName}]** ${statName} 판정: **${result}** / ${maxVal}`,
            username: "GM Dashboard"
        })
    });
}

// 8. 엑셀 로드 (좌표 정밀 타격 + 자동 저장 연동)
document.getElementById('excel-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const getV = (addr, def = 0) => {
            const cell = sheet[addr];
            return cell ? (cell.v || def) : def;
        };

        const char = {
            id: Date.now(),
            name: getV('C2', getV('C4', "무명")),
            hp: getV('U4', getV('R4', 0)),
            sta: getV('U5', getV('R5', 0)),
            str: getV('U6', getV('R6', 0)),
            hea: getV('U7', getV('R7', 0)),
            spd: getV('U8', getV('R8', 0)),
            pre: getV('U9', getV('R9', 0)),
            int: getV('U10', getV('R10', 0)),
            wis: getV('U11', getV('R11', 0)),
            cha: getV('U12', getV('R12', 0)),
            dmg: getV('U13', getV('R13', 0)),
            dmgSub: getV('U14', getV('R14', 0)),
            def: getV('U15', getV('R15', 0))
        };

        savedCharacters.push(char);
        localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
        renderCard(char);
        alert(`[${char.name}] 캐릭터를 저장하고 불러왔습니다.`);
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
});