// --- БАЗОВЫЕ ПЕРЕМЕННЫЕ И ДАННЫЕ ---
let petData = {
    food: 100,
    water: 100,
    health: 100,
    days: 0,
    isSleeping: false
};

let inventory = {
    food: 0,
    water: 0
};

// --- ПЕРЕМЕННЫЕ ДЛЯ ИГРОВОГО ВРЕМЕНИ ---
let gameHours = 12;   // Игра всегда начинается в 12:00 дня
let gameMinutes = 0;

// Привязка элементов интерфейса
const roomBg = document.getElementById('room-bg');
const barFood = document.getElementById('bar-food');
const barWater = document.getElementById('bar-water');
const barHealth = document.getElementById('bar-health');
const daysCount = document.getElementById('days-count');
const gameClock = document.getElementById('game-clock');
const nightHint = document.getElementById('night-hint');

let actionImageActive = false;
let baseBg = 'room_day.png';
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
let coins = 10;
let inSpaceGame = false;
let kitchenMessageTimer = null;
let saveTimer = null;
let lastTimeMinutes = null;
let spaceGameState = null;
let spaceGameAnimation = null;
let spaceKeys = {};
const kitchenBg = 'pet_kohn.png';

// Диалоговое окно
const dialogBox = document.getElementById('dialog-box');
const dialogText = document.getElementById('dialog-text');
const btnSayLove = document.getElementById('btn-say-love');
const btnCloseDialog = document.getElementById('btn-close-dialog');

// --- ИНИЦИАЛИЗАЦИЯ И СТАРТ ИГРЫ ---
function init() {
    loadData(); // 1. Загружаем сохраненные данные

    // Инициализация уведомлений
    initNotifications();

    // 2. Запуск ускоренных игровых часов (каждую 1 секунду)
    updateClock();
    setInterval(updateClock, 1000);

    // 3. Жизненный цикл тамагочи (показатели падают каждые 5 секунд)
    setInterval(gameLoop, 5000);

    // 4. Автосохранение каждые 10 секунд
    saveTimer = setInterval(saveData, 10000);

    updateUI(); // 5. Сразу же отрисовываем полоски на экране!
}

// --- СИСТЕМА ИГРОВОГО ВРЕМЕНИ (Сутки за 10 минут) ---
function updateClock() {
    const previousTimeMinutes = gameHours * 60 + gameMinutes;

    // Каждую секунду реального времени прибавляем игровые минуты
    // Время идёт медленнее: +5 игровых минут за реальную секунду
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

    // Красивое форматирование времени (например, "09:05")
    const displayHours = String(gameHours).padStart(2, '0');
    const displayMinutes = String(gameMinutes).padStart(2, '0');
    
    gameClock.innerText = `${displayHours}:${displayMinutes}`;

    // Проверяем день или ночь прямо во время хода часов
    checkTimeOfDay();
    updateNightHint();
}

// Автоматическая проверка смены дня и ночи
function checkTimeOfDay() {
    // Ночь начинается после 22:00 и длится до 07:00 утра по игровым часам
    const isNightTime = (
        gameHours < 7 ||
        gameHours > 22 ||
        (gameHours === 22 && gameMinutes > 0)
    );

    baseBg = isNightTime ? "room_night.png" : "room_day.png";
    if (!actionImageActive) {
        roomBg.src = kitchenOpen ? kitchenBg : baseBg;
    }

    if (isNightTime) {
        btnSleep.classList.remove('disabled'); // Активируем кнопку сна
    } else {
        btnSleep.classList.add('disabled');    // Днём спать нельзя
        
        // Если наступило утро, а тамагочи ещё спит — будим автоматически
        if (petData.isSleeping) {
            wakeUp(); 
        }
    }

    return isNightTime;
}

