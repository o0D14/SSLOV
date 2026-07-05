// --- БАЗОВЫЕ ПЕРЕМЕННЫЕ И ДАННЫЕ ---
let petData = {
    food: 100,
    water: 100,
    health: 100,
    happiness: 100, // 😎 ВИТЯ: Добавили шкалу счастья в базу!
    days: 0,
    isSleeping: false
};

let inventory = {
    food: 0,
    water: 0
};

let gameHours = 12;   
let gameMinutes = 0;

// Привязка элементов интерфейса
const roomBg = document.getElementById('room-bg');
const petSprite = document.getElementById('pet-sprite');

const barFood = document.getElementById('bar-food');
const barWater = document.getElementById('bar-water');
const barHealth = document.getElementById('bar-health');
const daysCount = document.getElementById('days-count');
const gameClock = document.getElementById('game-clock');
const nightHint = document.getElementById('night-hint');

let actionImageActive = false;
let actionImageTimer = null;

// Кнопки действий
const btnEat = document.getElementById('btn-eat');
const btnDrink = document.getElementById('btn-drink');
const btnSleep = document.getElementById('btn-sleep');
const btnMsg = document.getElementById('btn-msg');
const btnKitchen = document.getElementById('btn-kitchen');
const btnGames = document.getElementById('btn-games');
const btnBackKitchen = document.getElementById('btn-back-kitchen');
const btnSave = document.getElementById('btn-save');
const gamesScreen = document.getElementById('games-screen');
const btnCloseGames = document.getElementById('btn-close-games');
const btnSpaceBattle = document.getElementById('btn-space-battle');
const spaceGameScreen = document.getElementById('space-game-screen');
const spaceGameCanvas = document.getElementById('space-game-canvas');
const btnFire = document.getElementById('btn-fire');
const btnExitSpace = document.getElementById('btn-exit-space');
const spaceHitCount = document.getElementById('space-hit-count');
const btnMoveLeft = document.getElementById('btn-move-left');
const btnMoveDown = document.getElementById('btn-move-down');
const btnMoveRight = document.getElementById('btn-move-right');
const btnMoveUp = document.getElementById('btn-move-up');
const coinCount = document.getElementById('coin-count');
const btnShop = document.getElementById('btn-shop');
const shopIntroScreen = document.getElementById('shop-intro-screen');
const shopMainScreen = document.getElementById('shop-main-screen');
const shopItemsScreen = document.getElementById('shop-items-screen');
const btnEnterShop = document.getElementById('btn-enter-shop');
const btnViewShopItems = document.getElementById('btn-view-shop-items');
const btnReturnHome = document.getElementById('btn-return-home');
const btnBuyFood = document.getElementById('btn-buy-food');
const btnBuyWater = document.getElementById('btn-buy-water');
const btnShopBackHome = document.getElementById('btn-shop-back-home');
const shopStatusText = document.getElementById('shop-status-text');
const inventoryFoodCount = document.getElementById('inventory-food-count');
const inventoryWaterCount = document.getElementById('inventory-water-count');

let reminderTimer = null;
let kitchenOpen = false;
let shopOpen = false;
let coins = 10;
let inSpaceGame = false;
let kitchenMessageTimer = null;
let saveTimer = null;
let lastTimeMinutes = null;
let spaceGameState = null;
let spaceGameAnimation = null;
let spaceKeys = {};

const dialogBox = document.getElementById('dialog-box');
const dialogText = document.getElementById('dialog-text');
const btnSayLove = document.getElementById('btn-say-love');
const btnCloseDialog = document.getElementById('btn-close-dialog');

// --- ИНИЦИАЛИЗАЦИЯ И СТАРТ ИГРЫ ---
function init() {
    loadData(); 
    initNotifications();
    updateClock();
    setInterval(updateClock, 1000);
    setInterval(gameLoop, 5000);
    saveTimer = setInterval(saveData, 10000);
    updateUI(); 
    updatePetState();
}

