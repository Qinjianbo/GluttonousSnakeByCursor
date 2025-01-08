class Snake {
    constructor() {
        this.reset();
    }

    reset(width, height) {
        // 确保蛇的初始位置不会太靠近边界，留出margin个格子的安全距离
        const margin = 5;
        const x = Math.floor(Math.random() * (width - 2 * margin)) + margin;
        const y = Math.floor(Math.random() * (height - 2 * margin)) + margin;
        
        // 初始化蛇的位置，一开始只有一个头部
        this.position = [{ x, y }];
        
        // 随机选择初始方向
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        // nextDirection用于存储下一步的移动方向，防止在一次更新周期内多次改变方向
        this.nextDirection = this.direction;
    }

    move() {
        // 更新当前方向为计划的下一个方向
        this.direction = this.nextDirection;
        // 复制蛇头的位置信息
        const head = { ...this.position[0] };

        // 根据方向更新蛇头的新位置
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // 在数组开头添加新的头部位置
        this.position.unshift(head);
        // 移除尾部，实现移动效果，并返回被移除的尾部位置
        return this.position.pop();
    }

    grow() {
        // 获取当前尾部位置
        const tail = this.position[this.position.length - 1];
        // 通过复制尾部位置来增加蛇的长度
        this.position.push({ ...tail });
    }

    checkCollision(width, height) {
        const head = this.position[0];
        // 检查是否撞到边界
        if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
            return true;
        }

        // 检查是否撞到自己的身体
        for (let i = 1; i < this.position.length; i++) {
            if (head.x === this.position[i].x && head.y === this.position[i].y) {
                return true;
            }
        }
        return false;
    }
}

class Food {
    constructor() {
        // 食物的位置坐标
        this.position = { x: 0, y: 0 };
        // 食物类型，默认为红色
        this.type = 'red';
        // 不同类型食物的分数
        this.types = {
            'red': 1,    // 普通食物，1分
            'yellow': 2, // 稀有食物，2分
            'blue': 3    // 罕见食物，3分
        };
        // 初始化食物图片对象
        this.images = {
            'red': new Image(),
            'yellow': new Image(),
            'blue': new Image()
        };
        // 设置各种食物的图片源
        this.images.red.src = 'images/apple.png';      // 苹果
        this.images.yellow.src = 'images/banana.png';  // 香蕉
        this.images.blue.src = 'images/blueberry.png'; // 蓝莓
    }

    generate(width, height, snake) {
        // 确保食物生成在画布内部，留出一定边距
        const margin = 1;
        do {
            this.position.x = Math.floor(Math.random() * (width - 2 * margin)) + margin;
            this.position.y = Math.floor(Math.random() * (height - 2 * margin)) + margin;
        } while (this.checkCollisionWithSnake(snake)); // 确保食物不会生成在蛇身上

        // 随机决定食物类型，50%红色，30%黄色，20%蓝色
        const random = Math.random();
        if (random < 0.5) this.type = 'red';
        else if (random < 0.8) this.type = 'yellow';
        else this.type = 'blue';
    }

    checkCollisionWithSnake(snake) {
        // 检查食物是否与蛇的任何部分重叠
        return snake.position.some(segment => 
            segment.x === this.position.x && segment.y === this.position.y
        );
    }
}

class Game {
    constructor() {
        this.initGame();           // 初始化游戏
        this.generateSnakeTexture(); // 生成蛇的纹理
        this.setupEventListeners(); // 设置事件监听
        this.generateQRCode();      // 生成二维码
    }

