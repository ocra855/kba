// --- 要素の取得 ---
const raceNameInput = document.getElementById("raceName");
const horseNameInput = document.getElementById("horseName");
const investInput = document.getElementById("investAmount");
const returnInput = document.getElementById("returnAmount");
const saveBtn = document.getElementById("saveBtn");
const recordList = document.getElementById("recordList");
const totalBalanceEl = document.getElementById("totalBalance");
const totalRecoveryEl = document.getElementById("totalRecovery");
const totalInvestEl = document.getElementById("totalInvestAmount");
const totalReturnEl = document.getElementById("totalReturnAmount");
const clearBtn = document.getElementById("clearBtn");

// --- 変数 ---
let isEditing = false; // 編集中かどうかのフラグ
let editId = null; // 編集中のデータのID

// --- 初期化 ---
document.addEventListener("DOMContentLoaded", loadRecords);

// --- 保存ボタンの処理 ---
saveBtn.addEventListener("click", () => {
    const race = raceNameInput.value;
    const horse = horseNameInput.value;
    const invest = Number(investInput.value) || 0;
    const ret = Number(returnInput.value) || 0;

    if (!race && !invest) {
        alert("レース名か金額を入力してください");
        return;
    }

    const recordData = {
        id: isEditing ? editId : Date.now(), // 編集中なら同じID、新規なら新ID
        date: new Date().toLocaleDateString(),
        race: race,
        horse: horse,
        invest: invest,
        ret: ret,
        balance: ret - invest,
        recovery: invest === 0 ? 0 : Math.round((ret / invest) * 100)
    };

    if (isEditing) {
        updateRecord(recordData);
    } else {
        saveNewRecord(recordData);
    }

    // 入力欄をクリアしてリセット
    resetForm();
});

// --- データ操作関数 ---

// 新規保存
function saveNewRecord(record) {
    let records = getRecords();
    records.unshift(record);
    localStorage.setItem("keiba-records", JSON.stringify(records));
    loadRecords(); // 再描画
}

// 更新（上書き）
function updateRecord(updatedRecord) {
    let records = getRecords();
    // IDが一致するものを探して置き換える
    records = records.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
    localStorage.setItem("keiba-records", JSON.stringify(records));
    loadRecords(); // 再描画
}

// 削除
function deleteRecord(id) {
    if (!confirm("この記録を削除してもよろしいですか？")) return;

    let records = getRecords();
    records = records.filter((r) => r.id !== id); // IDが一致しないものだけ残す
    localStorage.setItem("keiba-records", JSON.stringify(records));

    // もし編集中だったものを消した場合はフォームもリセット
    if (isEditing && editId === id) {
        resetForm();
    }
    loadRecords();
}

