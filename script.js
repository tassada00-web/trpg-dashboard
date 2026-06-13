// [script.js] 최종 통합 버전
// 기능: 자동출력, 최신 10개 로그, 저장 목록, 메인 숨김, 로그 토글, 드래그 정렬, 순서 직접 입력

const WEBHOOK_STORAGE_KEY = "trpg_discord_webhook_url";

let lastRollData = null;
let dragId = null;
let mainDragId = null;
let placeholder = null;

const STAT_DEFS = [
    { key: "str", label: "힘", icon: "💪", inputId: "str", bonusInputId: "str-bonus" },
    { key: "hea", label: "건강", icon: "🛡️", inputId: "health", bonusInputId: "health-bonus" },
    { key: "spd", label: "속도", icon: "🏃", inputId: "speed", bonusInputId: "speed-bonus" },
    { key: "pre", label: "정밀", icon: "🎯", inputId: "precision", bonusInputId: "precision-bonus" },
    { key: "int", label: "지능", icon: "🧠", inputId: "intel", bonusInputId: "intel-bonus" },
    { key: "wis", label: "지혜", icon: "📖", inputId: "wis", bonusInputId: "wis-bonus" },
    { key: "cha", label: "매력", icon: "✨", inputId: "cha", bonusInputId: "cha-bonus" }
];

const SHEET_STAT_LABELS = STAT_DEFS.reduce((labels, stat) => {
    labels[stat.label] = stat.key;
    return labels;
}, {});

let savedCharacters = (JSON.parse(localStorage.getItem('trpg_characters')) || []).map(sanitizeCharacter);

window.onload = function () {
    saveData();
    restoreWebhookUrl();
    renderAll();
};

function sanitizeCharacter(char) {
    const id = char.id ?? Date.now();
    const sanitized = {
        id,
        name: char.name || "무명",
        bonus: {},
        pinned: Boolean(char.pinned),
        hidden: Boolean(char.hidden),
        order: char.order ?? id,
        mainOrder: char.mainOrder ?? id
    };

    STAT_DEFS.forEach(stat => {
        sanitized[stat.key] = Number(char[stat.key]) || 0;
        sanitized.bonus[stat.key] = Number(char.bonus?.[stat.key] ?? char[`${stat.key}Bonus`] ?? 0) || 0;
    });

    return sanitized;
}

function renderAll() {
    const mainList = document.getElementById('character-list');
    const pinnedList = document.getElementById('pinned-list');

    mainList.innerHTML = '';
    pinnedList.innerHTML = '';

    const sorted = [...savedCharacters].sort((a, b) => {
        return (a.mainOrder ?? -a.id) - (b.mainOrder ?? -b.id);
    });

    const visibleCards = sorted.filter(char => !char.hidden);

    visibleCards.forEach((char, index) => {
        renderCard(char, index + 1);
    });

    const pinnedChars = savedCharacters
        .filter(c => c.pinned)
        .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

    pinnedChars.forEach(char => {
        renderPinnedMiniCard(char);
    });
}

function rollDice(charName, statName, maxVal, bonusVal = 0) {
    const minVal = parseInt(document.getElementById('min-dice').value) || 1;
    const extraVal = parseInt(document.getElementById('extra-dice').value) || 0;
    const isAuto = document.getElementById('auto-output').checked;
    const display = document.getElementById('dice-display');
    const outputBtn = document.getElementById('output-btn');

    const finalMax = maxVal + extraVal;
    const bonus = Number(bonusVal) || 0;

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

    const total = result + bonus;

    lastRollData = { charName, statName, roll: result, bonus, result: total, maxVal: finalMax };

    display.innerText = formatRollDisplay(lastRollData);
    addLog(lastRollData);

    if (isAuto) {
        confirmSend();
    } else {
        outputBtn.style.display = "inline-block";
    }
}

function formatSignedNumber(value) {
    return value > 0 ? `+${value}` : String(value);
}

function formatRollDisplay(data) {
    if (data.bonus) {
        return `🎲 [${data.charName}] ${data.statName}: ${data.roll} ${formatSignedNumber(data.bonus)} = ${data.result} (1~${data.maxVal})`;
    }

    return `🎲 [${data.charName}] ${data.statName}: ${data.result} (1~${data.maxVal})`;
}

function addLog(data) {
    const container = document.getElementById('dice-log-container');
    const log = document.createElement('div');
    log.className = 'log-item';

    const now = new Date().toLocaleTimeString();
    const bonusDetail = data.bonus ? ` <small>(${data.roll} ${formatSignedNumber(data.bonus)})</small>` : "";

    log.innerHTML = `
        <span style="color:#888; font-size:10px;">${now}</span><br>
        <b>${data.charName}</b> - ${data.statName}:
        <span style="color:#fbbf24">${data.result}</span>${bonusDetail} / ${data.maxVal}
    `;

    container.prepend(log);

    if (container.children.length > 10) {
        container.removeChild(container.lastChild);
    }
}