function updateClock() {
    const previousTimeMinutes = gameHours * 60 + gameMinutes;
    gameMinutes += 5;

    if (gameMinutes >= 60) {
        gameHours += Math.floor(gameMinutes / 60);
        gameMinutes = gameMinutes % 60;
    }

    if (gameHours >= 24) {
        gameHours = 0;
    }

    const newTimeMinutes = gameHours * 60 + gameMinutes;
    if (lastTimeMinutes !== null && previousTimeMinutes < 7 * 60 && newTimeMinutes >= 7 * 60) {
        petData.days += 1;
        saveData();
        updateUI();
    }
    lastTimeMinutes = newTimeMinutes;

    const displayHours = String(gameHours).padStart(2, '0');
    const displayMinutes = String(gameMinutes).padStart(2, '0');
    gameClock.innerText = `${displayHours}:${displayMinutes}`;

    const isNightTime = (gameHours < 7 || gameHours > 22 || (gameHours === 22 && gameMinutes > 0));
    if (isNightTime) {
        btnSleep.classList.remove('disabled'); 
    } else {
        btnSleep.classList.add('disabled');    
        if (petData.isSleeping) {
            wakeUp(); 
        }
    }

    updatePetState();
    updateNightHint();
}

// --- УПРАВЛЕНИЕ СПРАЙТОМ И ФОНОМ ---
function updatePetState() {
    const isNightTime = (gameHours < 7 || gameHours > 22 || (gameHours === 22 && gameMinutes > 0));

    petSprite.classList.remove('hidden');

    if (petData.isSleeping) {
        roomBg.src = 'соняспит.png';
        petSprite.classList.add('hidden');
        
    } else if (shopOpen) {
        if (!shopIntroScreen.classList.contains('hidden')) {
            roomBg.src = 'возлемагазина.png';
            if (!actionImageActive) petSprite.src = 'соняпрыгает.png';
        } else {
            roomBg.src = 'магазин.png';
            if (!actionImageActive) petSprite.src = 'сонястоит.png';
        }
        
        petSprite.style.bottom = "20%";
        petSprite.style.maxHeight = "60%";
        petSprite.style.left = "50%";
        
    } else if (kitchenOpen) {
        roomBg.src = 'кухня.png';
        
        if (!actionImageActive) {
            petSprite.src = 'сонякухня.png';
            petSprite.style.bottom = "-8%";    
            petSprite.style.maxHeight = "80%"; 
        }
        petSprite.style.left = "50%";

    } else {
        roomBg.src = isNightTime ? 'ночькомната.png' : 'денькомната.png';
        
        if (!actionImageActive) {
            if (petData.food < 40 || petData.water < 40) {
                petSprite.src = 'соняплачет.png'; 
            } else {
                petSprite.src = 'сонястоит.png';
            }
        }
        
        petSprite.style.bottom = "25%"; 
        petSprite.style.maxHeight = "50%";
        petSprite.style.left = "50%";
    }
}

function gameLoop() {
    if (!petData.isSleeping) {
        petData.food -= 2;
        petData.water -= 2;
        petData.health -= 1;
        petData.happiness -= 1; // 😉 Счастье тоже потихоньку уменьшается со временем
    } else {
        if (petData.health < 100) petData.health = Math.min(100, petData.health + 10);
        if (petData.happiness < 100) petData.happiness = Math.min(100, petData.happiness + 2);
    }

    if (petData.food < 0) petData.food = 0;
    if (petData.water < 0) petData.water = 0;
    if (petData.health < 0) petData.health = 0;
    if (petData.happiness < 0) petData.happiness = 0;

    updateUI();
    updateNightHint();
    updatePetState();
    autoSaveState();
}

function updateNightHint() {
    const isNightTime = (gameHours < 7 || gameHours > 22 || (gameHours === 22 && gameMinutes > 0));
    if (!isNightTime) {
        nightHint.classList.add('hidden');
        return;
    }

    const warnings = [];
    if (petData.food < 40) warnings.push('утром на кухню');

    if (warnings.length > 0) {
        nightHint.innerText = warnings.join(' и ');
        nightHint.classList.remove('hidden');
    } else {
        nightHint.classList.add('hidden');
    }
}

function setTempImage(src, time = 2000) {
    const isNightTime = (gameHours < 7 || gameHours > 22 || (gameHours === 22 && gameMinutes > 0));
    if (petData.isSleeping || shopOpen || (isNightTime && !petData.isSleeping)) return;

    actionImageActive = true;
    clearTimeout(actionImageTimer);
    petSprite.src = src;

    actionImageTimer = setTimeout(() => {
        actionImageActive = false;
        updatePetState();
    }, time);
}

