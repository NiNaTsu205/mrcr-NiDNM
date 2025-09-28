// 🎉 手数料率を定数として固定します (10% = 0.1)
const FIXED_FEE_RATE = 0.1;

// HTMLの要素を取得します
const targetProfitInput = document.getElementById('target-profit');
const currentSellingPriceInput = document.getElementById('current-selling-price');
const shippingFeeSelect = document.getElementById('shipping-fee-select');
const manualShippingInputDiv = document.getElementById('manual-shipping-input');
const manualShippingFeeInput = document.getElementById('manual-shipping-fee');

const sectionToSelling = document.getElementById('section-to-selling');
const sectionToProfit = document.getElementById('section-to-profit');
const modeToSellingButton = document.getElementById('mode-to-selling');
const modeToProfitButton = document.getElementById('mode-to-profit');

const sellingPriceDisplay = document.getElementById('selling-price');
const calculatedProfitDisplay = document.getElementById('calculated-profit');
const calculatedFeeDisplay = document.getElementById('calculated-fee');
const displayShippingFee = document.getElementById('display-shipping-fee');
const feeRateDisplay = document.getElementById('fee-rate-display');
const feeRateDisplayBreakdown = document.getElementById('fee-rate-display-breakdown');

const saveHistoryButton = document.getElementById('save-history-button');
const saveInventoryButton = document.getElementById('save-inventory-button');
const itemMemoInput = document.getElementById('item-memo');
const historyList = document.getElementById('history-list');
const inventoryList = document.getElementById('inventory-list');

// 現在の計算モードを保持する変数 (0: 逆算モード, 1: 順算モード)
let currentMode = 0; 

// 初期設定: 手数料率表示を更新 (固定値 10%)
feeRateDisplay.textContent = 10; 
feeRateDisplayBreakdown.textContent = 10;

// --- モード切り替えのロジック ---
function switchMode(mode) {
    currentMode = mode;
    if (mode === 0) {
        sectionToSelling.style.display = 'block';
        sectionToProfit.style.display = 'none';
        modeToSellingButton.classList.add('active');
        modeToProfitButton.classList.remove('active');
    } else {
        sectionToSelling.style.display = 'none';
        sectionToProfit.style.display = 'block';
        modeToSellingButton.classList.remove('active');
        modeToProfitButton.classList.add('active');
    }
    calculate();
}
modeToSellingButton.addEventListener('click', () => switchMode(0));
modeToProfitButton.addEventListener('click', () => switchMode(1));
// ------------------------------------

// --- 送料選択のロジック ---
shippingFeeSelect.addEventListener('change', () => {
    if (shippingFeeSelect.value === '0') {
        manualShippingInputDiv.style.display = 'block';
    } else {
        manualShippingInputDiv.style.display = 'none';
    }
    calculate();
});
// ----------------------------

// メインの計算関数 (モードに応じて処理を振り分けます)
function calculate() {
    // 1. 共通の入力値を取得
    const feeRate = FIXED_FEE_RATE; 

    let shippingFee;
    if (shippingFeeSelect.value === '0') {
        shippingFee = parseInt(manualShippingFeeInput.value);
    } else {
        shippingFee = parseInt(shippingFeeSelect.value);
    }
    displayShippingFee.textContent = shippingFee;

    // 入力値の基本バリデーション
    if (isNaN(shippingFee) || shippingFee < 0) {
        sellingPriceDisplay.textContent = calculatedProfitDisplay.textContent = '無効な入力です';
        calculatedFeeDisplay.textContent = '---';
        return; 
    }

    if (currentMode === 0) {
        // モード 0: 目標売上金から出品価格を計算 (逆算)
        calculateSellingPrice(targetProfitInput.value, shippingFee, feeRate);
    } else {
        // モード 1: 出品価格から手取り額を計算 (順算)
        calculateProfit(currentSellingPriceInput.value, shippingFee, feeRate);
    }
}

// モード 0 の計算ロジック
function calculateSellingPrice(targetProfitValue, shippingFee, feeRate) {
    const targetProfit = parseInt(targetProfitValue);

    if (isNaN(targetProfit) || targetProfit < 0) {
        sellingPriceDisplay.textContent = '無効な入力です';
        calculatedFeeDisplay.textContent = '---';
        return;
    }

    // 計算式 B: 出品価格 = (目標売上金 + 送料) / (1 - 手数料率)
    const numerator = targetProfit + shippingFee;
    const denominator = 1 - feeRate;
    const calculatedPrice = numerator / denominator;

    // 1円未満の切り上げ (目標達成のため)
    const finalSellingPrice = Math.ceil(calculatedPrice);
    
    // 逆算した手数料額を求めます (出品価格 * 手数料率)
    const calculatedFee = Math.floor(finalSellingPrice * feeRate); 

    sellingPriceDisplay.textContent = `${finalSellingPrice} 円`;
    calculatedFeeDisplay.textContent = `${calculatedFee}`;
}