// --- ЖИЗНЕННЫЙ ЦИКЛ ТАМАГОЧИ ---
function gameLoop() {
    // Если тамагочи не спит, показатели плавно уменьшаются
    if (!petData.isSleeping) {
        petData.food -= 2;
        petData.water -= 2;
        petData.health -= 1;
        
        // Если показатели критические, подставляем грустную картинку
        if (petData.food < 40 || petData.water < 40) {
            petData.health -= 1;
            const isNightTime = (
                gameHours < 9 ||
                gameHours > 22 ||
                (gameHours === 22 && gameMinutes > 0)
            );
            if (!isNightTime) {
                setTempImage('pet_sad.png', 1000);
            }
        }
    } else {
        // Во время сна здоровье и счастье восстанавливаются
        if (petData.health < 100) {
            petData.health = Math.min(100, petData.health + 10);
        }
    }

    // Рамки для шкал, чтобы они не уходили в минус или выше 100
    if (petData.food < 0) petData.food = 0;
    if (petData.water < 0) petData.water = 0;
    if (petData.health < 0) petData.health = 0;

    updateUI();
    updateNightHint();
    autoSaveState();
}

function updateNightHint() {
    const isNightTime = (
        gameHours < 7 ||
        gameHours > 22 ||
        (gameHours === 22 && gameMinutes > 0)
    );

    if (!isNightTime) {
        nightHint.classList.add('hidden');
        return;
    }

    const warnings = [];
    if (petData.food < 40) warnings.push('Поесть нужно');
    if (petData.water < 40) warnings.push('Попить нужно');

    if (warnings.length > 0) {
        nightHint.innerText = warnings.join(' и ');
        nightHint.classList.remove('hidden');
    } else {
        nightHint.classList.add('hidden');
    }
}

// Функция для временной смены полноэкранной картинки действия
function setTempImage(src, time = 2000, allowInKitchen = false) {
    const isNightTime = (
        gameHours < 9 ||
        gameHours > 22 ||
        (gameHours === 22 && gameMinutes > 0)
    );

    if (petData.isSleeping || isNightTime || (kitchenOpen && !allowInKitchen)) return;

    actionImageActive = true;
    clearTimeout(actionImageTimer);
    roomBg.src = src;

    actionImageTimer = setTimeout(() => {
        actionImageActive = false;
        updateRoomBackground();
    }, time);
}

function updateRoomBackground() {
    if (!actionImageActive) {
        roomBg.src = kitchenOpen ? kitchenBg : baseBg;
    }
}

function openGames() {
    gamesScreen.classList.remove('hidden');
    spaceGameScreen.classList.add('hidden');
    document.getElementById('games-panel').classList.remove('hidden');
}

function closeGames() {
    gamesScreen.classList.add('hidden');
    exitSpaceGame();
    document.getElementById('games-panel').classList.remove('hidden');
}

function openSpaceGame() {
    inSpaceGame = true;
    gamesScreen.classList.remove('hidden');
    document.getElementById('games-panel').classList.add('hidden');
    spaceGameScreen.classList.remove('hidden');
    initSpaceGame();
}

function exitSpaceGame() {
    inSpaceGame = false;
    spaceGameScreen.classList.add('hidden');
    gamesScreen.classList.add('hidden');
    document.getElementById('games-panel').classList.remove('hidden');
    spaceHitCount.innerText = '0';
    spaceKeys = {};
    if (spaceGameState && spaceGameState.ctx) {
        spaceGameState.ctx.clearRect(0, 0, spaceGameState.width, spaceGameState.height);
    }
    spaceGameState = null;
    if (spaceGameAnimation) {
        cancelAnimationFrame(spaceGameAnimation);
        spaceGameAnimation = null;
    }
    window.removeEventListener('keydown', handleSpaceKeyDown);
    window.removeEventListener('keyup', handleSpaceKeyUp);
}

function addCoins(amount) {
    coins = Math.max(0, coins + amount);
    coinCount.innerText = coins;
}