// --- МАГАЗИН И КУХНЯ ---
function openKitchen() {
    kitchenOpen = true;
    shopOpen = false;
    btnKitchen.classList.add('hidden');
    btnGames.classList.add('hidden');
    btnBackKitchen.classList.remove('hidden');
    btnEat.classList.remove('hidden');
    btnDrink.classList.remove('hidden');
    btnShop.classList.remove('hidden');
    btnSleep.classList.add('hidden');
    btnMsg.classList.add('hidden');
    if (btnSave) btnSave.classList.add('hidden');
    
    document.getElementById('days-line').classList.add('hidden');
    document.getElementById('kitchen-inventory').classList.remove('hidden');
    
    hideShopScreens();
    updatePetState();
}

function closeKitchen() {
    kitchenOpen = false;
    shopOpen = false;
    btnKitchen.classList.remove('hidden');
    btnGames.classList.remove('hidden');
    btnBackKitchen.classList.add('hidden');
    btnEat.classList.add('hidden');
    btnDrink.classList.add('hidden');
    btnShop.classList.add('hidden');
    btnSleep.classList.remove('hidden');
    btnMsg.classList.remove('hidden');
    if (btnSave) btnSave.classList.remove('hidden');
    
    document.getElementById('days-line').classList.remove('hidden');
    document.getElementById('kitchen-inventory').classList.add('hidden');
    document.getElementById('kitchen-message').classList.add('hidden');
    
    hideShopScreens();
    updatePetState();
}

function openShopIntro() { shopOpen = true; hideShopScreens(); shopIntroScreen.classList.remove('hidden'); updatePetState(); }
function openShopMain() { shopOpen = true; hideShopScreens(); shopMainScreen.classList.remove('hidden'); shopMainScreen.querySelector('#shop-dialog-text').innerText = 'Что купим?'; updatePetState(); }
function openShopItems() { shopOpen = true; hideShopScreens(); shopItemsScreen.classList.remove('hidden'); updatePetState(); }

function hideShopScreens() {
    shopIntroScreen.classList.add('hidden');
    shopMainScreen.classList.add('hidden');
    shopItemsScreen.classList.add('hidden');
}

function buyItem(type) {
    if (coins <= 0) {
        shopStatusText.innerText = type === 'food' ? 'Не хватает монет для еды' : 'Не хватает монет для воды';
        return;
    }
    coins -= 1;
    if (type === 'food') {
        inventory.food += 1;
        shopStatusText.innerText = 'Купили еду!';
    } else {
        inventory.water += 1;
        shopStatusText.innerText = 'Купили воду!';
    }
    updateUI();
    saveData();
}

function useInventoryItem(type) {
    if (type === 'food' && inventory.food > 0) {
        inventory.food -= 1;
        petData.food = Math.min(100, petData.food + 30);
        petSprite.style.bottom = "20%";    
        petSprite.style.maxHeight = "50%"; 
        setTempImage('сонякушает.png', 2000); 
        updateUI();
        saveData();
        return true;
    }
    if (type === 'water' && inventory.water > 0) {
        inventory.water -= 1;
        petData.water = Math.min(100, petData.water + 30);
        petSprite.style.bottom = "28%";    
        petSprite.style.maxHeight = "33%"; 
        setTempImage('соняпьет.png', 2000);   
        updateUI();
        saveData();
        return true;
    }
    return false;
}

// --- МИНИ-ИГРА КОСМОС ---
function openGames() { gamesScreen.classList.remove('hidden'); spaceGameScreen.classList.add('hidden'); document.getElementById('games-panel').classList.remove('hidden'); }
function closeGames() { gamesScreen.classList.add('hidden'); exitSpaceGame(); document.getElementById('games-panel').classList.remove('hidden'); }
function openSpaceGame() { inSpaceGame = true; gamesScreen.classList.remove('hidden'); document.getElementById('games-panel').classList.add('hidden'); spaceGameScreen.classList.remove('hidden'); initSpaceGame(); }

function exitSpaceGame() {
    inSpaceGame = false;
    spaceGameScreen.classList.add('hidden');
    gamesScreen.classList.add('hidden');
    document.getElementById('games-panel').classList.remove('hidden');
    spaceHitCount.innerText = '0';
    spaceKeys = {};
    if (spaceGameState && spaceGameState.ctx) spaceGameState.ctx.clearRect(0, 0, spaceGameState.width, spaceGameState.height);
    spaceGameState = null;
    if (spaceGameAnimation) { cancelAnimationFrame(spaceGameAnimation); spaceGameAnimation = null; }
    window.removeEventListener('keydown', handleSpaceKeyDown);
    window.removeEventListener('keyup', handleSpaceKeyUp);
}