function clearLog() {
    document.getElementById('dice-log-container').innerHTML = "";
}

function restoreWebhookUrl() {
    const input = document.getElementById('webhook-url');
    if (!input) return;

    input.value = localStorage.getItem(WEBHOOK_STORAGE_KEY) || "";
    input.addEventListener('change', () => saveWebhookUrl(input.value));
    input.addEventListener('blur', () => saveWebhookUrl(input.value));
}

function saveWebhookUrl(value) {
    const webhookUrl = value.trim();

    if (webhookUrl) {
        localStorage.setItem(WEBHOOK_STORAGE_KEY, webhookUrl);
    } else {
        localStorage.removeItem(WEBHOOK_STORAGE_KEY);
    }
}

function getWebhookUrl() {
    const input = document.getElementById('webhook-url');
    const webhookUrl = input.value.trim();
    saveWebhookUrl(webhookUrl);
    return webhookUrl;
}

function resetCharacterInputs() {
    document.getElementById('char-name').value = "";

    STAT_DEFS.forEach(stat => {
        document.getElementById(stat.inputId).value = "10";
        document.getElementById(stat.bonusInputId).value = "0";
    });
}

function saveCharacter() {
    const name = document.getElementById('char-name').value;
    if (!name) return alert("캐릭터 이름을 입력하세요!");

    const char = {
        id: Date.now(),
        name: name,
        bonus: {},
        pinned: false,
        hidden: false,
        order: Date.now(),
        mainOrder: Date.now()
    };

    STAT_DEFS.forEach(stat => {
        char[stat.key] = parseInt(document.getElementById(stat.inputId).value, 10) || 0;
        char.bonus[stat.key] = parseInt(document.getElementById(stat.bonusInputId).value, 10) || 0;
    });

    savedCharacters.push(char);
    saveData();
    renderAll();

    resetCharacterInputs();
}

function renderCard(s, orderNumber) {
    const list = document.getElementById('character-list');
    const card = document.createElement('div');

    card.className = 'char-card';
    card.id = `char-${s.id}`;

    card.draggable = true;
    card.dataset.id = s.id;

    card.addEventListener('dragstart', handleMainDragStart);
    card.addEventListener('dragover', handleMainDragOver);
    card.addEventListener('drop', handleMainDrop);
    card.addEventListener('dragend', handleMainDragEnd);

    const pinActive = s.pinned ? 'active' : '';

    card.innerHTML = `
        <div class="card-controls">
            <input 
                type="number" 
                class="card-order-input" 
                value="${orderNumber}" 
                min="1"
                onchange="changeMainOrder(${s.id}, this.value)"
                onclick="event.stopPropagation()"
                onmousedown="event.stopPropagation()"
                draggable="false"
            >
            <button class="pin-btn ${pinActive}" onclick="togglePin(${s.id})">📌</button>
            <button class="delete-btn" onclick="hideCharacter(${s.id})">×</button>
        </div>

        <h3>${s.name}</h3>

        <div class="char-stats-summary">
            ${STAT_DEFS.map(stat => statBtn(s.name, stat.label, s[stat.key], s.bonus?.[stat.key] ?? 0, stat.icon)).join('')}
        </div>
    `;

    list.appendChild(card);
}

