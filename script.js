let timeLeft = 120; // 2分钟 = 120秒
let timer;

function startGame() {
    // 现有的初始化代码...
    
    // 添加计时器初始化
    timeLeft = 120;
    updateTimer();
    timer = setInterval(updateTimer, 1000);
}

// 添加新的计时器更新函数
function updateTimer() {
    timeLeft--;
    document.getElementById('timer').textContent = `剩余时间: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
        clearInterval(timer);
        endGame();
    }
}

function endGame() {
    clearInterval(timer); // 确保停止计时器
    // 现有的结束游戏代码...
    alert(`游戏结束！你的得分是: ${score}`);
} 