function createUfoWave(width, height) {
    const positions = [30, 90, 150, 210, 270, 330];
    const shuffled = positions.sort(() => Math.random() - 0.5);
    const minY = 20;
    const maxY = Math.min(height * 0.55, height - 60);
    return [
        { x: shuffled[0], y: Math.random() * (maxY - minY) + minY, hits: 0, health: 2 },
        { x: shuffled[1], y: Math.random() * (maxY - minY) + minY, hits: 0, health: 2 },
        { x: shuffled[2], y: Math.random() * (maxY - minY) + minY, hits: 0, health: 2 }
    ];
}

function initSpaceGame() {
    const ctx = spaceGameCanvas.getContext('2d');
    const width = spaceGameCanvas.width;
    const height = spaceGameCanvas.height;

    const starCount = 60;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
        stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: Math.random() * 0.4 + 0.2 });
    }

    spaceGameState = {
        ctx,
        width,
        height,
        ship: { x: width / 2 - 12, y: height - 36, w: 24, h: 24, speed: 3, autoDown: 0.25, boostUp: 1.2, downSpeed: 1.2 },
        bullets: [],
        ufos: createUfoWave(width, height),
        stars,
        score: 0,
        lastRender: null,
        respawnTimer: null
    };

    window.addEventListener('keydown', handleSpaceKeyDown);
    window.addEventListener('keyup', handleSpaceKeyUp);
    drawSpaceGame();
}

function drawSpaceGame() {
    if (!inSpaceGame || !spaceGameState) return;
    const { ctx, width, height, ship, bullets, ufos, stars } = spaceGameState;

    // Фон с звёздами
    ctx.fillStyle = '#050817';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
        }
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    updateSpaceGame();

    // Нарисовать корабль
    ctx.fillStyle = '#7fffd4';
    ctx.fillRect(ship.x + 8, ship.y, 8, 6);
    ctx.fillRect(ship.x + 4, ship.y + 6, 16, 8);
    ctx.fillStyle = '#00bfa5';
    ctx.fillRect(ship.x + 10, ship.y + 8, 4, 6);

    // Нарисовать пули
    ctx.fillStyle = '#ffeb3b';
    bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, 4, 10);
    });

    // Нарисовать НЛО
    ufos.forEach((ufo) => {
        const body = ufo.health === 2 ? '#ff4d4d' : '#ffeb3b';
        ctx.fillStyle = body;
        ctx.fillRect(ufo.x, ufo.y, 28, 12);
        ctx.fillStyle = '#000';
        ctx.fillRect(ufo.x + 6, ufo.y + 4, 16, 4);
        ctx.fillStyle = '#7fffd4';
        ctx.fillRect(ufo.x + 4, ufo.y + 2, 4, 2);
        ctx.fillRect(ufo.x + 20, ufo.y + 2, 4, 2);
    });

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`Монет: ${coins}`, 10, 14);
    ctx.fillText(`НЛО осталось: ${spaceGameState.ufos.length}`, 10, 26);

    if (inSpaceGame && spaceGameState) {
        spaceGameAnimation = requestAnimationFrame(drawSpaceGame);
    }
}

function fireBullet() {
    if (!inSpaceGame || !spaceGameState) return;
    const state = spaceGameState;
    state.bullets.push({ x: state.ship.x + 11, y: state.ship.y - 10, speed: 6 });
}