    generateQRCode() {
        // 等待一小段时间确保库加载完成
        setTimeout(() => {
            try {
                // 确保 QRCode 已定义
                if (typeof QRCode === 'undefined') {
                    console.error('QRCode library not loaded');
                    return;
                }

                // 获取当前页面URL
                const currentUrl = window.location.href;
                
                // 清除可能存在的旧二维码
                const qrcodeElement = document.getElementById("qrcode");
                if (!qrcodeElement) {
                    console.error('QR code element not found');
                    return;
                }
                qrcodeElement.innerHTML = '';
                
                // 创建QR码
                new QRCode(qrcodeElement, {
                    text: currentUrl,
                    width: 128,
                    height: 128,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            } catch (error) {
                console.error('Error generating QR code:', error);
            }
        }, 500); // 等待500毫秒确保库加载完成
    }

    generateSnakeTexture() {
        // 创建蛇身纹理
        const bodyCanvas = document.createElement('canvas');
        bodyCanvas.width = this.gridSize;
        bodyCanvas.height = this.gridSize;
        const bodyCtx = bodyCanvas.getContext('2d');
        
        // 蛇身主体颜色 - 使用更自然的绿色
        bodyCtx.fillStyle = '#2E7D32';  // 深绿色作为基础色
        bodyCtx.fillRect(0, 0, this.gridSize, this.gridSize);
        
        // 绘制鳞片纹理 - 使用略深的色调
        bodyCtx.fillStyle = '#1B5E20';  // 更深的绿色作为鳞片
        const scaleSize = this.gridSize / 4;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                bodyCtx.beginPath();
                bodyCtx.ellipse(
                    i * this.gridSize/2 + scaleSize,
                    j * this.gridSize/2 + scaleSize,
                    scaleSize/2,
                    scaleSize,
                    0,
                    0,
                    Math.PI * 2
                );
                bodyCtx.fill();
            }
        }
        
        // 创建蛇头纹理
        const headCanvas = document.createElement('canvas');
        headCanvas.width = this.gridSize;
        headCanvas.height = this.gridSize;
        const headCtx = headCanvas.getContext('2d');
        
        // 绘制蛇头（更尖锐的椭圆形）
        headCtx.fillStyle = '#388E3C';
        headCtx.beginPath();
        // 使用贝塞尔曲线绘制更尖锐的头部形状
        const x = this.gridSize/2;
        const y = this.gridSize/2;
        const width = this.gridSize/2;
        const height = this.gridSize/2 - 2;
        
        headCtx.moveTo(x - width, y);
        // 左下部分
        headCtx.quadraticCurveTo(x - width/2, y + height, x, y + height);
        // 右下部分
        headCtx.quadraticCurveTo(x + width/2, y + height, x + width, y);
        // 右上部分（更尖锐）
        headCtx.quadraticCurveTo(x + width/1.5, y - height/1.2, x, y - height);
        // 左上部分（更尖锐）
        headCtx.quadraticCurveTo(x - width/1.5, y - height/1.2, x - width, y);
        headCtx.closePath();
        headCtx.fill();
        
        // 添加更强烈的渐变效果
        const gradient = headCtx.createRadialGradient(
            this.gridSize/2, this.gridSize/2 - 2, 0,
            this.gridSize/2, this.gridSize/2, this.gridSize/2
        );
        gradient.addColorStop(0, '#43A047');
        gradient.addColorStop(0.4, '#388E3C');
        gradient.addColorStop(1, '#1B5E20');  // 更深的边缘色
        headCtx.fillStyle = gradient;
        headCtx.fill();
        
        // 绘制更凶狠的眼睛（细长的形状）
        headCtx.fillStyle = '#FFFFFF';
        const eyeWidth = this.gridSize / 4;
        const eyeHeight = this.gridSize / 6;
        
        // 左眼
        headCtx.beginPath();
        headCtx.ellipse(
            this.gridSize/3, 
            this.gridSize/2 - 2,
            eyeWidth/2,
            eyeHeight/2,
            -Math.PI/6,  // 稍微倾斜
            0,
            Math.PI * 2
        );
        // 右眼
        headCtx.ellipse(
            this.gridSize*2/3,
            this.gridSize/2 - 2,
            eyeWidth/2,
            eyeHeight/2,
            Math.PI/6,  // 稍微倾斜
            0,
            Math.PI * 2
        );
        headCtx.fill();
        
        // 绘制竖瞳
        headCtx.fillStyle = '#000000';
        const pupilWidth = eyeWidth / 6;
        const pupilHeight = eyeHeight * 1.2;
        
        // 左瞳孔
        headCtx.beginPath();
        headCtx.ellipse(
            this.gridSize/3,
            this.gridSize/2 - 2,
            pupilWidth,
            pupilHeight,
            0,
            0,
            Math.PI * 2
        );
        // 右瞳孔
        headCtx.ellipse(
            this.gridSize*2/3,
            this.gridSize/2 - 2,
            pupilWidth,
            pupilHeight,
            0,
            0,
            Math.PI * 2
        );
        headCtx.fill();
        
        // 添加眉毛（显得更具攻击性）
        headCtx.strokeStyle = '#1B5E20';
        headCtx.lineWidth = 1;
        
        // 左眉毛
        headCtx.beginPath();
        headCtx.moveTo(this.gridSize/4, this.gridSize/3);
        headCtx.quadraticCurveTo(
            this.gridSize/3,
            this.gridSize/4,
            this.gridSize/2.5,
            this.gridSize/3
        );
        headCtx.stroke();
        
        // 右眉毛
        headCtx.beginPath();
        headCtx.moveTo(this.gridSize*3/4, this.gridSize/3);
        headCtx.quadraticCurveTo(
            this.gridSize*2/3,
            this.gridSize/4,
            this.gridSize*0.6,
            this.gridSize/3
        );
        headCtx.stroke();
        
        // 绘制更锐利的舌头
        headCtx.fillStyle = '#D32F2F';  // 更深的红色
        headCtx.beginPath();
        const tongueStart = this.gridSize * 0.7;
        const tongueLength = this.gridSize * 0.5;  // 稍微加长
        const tongueWidth = this.gridSize * 0.08;  // 稍微变细
        
        // 绘制更尖锐的分叉舌头
        headCtx.moveTo(this.gridSize/2, tongueStart);
        // 右分叉（更尖锐）
        headCtx.quadraticCurveTo(
            this.gridSize/2 + tongueWidth,
            tongueStart + tongueLength * 0.5,
            this.gridSize/2 + tongueWidth * 3,
            tongueStart + tongueLength
        );
        // 回到中心
        headCtx.quadraticCurveTo(
            this.gridSize/2 + tongueWidth,
            tongueStart + tongueLength * 0.6,
            this.gridSize/2,
            tongueStart + tongueLength * 0.4
        );
        // 左分叉（更尖锐）
        headCtx.quadraticCurveTo(
            this.gridSize/2 - tongueWidth,
            tongueStart + tongueLength * 0.6,
            this.gridSize/2 - tongueWidth * 3,
            tongueStart + tongueLength
        );
        // 回到起点
        headCtx.quadraticCurveTo(
            this.gridSize/2 - tongueWidth,
            tongueStart + tongueLength * 0.5,
            this.gridSize/2,
            tongueStart
        );
        headCtx.fill();

        // 创建并存储纹理
        this.snakeBodyTexture = new Image();
        this.snakeHeadTexture = new Image();
        
        // 设置加载完成标志
        let loadedCount = 0;
        const onLoad = () => {
            loadedCount++;
            if (loadedCount === 2) {
                this.snakeTextureLoaded = true;
            }
        };
        
        this.snakeBodyTexture.onload = onLoad;
        this.snakeHeadTexture.onload = onLoad;
        
        this.snakeBodyTexture.src = bodyCanvas.toDataURL();
        this.snakeHeadTexture.src = headCanvas.toDataURL();
    }