function escapeHtmlAttr(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function jsStringArg(value) {
    return escapeHtmlAttr(JSON.stringify(String(value)));
}

function statBtn(cName, sName, val, bonus, icon) {
    const baseValue = Number(val) || 0;
    const bonusValue = Number(bonus) || 0;

    return `
        <span class="stat-btn" onclick="rollDice(${jsStringArg(cName)}, ${jsStringArg(sName)}, ${baseValue}, ${bonusValue})">
            <span class="stat-name">${icon} ${sName}</span>
            <span class="stat-values">
                <b>${baseValue}</b>
                <small>${formatSignedNumber(bonusValue)}</small>
            </span>
        </span>
    `;
}

function renderPinnedMiniCard(s) {
    const container = document.getElementById('pinned-list');
    const mini = document.createElement('div');

    mini.className = 'mini-card';
    mini.draggable = true;
    mini.dataset.id = s.id;

    mini.addEventListener('dragstart', handlePinnedDragStart);
    mini.addEventListener('dragover', handlePinnedDragOver);
    mini.addEventListener('drop', handlePinnedDrop);

    mini.innerHTML = `
        <div class="mini-card-header">
            <h4>📌 ${s.name}</h4>
            <button class="mini-unpin-btn" onclick="unpinCharacter(${s.id})">×</button>
        </div>

        <button onclick="showCharacter(${s.id})"
            style="font-size:10px; background:#333; color:white; border:none; cursor:pointer; padding:3px 7px; border-radius:3px;">
            불러오기
        </button>
    `;

    container.appendChild(mini);
}

function togglePin(id) {
    savedCharacters = savedCharacters.map(c => {
        if (c.id !== id) return c;

        return {
            ...c,
            pinned: !c.pinned,
            order: c.order ?? Date.now()
        };
    });

    saveData();
    renderAll();
}

function hideCharacter(id) {
    savedCharacters = savedCharacters.map(c =>
        c.id === id ? { ...c, hidden: true } : c
    );

    saveData();
    renderAll();
}

function unpinCharacter(id) {
    savedCharacters = savedCharacters.map(c =>
        c.id === id ? { ...c, pinned: false } : c
    );

    saveData();
    renderAll();
}

function showCharacter(id) {
    savedCharacters = savedCharacters.map(c =>
        c.id === id ? { ...c, hidden: false } : c
    );

    saveData();
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

    saveData();
    renderAll();
}

function confirmSend() {
    if (!lastRollData) return;

    const webhookUrl = getWebhookUrl();

    if (!webhookUrl) {
        alert("Webhook URL을 입력해 주세요.");
        return;
    }

    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `**[${lastRollData.charName}]** ${lastRollData.statName} 판정: **${lastRollData.result}** / ${lastRollData.maxVal}${lastRollData.bonus ? ` (${lastRollData.roll} ${formatSignedNumber(lastRollData.bonus)})` : ""}`,
            username: "GM Dashboard"
        })
    }).catch(() => {
        alert("디스코드 전송에 실패했습니다. Webhook URL을 다시 확인해 주세요.");
    });

    document.getElementById('output-btn').style.display = "none";
}

function normalizeSheetText(value) {
    return String(value ?? "").replace(/\s+/g, "").trim();
}

function readCell(sheet, row, col) {
    if (row < 0 || col < 0) return null;
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    return sheet[address]?.v ?? sheet[address]?.w ?? null;
}

function readNumberCell(sheet, row, col) {
    const rawValue = readCell(sheet, row, col);
    if (rawValue == null || rawValue === "") return null;

    const value = Number(rawValue);
    return Number.isFinite(value) ? Math.round(value) : null;
}

function findCharacterName(sheet, range) {
    for (let row = range.s.r; row <= range.e.r; row += 1) {
        for (let col = range.s.c; col <= range.e.c; col += 1) {
            if (normalizeSheetText(readCell(sheet, row, col)) === "이름") {
                const name = readCell(sheet, row, col + 1);
                if (name) return String(name).trim();
            }
        }
    }
    return "";
}

function findBaseColumnForTotal(sheet, range, headerRow, totalCol) {
    for (let col = totalCol - 1; col >= range.s.c; col -= 1) {
        if (normalizeSheetText(readCell(sheet, headerRow, col)) === "기본") {
            return col;
        }
    }

    return null;
}

function extractStatsFromWorkbook(workbook) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
    const stats = {};
    const totalColumns = [];

    for (let row = range.s.r; row <= range.e.r; row += 1) {
        for (let col = range.s.c; col <= range.e.c; col += 1) {
            if (normalizeSheetText(readCell(sheet, row, col)) === "합계") {
                totalColumns.push({ row, col });
            }
        }
    }

    totalColumns.forEach(({ row: headerRow, col: totalCol }) => {
        const baseCol = findBaseColumnForTotal(sheet, range, headerRow, totalCol);

        for (let row = range.s.r; row <= range.e.r; row += 1) {
            const label = normalizeSheetText(readCell(sheet, row, totalCol - 1));
            const key = SHEET_STAT_LABELS[label];
            const total = readNumberCell(sheet, row, totalCol);

            if (key && total !== null && stats[key] == null) {
                let base = total;
                let bonus = 0;

                if (baseCol !== null && SHEET_STAT_LABELS[normalizeSheetText(readCell(sheet, row, baseCol - 1))] === key) {
                    const baseValue = readNumberCell(sheet, row, baseCol);

                    if (baseValue !== null) {
                        base = baseValue;
                        bonus = total - base;
                    }
                }

                stats[key] = { base, bonus, total };
            }
        }
    });

    return {
        name: findCharacterName(sheet, range) || "무명",
        stats
    };
}