// 編集モードに入る
function editRecord(id) {
    const records = getRecords();
    const target = records.find((r) => r.id === id);

    if (target) {
        // 入力欄にデータを戻す
        raceNameInput.value = target.race;
        horseNameInput.value = target.horse;
        investInput.value = target.invest;
        returnInput.value = target.ret;

        // 編集モードON
        isEditing = true;
        editId = id;

        // ボタンの見た目を変える
        saveBtn.textContent = "修正内容を保存";
        saveBtn.style.backgroundColor = "#1976d2"; // 青色に変更

        // 画面一番上（入力欄）へスクロール
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

// フォームのリセット
function resetForm() {
    raceNameInput.value = "";
    horseNameInput.value = "";
    investInput.value = "";
    returnInput.value = "";

    isEditing = false;
    editId = null;
    saveBtn.textContent = "記録をつける";
    saveBtn.style.backgroundColor = "#f57c00"; // オレンジに戻す
}

// --- 読み込み・表示関連 ---

function getRecords() {
    return JSON.parse(localStorage.getItem("keiba-records") || "[]");
}

function loadRecords() {
    recordList.innerHTML = ""; // 一旦クリア
    const records = getRecords();
    records.forEach(createRecordElement);
    updateSummary();
}

function createRecordElement(record) {
    const div = document.createElement("div");
    const isWin = record.balance >= 0;
    div.classList.add("record-card", isWin ? "win" : "lose");

    div.innerHTML = `
        <div class="card-header">
            <span>${record.race}</span>
            <span style="font-size:0.8em; font-weight:normal;">${record.date}</span>
        </div>
        <div class="card-details">${record.horse ? "📝 " + record.horse : ""}</div>
        <div class="card-result">
            <span>投: ${record.invest.toLocaleString()} → 回: ${record.ret.toLocaleString()}</span>
            <span class="${isWin ? "plus" : "minus"}">
                ${isWin ? "+" : ""}${record.balance.toLocaleString()}
            </span>
        </div>
        <div class="action-buttons">
            <button class="edit-btn" onclick="editRecord(${record.id})">編集</button>
            <button class="delete-btn" onclick="deleteRecord(${record.id})">削除</button>
        </div>
    `;
    recordList.appendChild(div);
}

function updateSummary() {
    const records = getRecords();
    let totalInvest = 0;
    let totalReturn = 0;

    records.forEach((r) => {
        totalInvest += Number(r.invest);
        totalReturn += Number(r.ret);
    });

    const totalBalance = totalReturn - totalInvest;
    const totalRecovery = totalInvest === 0 ? 0 : Math.round((totalReturn / totalInvest) * 100);

    if (totalInvestEl) {
        totalInvestEl.textContent = totalInvest.toLocaleString();
    }

    if (totalReturnEl) {
        totalReturnEl.textContent = totalReturn.toLocaleString();
    
    totalBalanceEl.textContent = `${totalBalance >= 0 ? "+" : ""}${totalBalance.toLocaleString()}円`;
    totalRecoveryEl.textContent = `${totalRecovery}%`;
    totalBalanceEl.style.color = totalBalance >= 0 ? "#81c784" : "#ffccbc";
}

// 全消去ボタン
clearBtn.addEventListener("click", () => {
    if (confirm("本当に全てのデータを消しますか？")) {
        localStorage.removeItem("keiba-records");
        loadRecords();
    }
});

// Service Worker登録
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js");
    });
}

// --- バックアップ・復元機能 ---

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");

// 1. データを書き出す（バックアップ）
exportBtn.addEventListener("click", () => {
    const records = localStorage.getItem("keiba-records");

    if (!records || records === "[]") {
        alert("保存するデータがありません");
        return;
    }

    // データをファイル(blob)にする
    const blob = new Blob([records], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // ダウンロードリンクを作って自動で押す
    const a = document.createElement("a");
    a.href = url;
    a.download = `keiba_backup_${new Date().toISOString().slice(0, 10)}.json`; // ファイル名に日付を入れる
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// 2. データを読み込むボタンを押した時
importBtn.addEventListener("click", () => {
    // 隠してあるファイル選択画面を開く
    importInput.click();
});

// 3. ファイルが選択されたら実行（復元）
importInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("現在のデータを上書きして復元しますか？\n（今のデータは消えて、ファイルの内容になります）")) {
        importInput.value = ""; // キャンセルしたらリセット
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const json = e.target.result;
            // 正しいデータかチェック（パースしてみる）
            const parsed = JSON.parse(json);

            if (Array.isArray(parsed)) {
                // LocalStorageに上書き保存
                localStorage.setItem("keiba-records", json);
                alert("復元が完了しました！");
                location.reload(); // 画面を更新して反映
            } else {
                alert("データの形式が正しくありません");
            }
        } catch (err) {
            alert("ファイルの読み込みに失敗しました");
            console.error(err);
        }
    };

    reader.readAsText(file);
});