    initGame() {
        // 获取画布元素并设置尺寸
        this.canvas = document.getElementById('gameCanvas');
        const randomWidth = 400;
        const randomHeight = 400;
        this.canvas.width = randomWidth;
        this.canvas.height = randomHeight;
        
        // 获取绘图上下文
        this.ctx = this.canvas.getContext('2d');
        // 设置网格大小和游戏区域的网格数量
        this.gridSize = 20;
        this.width = this.canvas.width / this.gridSize;
        this.height = this.canvas.height / this.gridSize;
        
        // 初始化蛇和食物
        this.snake = new Snake();
        this.snake.reset(this.width, this.height);
        this.food = new Food();
        
        // 初始化游戏状态
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;

        // 重置显示的分数
        document.getElementById('score').textContent = '0';
        // 生成第一个食物
        this.food.generate(this.width, this.height, this.snake);
    }

    setupEventListeners() {
        // 监听键盘事件
        document.addEventListener('keydown', (e) => {
            // 如果游戏暂停，只响应ESC键
            if (this.isPaused && e.key !== 'Escape') return;
            
            // 处理方向键和ESC键
            switch (e.key) {
                case 'ArrowUp':
                    if (this.snake.direction !== 'down') this.snake.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    if (this.snake.direction !== 'up') this.snake.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.snake.direction !== 'right') this.snake.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    if (this.snake.direction !== 'left') this.snake.nextDirection = 'right';
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });

        // 点击画布暂停/继续游戏
        this.canvas.addEventListener('click', () => {
            this.togglePause();
        });

        // 重新开始按钮事件
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });

        // 开始游戏循环
        this.startGameLoop();
    }

    togglePause() {
        if (this.gameOver) return;
        
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.startGameLoop();
        }
        this.draw(); // 立即重绘以显示/隐藏暂停信息
    }

    restart() {
        this.initGame();
        this.isPaused = false;
        if (!this.gameLoopRunning) {
            this.startGameLoop();
        }
    }

    startGameLoop() {
        this.gameLoopRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.gameLoopRunning || this.isPaused) return;
        
        this.update();
        this.draw();
        setTimeout(() => requestAnimationFrame(() => this.gameLoop()), 100);
    }

    update() {
        if (this.gameOver || this.isPaused) {
            this.gameLoopRunning = false;
            return;
        }

        const tail = this.snake.move();
        
        if (this.snake.checkCollision(this.width, this.height)) {
            this.gameOver = true;
            return;
        }

        const head = this.snake.position[0];
        if (head.x === this.food.position.x && head.y === this.food.position.y) {
            this.score += this.food.types[this.food.type];
            document.getElementById('score').textContent = this.score;
            this.snake.grow();
            this.food.generate(this.width, this.height, this.snake);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制蛇
        this.snake.position.forEach((segment, index) => {
            if (this.snakeTextureLoaded) {
                let angle = 0;
                if (index === 0) {  // 蛇头 - 调整方向
                    switch(this.snake.direction) {
                        case 'up': angle = Math.PI; break;     // 向上时头朝上（180度）
                        case 'right': angle = -Math.PI/2; break; // 向右时头朝右（-90度）
                        case 'down': angle = 0; break;         // 向下时头朝下（0度）
                        case 'left': angle = Math.PI/2; break;  // 向左时头朝左（90度）
                    }
                } else {  // 蛇身 - 调整方向
                    const prev = this.snake.position[index - 1];
                    const curr = segment;
                    if (prev.x > curr.x) angle = Math.PI/2;      // 向左移动
                    else if (prev.x < curr.x) angle = -Math.PI/2; // 向右移动
                    else if (prev.y > curr.y) angle = Math.PI;    // 向上移动
                    else if (prev.y < curr.y) angle = 0;          // 向下移动
                }

                this.ctx.save();
                this.ctx.translate(
                    segment.x * this.gridSize + this.gridSize/2,
                    segment.y * this.gridSize + this.gridSize/2
                );
                this.ctx.rotate(angle);
                
                const texture = index === 0 ? this.snakeHeadTexture : this.snakeBodyTexture;
                this.ctx.drawImage(
                    texture,
                    -this.gridSize/2,
                    -this.gridSize/2,
                    this.gridSize,
                    this.gridSize
                );
                
                this.ctx.restore();
            }
        });

        // 绘制食物图片
        const foodImage = this.food.images[this.food.type];
        if (foodImage.complete) { // 确保图片已加载
            this.ctx.drawImage(
                foodImage,
                this.food.position.x * this.gridSize + 1, // 添加小偏移使图片居中
                this.food.position.y * this.gridSize + 1,
                this.gridSize - 2, // 稍微缩小以适应网格
                this.gridSize - 2
            );
        }

        // 绘制游戏状态文本
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'black';
        
        if (this.gameOver) {
            this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2);
        } else if (this.isPaused) {
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('点击继续', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
}

// 启动游戏
new Game(); 