document.getElementById('excel-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const imported = extractStatsFromWorkbook(workbook);

        const char = {
            id: Date.now(),
            name: imported.name,
            bonus: {},
            pinned: false,
            hidden: false,
            order: Date.now(),
            mainOrder: Date.now()
        };

        STAT_DEFS.forEach(stat => {
            const importedStat = imported.stats[stat.key];
            char[stat.key] = importedStat?.base ?? 0;
            char.bonus[stat.key] = importedStat?.bonus ?? 0;
        });

        savedCharacters.push(char);
        saveData();
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

/* PINNED 드래그 */
function handlePinnedDragStart(e) {
    dragId = Number(e.currentTarget.dataset.id);
}

function handlePinnedDragOver(e) {
    e.preventDefault();
}

function handlePinnedDrop(e) {
    e.preventDefault();

    const dropId = Number(e.currentTarget.dataset.id);

    if (!dragId || dragId === dropId) return;

    let pinned = savedCharacters
        .filter(c => c.pinned)
        .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

    const dragIndex = pinned.findIndex(c => c.id === dragId);
    const dropIndex = pinned.findIndex(c => c.id === dropId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const [moved] = pinned.splice(dragIndex, 1);
    pinned.splice(dropIndex, 0, moved);

    pinned.forEach((c, i) => {
        c.order = i;
    });

    saveData();
    renderAll();
}

/* 메인 카드 드래그 + 예상 위치 */
function createPlaceholder() {
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        placeholder.innerHTML = '여기에 배치';

        placeholder.addEventListener('dragover', function (e) {
            e.preventDefault();
            autoScrollDuringDrag(e);
        });

        placeholder.addEventListener('drop', handleMainDropOnPlaceholder);
    }

    return placeholder;
}

function handleMainDragStart(e) {
    mainDragId = Number(e.currentTarget.dataset.id);
    e.currentTarget.classList.add('dragging-card');

    document.addEventListener('dragover', autoScrollDuringDrag);
}

function handleMainDragOver(e) {
    e.preventDefault();
    autoScrollDuringDrag(e);

    const list = document.getElementById('character-list');
    const targetCard = e.currentTarget;

    if (!targetCard || Number(targetCard.dataset.id) === mainDragId) return;

    const box = targetCard.getBoundingClientRect();
    const offset = e.clientY - box.top;
    const place = createPlaceholder();

    if (offset < box.height / 2) {
        list.insertBefore(place, targetCard);
    } else {
        list.insertBefore(place, targetCard.nextSibling);
    }
}

function handleMainDrop(e) {
    e.preventDefault();

    const list = document.getElementById('character-list');
    const dropIndex = [...list.children].indexOf(placeholder);

    applyMainReorder(dropIndex);
}

function handleMainDropOnPlaceholder(e) {
    e.preventDefault();

    const list = document.getElementById('character-list');
    const dropIndex = [...list.children].indexOf(placeholder);

    applyMainReorder(dropIndex);
}

function applyMainReorder(targetIndex) {
    let visibleCards = savedCharacters
        .filter(c => !c.hidden)
        .sort((a, b) => (a.mainOrder ?? -a.id) - (b.mainOrder ?? -b.id));

    const dragIndex = visibleCards.findIndex(c => c.id === mainDragId);
    if (dragIndex === -1) return;

    if (targetIndex < 0) targetIndex = visibleCards.length - 1;
    if (targetIndex > visibleCards.length) targetIndex = visibleCards.length;

    const [moved] = visibleCards.splice(dragIndex, 1);

    if (targetIndex > dragIndex) {
        targetIndex--;
    }

    visibleCards.splice(targetIndex, 0, moved);

    visibleCards.forEach((c, i) => {
        c.mainOrder = i;
    });

    saveData();
    renderAll();
}

function handleMainDragEnd(e) {
    e.currentTarget.classList.remove('dragging-card');

    document.removeEventListener('dragover', autoScrollDuringDrag);

    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }

    placeholder = null;
    mainDragId = null;
}

function autoScrollDuringDrag(e) {
    const area = document.querySelector('.content-area');
    if (!area) return;

    const rect = area.getBoundingClientRect();
    const threshold = 90;
    const speed = 18;

    if (e.clientY < rect.top + threshold) {
        area.scrollBy(0, -speed);
    }

    if (e.clientY > rect.bottom - threshold) {
        area.scrollBy(0, speed);
    }
}

/* 숫자 입력 순서 변경 */
function changeMainOrder(id, value) {
    let targetIndex = parseInt(value, 10);

    let visibleCards = savedCharacters
        .filter(c => !c.hidden)
        .sort((a, b) => (a.mainOrder ?? -a.id) - (b.mainOrder ?? -b.id));

    const currentIndex = visibleCards.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    if (isNaN(targetIndex) || targetIndex < 1) targetIndex = 1;
    if (targetIndex > visibleCards.length) targetIndex = visibleCards.length;

    const [moved] = visibleCards.splice(currentIndex, 1);
    visibleCards.splice(targetIndex - 1, 0, moved);

    visibleCards.forEach((c, i) => {
        c.mainOrder = i;
    });

    saveData();
    renderAll();
}

function saveData() {
    savedCharacters = savedCharacters.map(sanitizeCharacter);
    localStorage.setItem('trpg_characters', JSON.stringify(savedCharacters));
}