function addCoins(amount) { coins = Math.max(0, coins + amount); coinCount.innerText = coins; }
function createUfoWave(width, height) {
    const positions = [30, 90, 150, 210, 270, 330];
    const shuffled = positions.sort(() => Math.random() - 0.5);
    return [
        { x: shuffled[0], y: Math.random() * 80 + 20, health: 2 },
        { x: shuffled[1], y: Math.random() * 80 + 20, health: 2 },
        { x: shuffled[2], y: Math.random() * 80 + 20, health: 2 }
    ];
}

function initSpaceGame() {
    const ctx = spaceGameCanvas.getContext('2d');
    const width = spaceGameCanvas.width;
    const height = spaceGameCanvas.height;
    const stars = [];
    for (let i = 0; i < 60; i++) stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: Math.random() * 0.4 + 0.2 });

    spaceGameState = { ctx, width, height, ship: { x: width / 2 - 12, y: height - 36, w: 24, h: 24, speed: 3, autoDown: 0.25, boostUp: 1.2, downSpeed: 1.2 }, bullets: [], ufos: createUfoWave(width, height), stars, score: 0, respawnTimer: null };
    window.addEventListener('keydown', handleSpaceKeyDown);
    window.addEventListener('keyup', handleSpaceKeyUp);
    drawSpaceGame();
}

// ... (отрисовка и логика космоса без изменений)
function drawSpaceGame() {
    if (!inSpaceGame || !spaceGameState) return;
    const { ctx, width, height, ship, bullets, ufos, stars } = spaceGameState;

    ctx.fillStyle = '#050817';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height) { star.y = 0; star.x = Math.random() * width; }
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    updateSpaceGame();

    ctx.fillStyle = '#7fffd4';
    ctx.fillRect(ship.x + 8, ship.y, 8, 6);
    ctx.fillRect(ship.x + 4, ship.y + 6, 16, 8);
    ctx.fillStyle = '#00bfa5';
    ctx.fillRect(ship.x + 10, ship.y + 8, 4, 6);

    ctx.fillStyle = '#ffeb3b';
    bullets.forEach((b) => ctx.fillRect(b.x, b.y, 4, 10));

    ufos.forEach((ufo) => {
        ctx.fillStyle = ufo.health === 2 ? '#ff4d4d' : '#ffeb3b';
        ctx.fillRect(ufo.x, ufo.y, 28, 12);
    });

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`Монет: ${coins}`, 10, 14);
    if (inSpaceGame && spaceGameState) spaceGameAnimation = requestAnimationFrame(drawSpaceGame);
}

function fireBullet() { if (inSpaceGame && spaceGameState) spaceGameState.bullets.push({ x: spaceGameState.ship.x + 11, y: spaceGameState.ship.y - 10, speed: 6 }); }

function updateSpaceGame() {
    const state = spaceGameState;
    const { ship, bullets, ufos, width, height } = state;

    if (spaceKeys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (spaceKeys.ArrowRight) ship.x = Math.min(width - ship.w - 2, ship.x + ship.speed);
    if (spaceKeys.ArrowUp) ship.y = Math.max(0, ship.y - ship.boostUp);
    else if (spaceKeys.ArrowDown) ship.y = Math.min(height - ship.h - 2, ship.y + ship.downSpeed);
    else ship.y = Math.min(height - ship.h - 2, ship.y + ship.autoDown);

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < -10) { bullets.splice(index, 1); return; }
        ufos.forEach((ufo, ufoIndex) => {
            if (bullet.x < ufo.x + 28 && bullet.x + 4 > ufo.x && bullet.y < ufo.y + 12 && bullet.y + 10 > ufo.y) {
                ufo.health -= 1;
                bullets.splice(index, 1);
                if (ufo.health <= 0) { ufos.splice(ufoIndex, 1); addCoins(1); }
            }
        });
    });

    ufos.forEach((ufo) => {
        if (ship.x < ufo.x + 28 && ship.x + ship.w > ufo.x && ship.y < ufo.y + 12 && ship.y + ship.h > ufo.y) {
            alert('Игра окончена!');
            exitSpaceGame();
        }
    });

    if (ufos.length === 0 && !state.respawnTimer) {
        state.respawnTimer = setTimeout(() => { state.ufos = createUfoWave(width, height); state.respawnTimer = null; }, 1200);
    }
    spaceHitCount.innerText = ufos.length;
}