function updateSpaceGame() {
    const state = spaceGameState;
    const { ship, bullets, ufos, width, height } = state;

    if (spaceKeys.ArrowLeft) {
        ship.x = Math.max(0, ship.x - ship.speed);
    }
    if (spaceKeys.ArrowRight) {
        ship.x = Math.min(width - ship.w - 2, ship.x + ship.speed);
    }
    if (spaceKeys.ArrowUp) {
        ship.y = Math.max(0, ship.y - ship.boostUp);
    } else if (spaceKeys.ArrowDown) {
        ship.y = Math.min(height - ship.h - 2, ship.y + ship.downSpeed);
    } else {
        ship.y = Math.min(height - ship.h - 2, ship.y + ship.autoDown);
    }

    state.bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < -10) {
            state.bullets.splice(index, 1);
            return;
        }

        ufos.forEach((ufo, ufoIndex) => {
            if (
                bullet.x < ufo.x + 28 &&
                bullet.x + 4 > ufo.x &&
                bullet.y < ufo.y + 12 &&
                bullet.y + 10 > ufo.y
            ) {
                ufo.health -= 1;
                state.bullets.splice(index, 1);
                if (ufo.health <= 0) {
                    state.ufos.splice(ufoIndex, 1);
                    addCoins(1);
                }
            }
        });
    });

    state.ufos.forEach((ufo) => {
        ufo.x += Math.cos(Date.now() / 400 + ufo.y) * 0.4;
        ufo.y += Math.sin(Date.now() / 450 + ufo.x) * 0.3;
        if (ufo.y < 10) ufo.y = 10;
        if (ufo.y > height / 2) ufo.y = height / 2;
        if (ufo.x < 0) ufo.x = 0;
        if (ufo.x > width - 28) ufo.x = width - 28;
    });

    state.ufos.forEach((ufo) => {
        if (
            ship.x < ufo.x + 28 &&
            ship.x + ship.w > ufo.x &&
            ship.y < ufo.y + 12 &&
            ship.y + ship.h > ufo.y
        ) {
            handleSpaceGameOver();
        }
    });

    if (state.ufos.length === 0 && !state.respawnTimer) {
        state.respawnTimer = setTimeout(() => {
            state.ufos = createUfoWave(width, height);
            state.respawnTimer = null;
        }, 1200);
    }

    spaceHitCount.innerText = state.ufos.length;
}

function handleSpaceKeyDown(event) {
    if (!inSpaceGame) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
        event.preventDefault();
    }
    if (event.code === 'Space') {
        fireBullet();
    }
    spaceKeys[event.code] = true;
}

function handleSpaceKeyUp(event) {
    if (!inSpaceGame) return;
    spaceKeys[event.code] = false;
}

function handleTouchControl(direction) {
    if (!inSpaceGame || !spaceGameState) return;
    if (direction === 'left') {
        spaceKeys.ArrowLeft = true;
        setTimeout(() => { spaceKeys.ArrowLeft = false; }, 120);
    }
    if (direction === 'right') {
        spaceKeys.ArrowRight = true;
        setTimeout(() => { spaceKeys.ArrowRight = false; }, 120);
    }
    if (direction === 'down') {
        spaceKeys.ArrowDown = true;
        setTimeout(() => { spaceKeys.ArrowDown = false; }, 120);
    }
    if (direction === 'up') {
        spaceKeys.ArrowUp = true;
        setTimeout(() => { spaceKeys.ArrowUp = false; }, 120);
    }
}

function handleSpaceGameOver() {
    if (!inSpaceGame) return;
    alert('Игра окончена! Вы столкнулись с НЛО.');
    exitSpaceGame();
}

function openKitchen() {
    kitchenOpen = true;
    btnKitchen.classList.add('hidden');
    btnGames.classList.add('hidden');
    btnBackKitchen.classList.remove('hidden');
    btnEat.classList.remove('hidden');
    btnDrink.classList.remove('hidden');
    btnShop.classList.remove('hidden');
    btnSleep.classList.add('hidden');
    btnMsg.classList.add('hidden');
    if (btnSave) {
        btnSave.classList.add('hidden');
    }
    document.getElementById('days-line').classList.add('hidden');
    document.getElementById('kitchen-inventory').classList.remove('hidden');
    document.getElementById('kitchen-message').classList.add('hidden');
    roomBg.src = kitchenBg;
    updateInventoryDisplay();
}

function closeKitchen() {
    kitchenOpen = false;
    btnKitchen.classList.remove('hidden');
    btnGames.classList.remove('hidden');
    btnBackKitchen.classList.add('hidden');
    btnEat.classList.add('hidden');
    btnDrink.classList.add('hidden');
    btnShop.classList.add('hidden');
    btnSleep.classList.remove('hidden');
    btnMsg.classList.remove('hidden');
    if (btnSave) {
        btnSave.classList.remove('hidden');
    }
    document.getElementById('days-line').classList.remove('hidden');
    document.getElementById('kitchen-inventory').classList.add('hidden');
    document.getElementById('kitchen-message').classList.add('hidden');
    hideShopScreens();
    updateRoomBackground();
}

