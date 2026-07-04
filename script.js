// --- БАЗОВЫЕ ПЕРЕМЕННЫЕ И ДАННЫЕ ---
let petData = {
    food: 100,
    water: 100,
    health: 100,
    days: 0,
    isSleeping: false
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
const btnBackKitchen = document.getElementById('btn-back-kitchen');
const btnSave = document.getElementById('btn-save');

let reminderTimer = null;
let kitchenOpen = false;
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

    updateUI(); // 4. Сразу же отрисовываем полоски на экране!
}

// --- СИСТЕМА ИГРОВОГО ВРЕМЕНИ (Сутки за 10 минут) ---
function updateClock() {
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
        petData.food -= 4;
        petData.water -= 6;
        petData.health -= 2;
        
        // Если показатели критические, подставляем грустную картинку
        if (petData.food < 40 || petData.water < 40) {
            petData.health -= 3;
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
function setTempImage(src, time = 2000) {
    const isNightTime = (
        gameHours < 9 ||
        gameHours > 22 ||
        (gameHours === 22 && gameMinutes > 0)
    );

    if (petData.isSleeping || isNightTime || kitchenOpen) return;

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

function openKitchen() {
    kitchenOpen = true;
    btnKitchen.classList.add('hidden');
    btnBackKitchen.classList.remove('hidden');
    btnEat.classList.remove('hidden');
    btnDrink.classList.remove('hidden');
    btnSleep.classList.add('hidden');
    btnMsg.classList.add('hidden');
    roomBg.src = kitchenBg;
}

function closeKitchen() {
    kitchenOpen = false;
    btnKitchen.classList.remove('hidden');
    btnBackKitchen.classList.add('hidden');
    btnEat.classList.add('hidden');
    btnDrink.classList.add('hidden');
    btnSleep.classList.remove('hidden');
    btnMsg.classList.remove('hidden');
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
    petData.food = Math.min(100, petData.food + 20);
    setTempImage("pet_eat.png", 2000);
    updateUI();
});

// Питьё
btnDrink.addEventListener('click', () => {
    if (petData.isSleeping) return;
    petData.water = Math.min(100, petData.water + 20);
    setTempImage("pet_drink.png", 2000);
    updateUI();
});

// Открыть кухню
btnKitchen.addEventListener('click', () => {
    if (petData.isSleeping) return;
    openKitchen();
});

// Вернуться из кухни
btnBackKitchen.addEventListener('click', () => {
    closeKitchen();
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
        petData.days += 1;            // Плюс один прожитый день в статистику
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
function saveData() {
    localStorage.setItem('tamagotchiData', JSON.stringify(petData));
    alert("Игра успешно сохранена! 😊");
}

function loadData() {
    const saved = localStorage.getItem('tamagotchiData');
    if (saved) {
        petData = JSON.parse(saved);
    }
}

btnSave.addEventListener('click', saveData);

// Запуск кода при старте страницы
init();
