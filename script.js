function saveCharacter() {
    const name = document.getElementById('char-name').value;
    if (!name) { alert("이름을 입력해주세요!"); return; }

    const stats = {
        hp: document.getElementById('hp').value || 0,
        str: document.getElementById('str').value || 0,
        spd: document.getElementById('speed').value || 0
    };

    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `
        <h3>${name}</h3>
        <p>🔴 체력: ${stats.hp} | 💪 힘: ${stats.str} | ⚡ 속도: ${stats.spd}</p>
    `;
    
    document.getElementById('character-list').prepend(card);
    alert(name + " 캐릭터가 기록되었습니다!");
}