// Обновление полосок и текста статистики на экране
function updateUI() {
    barFood.style.width = petData.food + '%';
    barWater.style.width = petData.water + '%';
    barHealth.style.width = petData.health + '%';
    document.getElementById('value-food').innerText = petData.food;
    document.getElementById('value-water').innerText = petData.water;
    document.getElementById('value-health').innerText = petData.health;
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
    const messageBox = document.getElementById('kitchen-message');
    messageBox.innerText = text;
    messageBox.classList.remove('hidden');
    if (kitchenMessageTimer) {
        clearTimeout(kitchenMessageTimer);
    }
    kitchenMessageTimer = setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 1800);
}

function showShopScreen(screen) {
    hideShopScreens();
    screen.classList.remove('hidden');
}

function hideShopScreens() {
    shopIntroScreen.classList.add('hidden');
    shopMainScreen.classList.add('hidden');
    shopItemsScreen.classList.add('hidden');
}

function openShopIntro() {
    showShopScreen(shopIntroScreen);
}

function openShopMain() {
    showShopScreen(shopMainScreen);
    shopMainScreen.querySelector('#shop-dialog-text').innerText = 'Что купим?';
}

function openShopItems() {
    showShopScreen(shopItemsScreen);
    updateInventoryDisplay();
}

function buyItem(type) {
    if (coins <= 0) {
        if (type === 'food') {
            shopStatusText.innerText = 'Не хватает монет для еды';
        } else {
            shopStatusText.innerText = 'Не хватает монет для воды';
        }
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
        setTempImage('pet_eat.png', 2000, true);
        updateUI();
        saveData();
        return true;
    }

    if (type === 'water' && inventory.water > 0) {
        inventory.water -= 1;
        petData.water = Math.min(100, petData.water + 30);
        setTempImage('pet_drink.png', 2000, true);
        updateUI();
        saveData();
        return true;
    }

    return false;
}

function initNotifications() {
    if (!('Notification' in window)) {
        return;
    }

    if (Notification.permission === 'default') {
        Notification.requestPermission().then(setupReminder);
    } else {
        setupReminder(Notification.permission);
    }
}

function setupReminder(permission) {
    if (permission !== 'granted') {
        return;
    }

    sendReminder();
    reminderTimer = setInterval(sendReminder, 60000);
}

function sendReminder() {
    const message = 'Не забывай меня';

    if (Notification.permission === 'granted') {
        new Notification('Тамагочи', {
            body: message,
            icon: 'icon.png'
        });
        return;
    }

    alert(message);
}

// --- КНОПКИ ДЕЙСТВИЙ (ОБРАБОТЧИКИ) ---

// Кормление
btnEat.addEventListener('click', () => {
    if (petData.isSleeping) return;
    if (inventory.food > 0) {
        useInventoryItem('food');
    } else {
        showKitchenMessage('Нет еды');
    }
    updateUI();
});

// Питьё
btnDrink.addEventListener('click', () => {
    if (petData.isSleeping) return;
    if (inventory.water > 0) {
        useInventoryItem('water');
    } else {
        showKitchenMessage('Нет воды');
    }
    updateUI();
});

// Открыть кухню
btnKitchen.addEventListener('click', () => {
    if (petData.isSleeping) return;
    openKitchen();
});

// Открыть игры
btnGames.addEventListener('click', () => {
    if (petData.isSleeping) return;
    openGames();
});

btnShop.addEventListener('click', () => {
    if (petData.isSleeping) return;
    openShopIntro();
});

btnEnterShop.addEventListener('click', () => {
    openShopMain();
});

btnViewShopItems.addEventListener('click', () => {
    openShopItems();
});

btnReturnHome.addEventListener('click', () => {
    closeKitchen();
});

btnBuyFood.addEventListener('click', () => {
    buyItem('food');
});