function handleSpaceKeyDown(e) { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault(); if (e.code === 'Space') fireBullet(); spaceKeys[e.code] = true; }
function handleSpaceKeyUp(e) { spaceKeys[e.code] = false; }
function handleTouchControl(dir) {
    if (!inSpaceGame || !spaceGameState) return;
    if (dir === 'left') { spaceKeys.ArrowLeft = true; setTimeout(() => spaceKeys.ArrowLeft = false, 120); }
    if (dir === 'right') { spaceKeys.ArrowRight = true; setTimeout(() => spaceKeys.ArrowRight = false, 120); }
    if (dir === 'down') { spaceKeys.ArrowDown = true; setTimeout(() => spaceKeys.ArrowDown = false, 120); }
    if (dir === 'up') { spaceKeys.ArrowUp = true; setTimeout(() => spaceKeys.ArrowUp = false, 120); }
}

// --- ИНТЕРФЕЙС И КНОПКИ ---
function updateUI() {
        barFood.style.width = petData.food + '%';
    barWater.style.width = petData.water + '%';
    barHealth.style.width = petData.happiness + '%'; // Счастье теперь привязано к шкале здоровья
    
    document.getElementById('value-food').innerText = petData.food;
    document.getElementById('value-water').innerText = petData.water;
    document.getElementById('value-health').innerText = Math.round(petData.happiness); // Цифры счастья

    daysCount.innerText = petData.days;
    coinCount.innerText = coins;
    updateInventoryDisplay();
}

function updateInventoryDisplay() {
    inventoryFoodCount.innerText = inventory.food;
    inventoryWaterCount.innerText = inventory.water;
    shopStatusText.innerText = `Монет: ${coins} | Еды: ${inventory.food} | Воды: ${inventory.water}`;
}

function showKitchenMessage(text) {
    const box = document.getElementById('kitchen-message');
    box.innerText = text; box.classList.remove('hidden');
    if (kitchenMessageTimer) clearTimeout(kitchenMessageTimer);
    kitchenMessageTimer = setTimeout(() => box.classList.add('hidden'), 1800);
}

btnEat.addEventListener('click', () => { if (!petData.isSleeping && !useInventoryItem('food')) showKitchenMessage('Нет еды'); });
btnDrink.addEventListener('click', () => { if (!petData.isSleeping && !useInventoryItem('water')) showKitchenMessage('Нет воды'); });

btnKitchen.addEventListener('click', () => { 
    const isNightTime = (gameHours < 7 || gameHours > 22 || (gameHours === 22 && gameMinutes > 0));
    if (isNightTime) {
        dialogBox.classList.remove('hidden');
        btnSayLove.classList.add('hidden'); 
        dialogText.innerText = "кисе пора спать а не кушать! 🌙";
        return; 
    }
    if (!petData.isSleeping) openKitchen(); 
});

btnGames.addEventListener('click', () => { if (!petData.isSleeping) openGames(); });

btnShop.addEventListener('click', () => { 
    if (!petData.isSleeping) {
        btnEat.classList.add('hidden');
        btnDrink.classList.add('hidden');
        btnBackKitchen.classList.add('hidden');
        const kitchenInv = document.getElementById('kitchen-inventory');
        if (kitchenInv) kitchenInv.classList.add('hidden');
        openShopIntro(); 
    }
});

btnEnterShop.addEventListener('click', openShopMain);
btnViewShopItems.addEventListener('click', openShopItems);
btnReturnHome.addEventListener('click', closeKitchen);
btnBuyFood.addEventListener('click', () => buyItem('food'));
btnBuyWater.addEventListener('click', () => buyItem('water'));
btnShopBackHome.addEventListener('click', closeKitchen);
btnBackKitchen.addEventListener('click', closeKitchen);
btnCloseGames.addEventListener('click', closeGames);
btnSpaceBattle.addEventListener('click', openSpaceGame);
btnMoveLeft.addEventListener('click', () => handleTouchControl('left'));
btnMoveRight.addEventListener('click', () => handleTouchControl('right'));
btnMoveDown.addEventListener('click', () => handleTouchControl('up')); 
btnMoveUp.addEventListener('click', () => handleTouchControl('down'));  
btnFire.addEventListener('click', fireBullet);
btnExitSpace.addEventListener('click', exitSpaceGame);

