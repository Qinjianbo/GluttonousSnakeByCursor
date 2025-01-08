class Snake {
    constructor() {
        this.reset();
    }

    reset(width, height) {
        // 确保蛇的初始位置不会太靠近边界
        const margin = 5;
        const x = Math.floor(Math.random() * (width - 2 * margin)) + margin;
        const y = Math.floor(Math.random() * (height - 2 * margin)) + margin;
        
        this.position = [{ x, y }];
        
        // 随机选择初始方向
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.nextDirection = this.direction;
    }

    move() {
        this.direction = this.nextDirection;
        const head = { ...this.position[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.position.unshift(head);
        return this.position.pop();
    }

    grow() {
        const tail = this.position[this.position.length - 1];
        this.position.push({ ...tail });
    }

    checkCollision(width, height) {
        const head = this.position[0];
        if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
            return true;
        }

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
        this.position = { x: 0, y: 0 };
        this.type = 'red';
        this.types = {
            'red': 1,
            'yellow': 2,
            'blue': 3
        };
        this.images = {
            'red': new Image(),
            'yellow': new Image(),
            'blue': new Image()
        };
        // 设置图片源
        this.images.red.src = 'images/apple.png';
        this.images.yellow.src = 'images/banana.png';
        this.images.blue.src = 'images/blueberry.png';
    }

    generate(width, height, snake) {
        // 确保食物生成在画布内部，留出一定边距
        const margin = 1;
        do {
            this.position.x = Math.floor(Math.random() * (width - 2 * margin)) + margin;
            this.position.y = Math.floor(Math.random() * (height - 2 * margin)) + margin;
        } while (this.checkCollisionWithSnake(snake));

        const random = Math.random();
        if (random < 0.5) this.type = 'red';
        else if (random < 0.8) this.type = 'yellow';
        else this.type = 'blue';
    }

    checkCollisionWithSnake(snake) {
        return snake.position.some(segment => 
            segment.x === this.position.x && segment.y === this.position.y
        );
    }
}

class Game {
    constructor() {
        this.initGame();
        this.generateSnakeTexture();
        this.setupEventListeners();
        this.generateQRCode();
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
        
        // 蛇身主体颜色
        bodyCtx.fillStyle = '#4CAF50';
        bodyCtx.fillRect(0, 0, this.gridSize, this.gridSize);
        
        // 绘制鳞片纹理
        bodyCtx.fillStyle = '#388E3C';
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
        
        // 绘制蛇头（椭圆形）
        headCtx.fillStyle = '#66BB6A';
        headCtx.beginPath();
        headCtx.ellipse(
            this.gridSize/2,
            this.gridSize/2,
            this.gridSize/2,
            this.gridSize/2 - 2,
            0,
            0,
            Math.PI * 2
        );
        headCtx.fill();
        
        // 添加渐变效果使头部更立体
        const gradient = headCtx.createRadialGradient(
            this.gridSize/2, this.gridSize/2 - 2, 0,
            this.gridSize/2, this.gridSize/2, this.gridSize/2
        );
        gradient.addColorStop(0, '#7CB342');
        gradient.addColorStop(1, '#558B2F');
        headCtx.fillStyle = gradient;
        headCtx.fill();
        
        // 绘制眼睛（稍微改变位置和大小）
        headCtx.fillStyle = 'white';
        const eyeSize = this.gridSize / 5;
        headCtx.beginPath();
        headCtx.arc(this.gridSize/3, this.gridSize/2 - 2, eyeSize, 0, Math.PI * 2);
        headCtx.arc(this.gridSize*2/3, this.gridSize/2 - 2, eyeSize, 0, Math.PI * 2);
        headCtx.fill();
        
        // 绘制瞳孔（添加高光效果）
        headCtx.fillStyle = 'black';
        const pupilSize = eyeSize / 2;
        headCtx.beginPath();
        headCtx.arc(this.gridSize/3, this.gridSize/2 - 2, pupilSize, 0, Math.PI * 2);
        headCtx.arc(this.gridSize*2/3, this.gridSize/2 - 2, pupilSize, 0, Math.PI * 2);
        headCtx.fill();
        
        // 添加眼睛高光
        headCtx.fillStyle = 'white';
        const highlightSize = pupilSize / 3;
        headCtx.beginPath();
        headCtx.arc(this.gridSize/3 - pupilSize/2, this.gridSize/2 - 3, highlightSize, 0, Math.PI * 2);
        headCtx.arc(this.gridSize*2/3 - pupilSize/2, this.gridSize/2 - 3, highlightSize, 0, Math.PI * 2);
        headCtx.fill();
        
        // 绘制舌头（更细长的分叉舌头）
        headCtx.fillStyle = '#FF1744';
        headCtx.beginPath();
        const tongueStart = this.gridSize * 0.7;
        const tongueLength = this.gridSize * 0.4;
        const tongueWidth = this.gridSize * 0.1;
        
        // 舌头的中心线
        headCtx.moveTo(this.gridSize/2, tongueStart);
        // 右分叉
        headCtx.quadraticCurveTo(
            this.gridSize/2 + tongueWidth,
            tongueStart + tongueLength * 0.6,
            this.gridSize/2 + tongueWidth * 2,
            tongueStart + tongueLength
        );
        // 回到中心
        headCtx.quadraticCurveTo(
            this.gridSize/2 + tongueWidth,
            tongueStart + tongueLength * 0.7,
            this.gridSize/2,
            tongueStart + tongueLength * 0.5
        );
        // 左分叉
        headCtx.quadraticCurveTo(
            this.gridSize/2 - tongueWidth,
            tongueStart + tongueLength * 0.7,
            this.gridSize/2 - tongueWidth * 2,
            tongueStart + tongueLength
        );
        // 回到起点
        headCtx.quadraticCurveTo(
            this.gridSize/2 - tongueWidth,
            tongueStart + tongueLength * 0.6,
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
        this.canvas = document.getElementById('gameCanvas');
        const randomWidth = 400;
        const randomHeight = 400;
        this.canvas.width = randomWidth;
        this.canvas.height = randomHeight;
        
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.width = this.canvas.width / this.gridSize;
        this.height = this.canvas.height / this.gridSize;
        
        this.snake = new Snake();
        this.snake.reset(this.width, this.height);
        
        this.food = new Food();
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;

        document.getElementById('score').textContent = '0';
        this.food.generate(this.width, this.height, this.snake);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.isPaused && e.key !== 'Escape') return;
            
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

        this.canvas.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });

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