// --- タブ切り替え機能 ---
function switchTab(tabName) {
    // コンテンツの表示・非表示
    document.getElementById("recordTab").style.display = tabName === "record" ? "block" : "none";
    document.getElementById("calcTab").style.display = tabName === "calc" ? "block" : "none";

    // ボタンの見た目変更
    const buttons = document.querySelectorAll(".tab-btn");
    if (tabName === "record") {
        buttons[0].classList.add("active");
        buttons[1].classList.remove("active");
    } else {
        buttons[0].classList.remove("active");
        buttons[1].classList.add("active");
        // 計算画面を開いたとき、入力欄が空なら2つ作っておく
        if (document.getElementById("oddsInputList").children.length === 0) {
            addOddsInput();
            addOddsInput();
        }
    }
}

// --- 合成オッズ・資金配分計算機能 ---

// オッズ入力欄を1行追加する
function addOddsInput() {
    const div = document.createElement("div");
    div.className = "odds-row";
    div.innerHTML = `
        <input type="number" placeholder="オッズ (例: 5.2)" class="odds-value" step="0.1" onchange="calculateOdds()">
        <button class="remove-row-btn" onclick="this.parentElement.remove(); calculateOdds();">×</button>
    `;
    document.getElementById("oddsInputList").appendChild(div);
}

// 計算実行
function calculateOdds() {
    const budget = Number(document.getElementById("calcBudget").value) || 0;
    const inputs = document.querySelectorAll(".odds-value");

    // オッズのリストを取得（空欄は除外）
    let oddsList = [];
    inputs.forEach((input) => {
        const val = Number(input.value);
        if (val > 0) oddsList.push(val);
    });

    if (oddsList.length === 0 || budget <= 0) {
        document.getElementById("calcResultArea").style.display = "none";
        document.getElementById("calcDistributionList").innerHTML = "";
        return;
    }

    // 1. 合成オッズの計算 ( 1 / Σ(1/オッズ) )
    let inverseSum = 0;
    oddsList.forEach((odd) => {
        inverseSum += 1 / odd;
    });
    const compositeOdds = 1 / inverseSum;

    // 2. 配分計算
    // 各買い目への配分 = (予算 × 合成オッズ) / そのオッズ
    // ※ただし100円単位にする必要があるため調整します

    let totalBet = 0;
    let distributions = [];

    oddsList.forEach((odd) => {
        // 理論上の配分額
        let amount = (budget * compositeOdds) / odd;

        // 100円単位に切り捨て (JRA仕様)
        // ※厳密に予算ぴったりにするには微調整ロジックが必要ですが、今回はシンプルに切り捨てて計算
        amount = Math.floor(amount / 100) * 100;

        // 最低100円は賭ける（予算オーバーの可能性ありだが、0円よりマシ）
        if (amount === 0 && budget >= 100) amount = 100;

        distributions.push({
            odd: odd,
            amount: amount,
            return: Math.floor(amount * odd)
        });
        totalBet += amount;
    });

    // 結果表示
    const resultArea = document.getElementById("calcResultArea");
    const distList = document.getElementById("calcDistributionList");

    resultArea.style.display = "block";

    // 合成オッズ表示
    document.getElementById("resultComposite").textContent = compositeOdds.toFixed(2) + "倍";

    // 予想払戻（平均値をとって表示）
    // すべての買い目でだいたい同じ払戻になるはずですが、100円単位の丸めでズレます
    const avgReturn = distributions.reduce((sum, d) => sum + d.return, 0) / distributions.length;
    document.getElementById("resultReturn").textContent = Math.round(avgReturn).toLocaleString() + "円";

    const profit = Math.round(avgReturn) - totalBet;
    document.getElementById("resultProfit").textContent =
        `${profit >= 0 ? "+" : ""}${profit.toLocaleString()}円 (計${totalBet}円購入)`;

    // リスト描画
    distList.innerHTML = "";
    distributions.forEach((d, index) => {
        const div = document.createElement("div");
        div.className = "dist-item";
        div.innerHTML = `
            <div>
                <span style="font-weight:bold;">${d.odd}倍</span>
            </div>
            <div style="text-align:right;">
                <div class="dist-buy">${d.amount.toLocaleString()}円</div>
                <div style="font-size:0.8rem; color:#666;">払戻: ${d.return.toLocaleString()}</div>
            </div>
        `;
        distList.appendChild(div);
    });
}
