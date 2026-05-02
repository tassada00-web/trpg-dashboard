// [script.js] 최종 통합 버전
// 기능: 자동출력 옵션, 최신 10개 로그, 캐릭터 고정(좌측), 로컬 저장소(영구저장), 능력치 이름 표시

const DEFAULT_WEBHOOK_URL = "https://discord.com/api/webhooks/1494322378564698152/Ywbob5pJ0zuOg199qDBayCLru8ZZDGlDM3dw2tvB56LW9Vkkja3X6HhdLz_E6yO4WYHs";
let lastRollData = null; 
let savedCharacters = JSON.parse(localStorage.getItem('trpg_characters')) || [];

// 1. 페이지 로드 시 실행
window.onload = function() {
    renderAll();
};

// 2. 화면 전체 렌더링 (메인 리스트 + 고정 리스트)
function renderAll() {
    const mainList = document.getElementById('character-list');
    const pinnedList = document.getElementById('pinned-list');
    
    mainList.innerHTML = '';
    pinnedList.innerHTML = '';

    const sorted = [...savedCharacters].sort((a, b) => b.id - a.id);

    sorted.forEach(char => {
        if (!char.hidden) renderCard(char);
        if (char.pinned) renderPinnedMiniCard(char);
    });
}

// 3. 주사위 굴리기 (최소보정, 외부추가값, 자동출력, 로그 10개 제한 적용)
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

    lastRollData = { charName, statName, result, maxVal: finalMax };

    // 화면 표시 및 사이드바 로그 기록
    display.innerText = `🎲 [${charName}] ${statName}: ${result} (1~${finalMax})`;
    addLog(charName, statName, result, finalMax);

    // 옵션 1: 자동 출력 확인
    if (isAuto) {
        confirmSend();
    } else {
        outputBtn.style.display = "inline-block";
    }
}

// 4. 주사위 로그 추가 (최대 10개 제한)
function addLog(name, stat, res, max) {
    const container = document.getElementById('dice-log-container');
    const log = document.createElement('div');
    log.className = 'log-item';
    const now = new Date().toLocaleTimeString();
    log.innerHTML = `<span style="color:#888; font-size:10px;">${now}</span><br><b>${name}</b> - ${stat}: <span style="color:#fbbf24">${res}</span> / ${max}`;
    
    container.prepend(log);

    // [옵션 2 반영] 로그가 10개를 넘으면 가장 오래된 것 삭제
    if (container.children.length > 10) {
        container.removeChild(container.lastChild);
    }
}

function clearLog() { document.getElementById('dice-log-container').innerHTML = ""; }

// 5. 캐릭터 저장 (로컬 저장소 연동)
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
        def: parseInt(document.getElementById('def').value) || 0,
        pinned: false,
        hidden: false
    };

    savedCharacters.push(char);
    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
    renderAll();
    
    // 입력창 초기화
    document.getElementById('char-name').value = "";
    document.querySelectorAll('.stats-grid input').forEach(input => input.value = "");
}

// 6. 메인 캐릭터 카드 그리기 (능력치 이름 표시 보강)
function renderCard(s) {
    const list = document.getElementById('character-list');
    const card = document.createElement('div');
    card.className = 'char-card';
    card.id = `char-${s.id}`;
    const pinActive = s.pinned ? 'active' : '';

    card.innerHTML = `
        <div class="card-controls">
            <button class="pin-btn ${pinActive}" onclick="togglePin(${s.id})">📌</button>
            <button class="delete-btn" onclick="hideCharacter(${s.id})">×</button>
        </div>
        <h3>${s.name}</h3>
        <div class="char-stats-summary">
            ${statBtn(s.name, '체력', s.hp, '❤️')}
            ${statBtn(s.name, '스테', s.sta, '⚡')}
            ${statBtn(s.name, '힘', s.str, '💪')}
            ${statBtn(s.name, '건강', s.hea, '🛡️')}
            ${statBtn(s.name, '속도', s.spd, '🏃')}
            ${statBtn(s.name, '정밀', s.pre, '🎯')}
            ${statBtn(s.name, '지능', s.int, '🧠')}
            ${statBtn(s.name, '지혜', s.wis, '📖')}
            ${statBtn(s.name, '매력', s.cha, '✨')}
            ${statBtn(s.name, '데미지', s.dmg, '⚔️')}
            ${statBtn(s.name, '보조뎀', s.dmgSub, '🗡️')}
            ${statBtn(s.name, '방어력', s.def, '🛡️')}
        </div>
    `;
    list.appendChild(card);
}

// 능력치 버튼 생성 보조 함수 (이름 명시)
function statBtn(cName, sName, val, icon) {
    return `<span class="stat-btn" onclick="rollDice('${cName}', '${sName}', ${val})">
                <span class="stat-name">${icon} ${sName}</span> <b>${val}</b>
            </span>`;
}

// 7. 왼쪽 사이드바 고정 미니 카드
function renderPinnedMiniCard(s) {
    const container = document.getElementById('pinned-list');
    const mini = document.createElement('div');
    mini.className = 'mini-card';

    mini.innerHTML = `
        <div class="mini-card-header">
            <h4>📌 ${s.name}</h4>
            <button class="mini-unpin-btn" onclick="unpinCharacter(${s.id})">×</button>
        </div>

        <button onclick="showCharacter(${s.id})" 
                style="font-size:10px; background:#333; color:white; border:none; cursor:pointer; padding:3px 7px; border-radius:3px;">
            이동하기
        </button>
    `;

    container.appendChild(mini);
}

// 8. 캐릭터 고정/삭제 기능
function togglePin(id) {
    savedCharacters = savedCharacters.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c);
    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
    renderAll();
}



function hideCharacter(id) {
    savedCharacters = savedCharacters.map(c => 
        c.id === id ? { ...c, hidden: true } : c
    );
    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
    renderAll();
}

function unpinCharacter(id) {
    savedCharacters = savedCharacters.map(c => 
        c.id === id ? { ...c, pinned: false } : c
    );
    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
    renderAll();
}

// 9. 디스코드 전송
function confirmSend() {
    if (!lastRollData) return;
    const inputUrl = document.getElementById('webhook-url').value;
    const webhookUrl = inputUrl || DEFAULT_WEBHOOK_URL;
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `**[${lastRollData.charName}]** ${lastRollData.statName} 판정: **${lastRollData.result}** / ${lastRollData.maxVal}`,
            username: "GM Dashboard"
        })
    });
    document.getElementById('output-btn').style.display = "none";
}

// 10. 엑셀 로드
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
            def: getV('U15', getV('R15', 0)),
            pinned: false,
            hidden: false
        };

        savedCharacters.push(char);
        localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
        renderAll();
        alert(`[${char.name}] 캐릭터 시트를 성공적으로 불러와 저장했습니다.`);
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
});
function toggleLogPanel() {
    const panel = document.getElementById('right-sidebar');
    panel.classList.toggle('closed');

    const btn = panel.querySelector('.log-toggle-btn');
    btn.textContent = panel.classList.contains('closed') ? '▶' : '◀';
}

function showCharacter(id) {
    savedCharacters = savedCharacters.map(c => 
        c.id === id ? { ...c, hidden: false } : c
    );
    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
    renderAll();

    setTimeout(() => {
        document.getElementById(`char-${id}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
}

function hideAllCharacters() {
    if (!confirm("메인 캐릭터를 전부 숨기겠습니까?")) return;

    savedCharacters = savedCharacters.map(c => ({
        ...c,
        hidden: true
    }));

    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
    renderAll();
}