// モード 1 の計算ロジック
function calculateProfit(sellingPriceValue, shippingFee, feeRate) {
    const sellingPrice = parseInt(sellingPriceValue);

    if (isNaN(sellingPrice) || sellingPrice < 300) { // メルカリの最低価格300円を考慮
        calculatedProfitDisplay.textContent = '無効な入力です (300円以上)';
        calculatedFeeDisplay.textContent = '---';
        return;
    }

    // 順算式: 売上金 = 出品価格 - (出品価格 * 手数料率) - 送料
    const calculatedFee = Math.floor(sellingPrice * feeRate);
    const finalProfit = sellingPrice - calculatedFee - shippingFee;

    calculatedProfitDisplay.textContent = `${finalProfit} 円`;
    calculatedFeeDisplay.textContent = `${calculatedFee}`;
}

// --- 履歴・所持品リストのロジック ---

// 履歴アイテムを表示する汎用関数
function displayItems(items, listElement, itemType) {
    listElement.innerHTML = ''; 
    
    if (items.length === 0) {
        listElement.innerHTML = itemType === 'history' ? '<p>まだ履歴はありません。</p>' : '<p>現在、所持品リストに登録された品物はありません。</p>';
        return;
    }
    
    items.reverse().forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('history-item');
        if (itemType === 'inventory') {
            itemDiv.classList.add('inventory-item');
        }

        itemDiv.innerHTML = `
            <div style="width: 100%">
                <p><strong>${item.memo}</strong> (保存日: ${item.date})</p>
                ${itemType === 'inventory' ? `<p class="shipping-method">発送方法: ${item.shippingMethod} (${item.shipping}円)</p>` : `<p>送料: ${item.shipping}円</p>`}
                
                <p>出品価格: ${item.price}円 (手数料: ${item.fee}円)</p>
                <p class="final-result">手取り額: ${item.profit}円</p>
            </div>
            <button class="delete-btn" data-type="${itemType}" data-index="${items.length - 1 - index}">削除</button>
        `;
        listElement.appendChild(itemDiv);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', deleteItem);
    });
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('mercaliHistory') || '[]');
    displayItems(history, historyList, 'history');
}

function loadInventory() {
    const inventory = JSON.parse(localStorage.getItem('mercaliInventory') || '[]');
    displayItems(inventory, inventoryList, 'inventory');
}

// 計算結果を履歴または所持品として保存する
function saveItem(isInventory) {
    let price, profit;
    
    if (currentMode === 0) {
        price = sellingPriceDisplay.textContent;
        profit = targetProfitInput.value; 
    } else {
        price = currentSellingPriceInput.value;
        profit = calculatedProfitDisplay.textContent;
    }
    
    const fee = calculatedFeeDisplay.textContent;
    const shipping = displayShippingFee.textContent;
    const memo = itemMemoInput.value || '名称未設定';
    // 発送方法のテキストを取得
    const shippingMethod = shippingFeeSelect.options[shippingFeeSelect.selectedIndex].text.split(' (')[0]; 

    const item = {
        memo: memo,
        date: new Date().toLocaleDateString('ja-JP'),
        price: price.replace(' 円', ''),
        profit: profit.toString().replace(' 円', ''),
        fee: fee.replace(' 円', ''),
        shipping: shipping.replace(' 円', ''),
        shippingMethod: shippingMethod
    };

    if (isInventory) {
        const inventory = JSON.parse(localStorage.getItem('mercaliInventory') || '[]');
        inventory.push(item);
        localStorage.setItem('mercaliInventory', JSON.stringify(inventory));
        loadInventory();
    } else {
        const history = JSON.parse(localStorage.getItem('mercaliHistory') || '[]');
        history.push(item);
        localStorage.setItem('mercaliHistory', JSON.stringify(history));
        loadHistory();
    }
    
    itemMemoInput.value = '';
}

// 履歴または所持品のアイテムを削除する汎用関数
function deleteItem(event) {
    const indexToDelete = parseInt(event.target.getAttribute('data-index'));
    const itemType = event.target.getAttribute('data-type');
    const storageKey = itemType === 'history' ? 'mercaliHistory' : 'mercaliInventory';
    
    const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    items.splice(indexToDelete, 1);
    
    localStorage.setItem(storageKey, JSON.stringify(items));
    
    if (itemType === 'history') {
        loadHistory();
    } else {
        loadInventory();
    }
}


// --- イベントリスナーの設定と初期化 ---
targetProfitInput.addEventListener('input', calculate);
currentSellingPriceInput.addEventListener('input', calculate);
manualShippingFeeInput.addEventListener('input', calculate);
shippingFeeSelect.addEventListener('change', calculate);

saveHistoryButton.addEventListener('click', () => saveItem(false));
saveInventoryButton.addEventListener('click', () => saveItem(true));

loadHistory();
loadInventory(); 
switchMode(0);