btnBuyWater.addEventListener('click', () => {
    buyItem('water');
});

btnShopBackHome.addEventListener('click', () => {
    closeKitchen();
});

// Вернуться из кухни
btnBackKitchen.addEventListener('click', () => {
    closeKitchen();
});

// Закрыть игры
btnCloseGames.addEventListener('click', () => {
    closeGames();
});

btnSpaceBattle.addEventListener('click', () => {
    openSpaceGame();
});

btnMoveLeft.addEventListener('click', () => {
    handleTouchControl('left');
});

btnMoveRight.addEventListener('click', () => {
    handleTouchControl('right');
});

btnMoveDown.addEventListener('click', () => {
    handleTouchControl('down');
});

btnMoveUp.addEventListener('click', () => {
    handleTouchControl('up');
});

btnFire.addEventListener('click', () => {
    fireBullet();
});

btnExitSpace.addEventListener('click', () => {
    exitSpaceGame();
});

// Кнопка Сна
btnSleep.addEventListener('click', () => {
    const isNightTime = (
        gameHours < 7 ||
        gameHours > 22 ||
        (gameHours === 22 && gameMinutes > 0)
    );
    
    // Лечь спать можно только ночью и если тамагочи ещё не спит
    if (isNightTime && !petData.isSleeping) {
        petData.isSleeping = true;
        actionImageActive = true;
        btnSleep.classList.add('disabled');
        roomBg.src = "pet_sleep.png"; // Полный фон со спящим питомцем
        updateUI();

        setTimeout(() => {
            wakeUp();
            actionImageActive = false;
            gameHours = 7;
            gameMinutes = 0;
            checkTimeOfDay();
            updateNightHint();
        }, 7000);
    }
});

// Пробуждение
function wakeUp() {
    petData.isSleeping = false;
    updateRoomBackground();
    updateUI();
}

// Открытие окна сообщений
btnMsg.addEventListener('click', () => {
    if (petData.isSleeping) return;
    dialogBox.classList.remove('hidden');
    btnSayLove.classList.remove('hidden'); // Показываем кнопку отправки текста
    dialogText.innerText = "Хочешь что-то сказать?";
});

// Кнопка отправки "Я люблю тебя"
btnSayLove.addEventListener('click', () => {
    petData.health = 100; // Восстанавливаем шкалу счастья/настроения на максимум
    
    // Включаем твою картинку с восклицательным знаком на 4 секунды
    setTempImage("pet_love.png", 4000); 
    
    // Меняем текст на ответный
    dialogText.innerText = "Я тебя тоже люблю💖";
    btnSayLove.classList.add('hidden'); // Прячем кнопку, чтобы нельзя было нажать повторно
    updateUI();
});

// Закрытие окна диалога
btnCloseDialog.addEventListener('click', () => {
    dialogBox.classList.add('hidden');
});

// --- СОХРАНЕНИЕ И ЗАГРУЗКА ИЗ ПАМЯТИ ---
function autoSaveState() {
    localStorage.setItem('tamagotchiData', JSON.stringify({
        petData,
        inventory,
        coins,
        gameHours,
        gameMinutes
    }));
}

function saveData() {
    autoSaveState();
}

function loadData() {
    const saved = localStorage.getItem('tamagotchiData');
    if (saved) {
        const parsed = JSON.parse(saved);
        petData = {
            food: 100,
            water: 100,
            health: 100,
            days: 0,
            isSleeping: false,
            ...(parsed.petData || {})
        };
        inventory = {
            food: 0,
            water: 0,
            ...(parsed.inventory || {})
        };
        coins = Number.isFinite(parsed.coins) ? parsed.coins : coins;
        gameHours = Number.isFinite(parsed.gameHours) ? parsed.gameHours : gameHours;
        gameMinutes = Number.isFinite(parsed.gameMinutes) ? parsed.gameMinutes : gameMinutes;
        lastTimeMinutes = gameHours * 60 + gameMinutes;
    }
}

if (btnSave) {
    btnSave.remove();
}

// Запуск кода при старте страницы
init();
