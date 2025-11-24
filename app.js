const raceNameInput = document.getElementById('raceName');
const horseNameInput = document.getElementById('horseName');
const investInput = document.getElementById('investAmount');
const returnInput = document.getElementById('returnAmount');
const saveBtn = document.getElementById('saveBtn');
const recordList = document.getElementById('recordList');
const totalBalanceEl = document.getElementById('totalBalance');
const totalRecoveryEl = document.getElementById('totalRecovery');
const clearBtn = document.getElementById('clearBtn');

document.addEventListener('DOMContentLoaded', loadRecords);

saveBtn.addEventListener('click', () => {
    const race = raceNameInput.value;
    const horse = horseNameInput.value;
    // 数値に変換 (空なら0)
    const invest = Number(investInput.value) || 0;
    const ret = Number(returnInput.value) || 0;

    if (!race && !invest) {
        alert('せめてレース名か金額は入力してください！');
        return;
    }

    const record = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        race: race,
        horse: horse,
        invest: invest,
        ret: ret,
        balance: ret - invest, // 収支
        recovery: invest === 0 ? 0 : Math.round((ret / invest) * 100) // 回収率
    };

    saveRecord(record);
    addRecordToDOM(record);
    updateSummary();
    
    // 入力リセット
    raceNameInput.value = '';
    horseNameInput.value = '';
    investInput.value = '';
    returnInput.value = '';
});

clearBtn.addEventListener('click', () => {
    if(confirm('本当に全てのデータを消しますか？')) {
        localStorage.removeItem('keiba-records');
        location.reload();
    }
});

function saveRecord(record) {
    let records = getRecords();
    records.unshift(record);
    localStorage.setItem('keiba-records', JSON.stringify(records));
}

function getRecords() {
    return JSON.parse(localStorage.getItem('keiba-records') || '[]');
}

function loadRecords() {
    const records = getRecords();
    records.forEach(addRecordToDOM);
    updateSummary();
}

function addRecordToDOM(record) {
    const div = document.createElement('div');
    const isWin = record.balance >= 0;
    div.classList.add('record-card', isWin ? 'win' : 'lose');

    div.innerHTML = `
        <div class="card-header">
            <span>${record.race}</span>
            <span style="font-size:0.8em; font-weight:normal;">${record.date}</span>
        </div>
        <div class="card-details">
            ${record.horse ? '📝 ' + record.horse : ''}
        </div>
        <div class="card-result">
            <span>投: ${record.invest.toLocaleString()}円 → 回: ${record.ret.toLocaleString()}円</span>
            <span class="${isWin ? 'plus' : 'minus'}">
                ${isWin ? '+' : ''}${record.balance.toLocaleString()}円 (${record.recovery}%)
            </span>
        </div>
    `;
    recordList.prepend(div); // DOM上では新しいものを上に追加(リロード時と合わせるためprependにするかは調整)
}

function updateSummary() {
    const records = getRecords();
    let totalInvest = 0;
    let totalReturn = 0;

    records.forEach(r => {
        totalInvest += r.invest;
        totalReturn += r.ret;
    });

    const totalBalance = totalReturn - totalInvest;
    const totalRecovery = totalInvest === 0 ? 0 : Math.round((totalReturn / totalInvest) * 100);

    totalBalanceEl.textContent = `${totalBalance >= 0 ? '+' : ''}${totalBalance.toLocaleString()}円`;
    totalRecoveryEl.textContent = `${totalRecovery}%`;
    
    // 収支の色変え
    totalBalanceEl.style.color = totalBalance >= 0 ? '#81c784' : '#ffccbc';
}

// Service Worker登録（前のと同じでOK）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}
