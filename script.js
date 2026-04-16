// [script.js] 전체 교체

// 주사위 굴리기 로직 (2~3단계)
function rollDice(statName, maxVal) {
    const minVal = parseInt(document.getElementById('min-dice').value) || 1;
    const display = document.getElementById('dice-display');

    if (maxVal < 1) {
        display.innerText = "⚠️ 능력치가 1 미만이면 굴릴 수 없습니다!";
        return;
    }

    let result;
    // 최소값 보정 로직
    if (minVal >= maxVal) {
        result = maxVal;
    } else {
        do {
            result = Math.floor(Math.random() * maxVal) + 1;
        } while (result < minVal);
    }

    display.innerText = `🎲 ${statName} 판정: [ ${result} ] (범위: 1~${maxVal})`;
}

// 캐릭터 저장 및 카드 생성 (1단계 확장)
function saveCharacter() {
    const name = document.getElementById('char-name').value;
    if (!name) return alert("캐릭터 이름을 입력하세요!");

    // 9가지 능력치 모두 수집
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

    const list = document.getElementById('character-list');
    const card = document.createElement('div');
    card.className = 'char-card';
    
    // 카드 안에 모든 능력치를 클릭 가능한 버튼(stat-btn)으로 만듭니다.
    card.innerHTML = `
        <h3>${s.name}</h3>
        <div class="char-stats-summary">
            <span class="stat-btn" onclick="rollDice('체력', ${s.hp})">❤️ ${s.hp}</span>
            <span class="stat-btn" onclick="rollDice('스테미나', ${s.sta})">⚡ ${s.sta}</span>
            <span class="stat-btn" onclick="rollDice('힘', ${s.str})">💪 ${s.str}</span>
            <span class="stat-btn" onclick="rollDice('건강', ${s.hea})">🛡️ ${s.hea}</span>
            <span class="stat-btn" onclick="rollDice('속도', ${s.spd})">🏃 ${s.spd}</span>
            <span class="stat-btn" onclick="rollDice('정밀', ${s.pre})">🎯 ${s.pre}</span>
            <span class="stat-btn" onclick="rollDice('지능', ${s.int})">🧠 ${s.int}</span>
            <span class="stat-btn" onclick="rollDice('지혜', ${s.wis})">📖 ${s.wis}</span>
            <span class="stat-btn" onclick="rollDice('매력', ${s.cha})">✨ ${s.cha}</span>
        </div>
    `;

    list.prepend(card);
    
    // 입력칸 초기화 (선택사항)
    document.getElementById('char-name').value = "";
}