// Сон
btnSleep.addEventListener('click', () => {
    const isNightTime = (gameHours < 7 || gameHours > 22 || (gameHours === 22 && gameMinutes > 0));
    if (isNightTime && !petData.isSleeping) {
        petData.isSleeping = true;
        btnSleep.classList.add('disabled');
        updatePetState();
        updateUI();

        setTimeout(() => {
            wakeUp();
            gameHours = 7;
            gameMinutes = 0;
            updatePetState();
            updateNightHint();
        }, 7000);
    }
});

function wakeUp() {
    petData.isSleeping = false;
    updatePetState();
    updateUI();
}

// Открытие диалога через кнопку сообщений (с проверкой на ночь)
btnMsg.addEventListener('click', () => {
    if (petData.isSleeping) return;

    // Проверяем, ночь ли сейчас (с 22:01 до 6:59)
    const isNightTime = (gameHours < 7 || gameHours > 22 || (gameHours === 22 && gameMinutes > 0));

    dialogBox.classList.remove('hidden');

    if (isNightTime) {
        // Если ночь — прячем кнопку «Я люблю тебя»
        btnSayLove.classList.add('hidden'); 
        dialogText.innerText = "соня уже в ином мире... 🌙";
    } else {
        // Если день — показываем кнопку
        btnSayLove.classList.remove('hidden'); 
        dialogText.innerText = "что такое?";
    }
});


// === СТИЛИ И КНОПКА ПРЫЖКА (КОНЕЦ ФАЙЛА СФОРМАТИРОВАН) ===

if (!document.getElementById('sonya-jump-style')) {
    const style = document.createElement('style');
    style.id = 'sonya-jump-style';
    style.innerHTML = `
        .sonya-jumping {
            bottom: 35% !important;     
            max-height: 75% !important;  
        }
    `;
    document.head.appendChild(style);
}

// 😎 ВИТЯ: Вот она, твоя полностью идеальная кнопка!
btnSayLove.addEventListener('click', () => {
    if (petData.isSleeping || actionImageActive) return; 

    petData.happiness = 100; // Мгновенное счастье
    btnSayLove.classList.add('hidden'); // Кнопка исчезает
    dialogText.innerText = "Я тебя тоже очень люблю💝"; // Текст
    
    petSprite.classList.add('sonya-jumping');
    setTempImage('соняпрыгает.png', 2000);

    updateUI(); // Эта функция обновит полоску на экране
    saveData();

    setTimeout(() => {
        petSprite.classList.remove('sonya-jumping');
    }, 2000);
});


btnCloseDialog.addEventListener('click', () => dialogBox.classList.add('hidden'));

function initNotifications() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => { if (p === 'granted') reminderTimer = setInterval(sendReminder, 60000); });
    } else if (Notification.permission === 'granted') {
        reminderTimer = setInterval(sendReminder, 60000);
    }
}
function sendReminder() { if (Notification.permission === 'granted') new Notification('Тамагочи', { body: 'Не забывай меня', icon: 'icon.png' }); }

function autoSaveState() { localStorage.setItem('tamagotchiData', JSON.stringify({ petData, inventory, coins, gameHours, gameMinutes })); }
function saveData() { autoSaveState(); }
function loadData() {
    const saved = localStorage.getItem('tamagotchiData');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Загружаем данные и страхуемся, чтобы счастье по дефолту было 100
        petData = { food: 100, water: 100, health: 100, happiness: 100, days: 0, isSleeping: false, ...(parsed.petData || {}) };
        inventory = { food: 0, water: 0, ...(parsed.inventory || {}) };
        coins = Number.isFinite(parsed.coins) ? parsed.coins : coins;
        gameHours = Number.isFinite(parsed.gameHours) ? parsed.gameHours : gameHours;
        gameMinutes = Number.isFinite(parsed.gameMinutes) ? parsed.gameMinutes : gameMinutes;
        lastTimeMinutes = gameHours * 60 + gameMinutes;
    }
}

if (btnSave) btnSave.remove();
init();
