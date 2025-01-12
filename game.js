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

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        // 尝试初始化 WebGL
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (this.gl) {
            // WebGL 可用，初始化 WebGL
            this.type = 'webgl';
            this.initWebGL();
        } else {
            // WebGL 不可用，使用 Canvas 2D
            console.log('WebGL not supported, falling back to Canvas 2D');
            this.type = '2d';
            this.ctx = canvas.getContext('2d');
        }
    }

    initWebGL() {
        // WebGL 初始化代码
        this.initShaders();
        this.initBuffers();
        this.initTextures();
    }

    // 顶点着色器
    get vertexShaderSource() {
        return `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            uniform vec2 u_resolution;
            uniform vec2 u_translation;
            uniform float u_rotation;
            uniform vec2 u_scale;
            
            varying vec2 v_texCoord;
            
            void main() {
                vec2 scaledPosition = a_position * u_scale;
                float s = sin(u_rotation);
                float c = cos(u_rotation);
                mat2 rotation = mat2(c, -s, s, c);
                vec2 rotatedPosition = rotation * scaledPosition;
                vec2 position = rotatedPosition + u_translation;
                
                vec2 zeroToOne = position / u_resolution;
                vec2 zeroToTwo = zeroToOne * 2.0;
                vec2 clipSpace = zeroToTwo - 1.0;
                
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                v_texCoord = a_texCoord;
            }
        `;
    }

    // 片段着色器
    get fragmentShaderSource() {
        return `
            precision mediump float;
            
            uniform sampler2D u_image;
            uniform vec4 u_color;
            uniform bool u_useTexture;
            uniform float u_time;
            
            varying vec2 v_texCoord;
            
            void main() {
                if (u_useTexture) {
                    vec4 texColor = texture2D(u_image, v_texCoord);
                    // 添加霓虹效果
                    float glow = sin(u_time * 0.003) * 0.1 + 0.9;
                    gl_FragColor = texColor * vec4(glow, glow, 1.0, 1.0);
                } else {
                    gl_FragColor = u_color;
                }
            }
        `;
    }

    initShaders() {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize shader program');
            return;
        }

        this.gl.useProgram(this.program);

        // 获取着色器变量位置
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
        this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.translationLocation = this.gl.getUniformLocation(this.program, 'u_translation');
        this.rotationLocation = this.gl.getUniformLocation(this.program, 'u_rotation');
        this.scaleLocation = this.gl.getUniformLocation(this.program, 'u_scale');
        this.colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
        this.useTextureLocation = this.gl.getUniformLocation(this.program, 'u_useTexture');
        this.timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
    }

    initBuffers() {
        // 创建顶点缓冲区
        this.positionBuffer = this.gl.createBuffer();
        this.texCoordBuffer = this.gl.createBuffer();

        // 设置矩形顶点
        const positions = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,
        ]);

        // 设置纹理坐标
        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // 统一的绘制接口
    drawSprite(texture, x, y, width, height, rotation = 0) {
        if (this.type === 'webgl') {
            // WebGL 绘制
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            this.gl.enableVertexAttribArray(this.positionLocation);
            this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
            this.gl.enableVertexAttribArray(this.texCoordLocation);
            this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

            this.gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
            this.gl.uniform2f(this.translationLocation, x, y);
            this.gl.uniform1f(this.rotationLocation, rotation);
            this.gl.uniform2f(this.scaleLocation, width, height);
            this.gl.uniform1f(this.timeLocation, Date.now());

            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.uniform1i(this.useTextureLocation, 1);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        } else {
            // Canvas 2D 绘制
            this.ctx.save();
            this.ctx.translate(x + width/2, y + height/2);
            this.ctx.rotate(rotation);
            this.ctx.drawImage(texture, -width/2, -height/2, width, height);
            this.ctx.restore();
        }
    }

    clear() {
        if (this.type === 'webgl') {
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // 添加绘制背景的方法
    drawBackground(game) {
        if (this.type === 'webgl') {
            // WebGL 背景绘制
            // ... WebGL 背景绘制代码 ...
        } else {
            // Canvas 2D 背景绘制
            game.drawCyberpunkGrid(this.ctx);
        }
    }
}

class Game {
    constructor() {
        this.initGame();           // 初始化游戏
        this.generateSnakeTexture(); // 生成蛇的纹理
        this.setupEventListeners(); // 设置事件监听
        // this.generateQRCode();      // 生成二维码
        
        // 增加性能相关的配置
        this.lastTime = 0;
        this.frameCount = 0;
        this.lastGameTick = 0;     // 添加游戏逻辑计时器
        this.gameTickInterval = 200; // 游戏逻辑更新间隔（毫秒）
        this.backgroundCache = null;
        this.lastBackgroundUpdate = 0;
        this.BACKGROUND_UPDATE_INTERVAL = 200;  // 增加背景更新间隔
        this.decorationPositions = [];  // 存储装饰元素的固定位置
        this.initDecorationPositions(); // 初始化装饰元素位置
        
        // 初始化 WebGL 渲染器
        this.renderer = new Renderer(this.canvas);
        this.headAnimationFrame = 0;
        this.headAnimationTimer = 0;
        this.HEAD_ANIMATION_INTERVAL = 200; // 每200ms切换一次帧
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
        // 创建蛇的纹理图片
        this.snakeHeadTexture = new Image();
        this.snakeBodyTexture = new Image();
        this.snakeTailTexture = new Image();
        
        // 设置图片加载完成的标志
        this.snakeTextureLoaded = false;
        let loadedCount = 0;
        
        // 加载计数器
        const onLoad = () => {
            loadedCount++;
            if (loadedCount === 3) {
                this.snakeTextureLoaded = true;
            }
        };

        // 加载蛇头动画帧
        this.headFrames = [];
        for (let i = 1; i <= 3; i++) {
            const headFrame = new Image();
            headFrame.src = `images/head${i}.png`;  // head1.png, head2.png, head3.png
            this.headFrames.push(headFrame);
        }

        // 设置初始蛇头纹理为第一帧
        this.snakeHeadTexture.onload = onLoad;
        this.snakeHeadTexture.src = 'images/head1.png';

        // 加载身体纹理
        this.snakeBodyTexture.onload = onLoad;
        this.snakeBodyTexture.src = 'images/body.png';

        // 加载尾部纹理
        this.snakeTailTexture.onload = onLoad;
        this.snakeTailTexture.src = 'images/tail.png';

        // 加载转弯纹理
        this.turnTextures = {
            rightbottom: new Image(),
            righttop: new Image(),
            leftbottom: new Image(),
            lefttop: new Image()
        };

        // 使用正确的转弯图片路径
        this.turnTextures.rightbottom.src = 'images/rightbottom.png';
        this.turnTextures.righttop.src = 'images/righttop.png';
        this.turnTextures.leftbottom.src = 'images/leftbottom.png';
        this.turnTextures.lefttop.src = 'images/lefttop.png';
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
            if (this.isPaused && e.key !== 'Escape') return;
            
            switch (e.key) {
                case 'ArrowUp':
                    if (this.snake.direction !== 'down') {
                        this.snake.nextDirection = 'up';
                        e.preventDefault(); // 防止页面滚动
                    }
                    break;
                case 'ArrowDown':
                    if (this.snake.direction !== 'up') {
                        this.snake.nextDirection = 'down';
                        e.preventDefault();
                    }
                    break;
                case 'ArrowLeft':
                    if (this.snake.direction !== 'right') {
                        this.snake.nextDirection = 'left';
                        e.preventDefault();
                    }
                    break;
                case 'ArrowRight':
                    if (this.snake.direction !== 'left') {
                        this.snake.nextDirection = 'right';
                        e.preventDefault();
                    }
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
        if (!this.gameLoopRunning) {
            this.gameLoopRunning = true;
            this.lastTime = 0;  // 重置时间
            this.lastGameTick = 0;
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    gameLoop(timestamp) {
        if (!this.gameLoopRunning) return;
        
        // 如果是第一帧，初始化时间
        if (!this.lastTime) {
            this.lastTime = timestamp;
            this.lastGameTick = timestamp;
        }

        // 计算时间差
        const deltaTime = timestamp - this.lastGameTick;

        // 更新游戏逻辑
        if (!this.isPaused && deltaTime >= this.gameTickInterval) {
            this.update();
            this.lastGameTick = timestamp;
        }

        // 始终更新渲染
        this.draw();
        
        // 保存当前时间戳
        this.lastTime = timestamp;
        
        // 继续游戏循环
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update() {
        if (this.gameOver) {
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
        this.renderer.clear();
        
        // 绘制背景
        this.renderer.drawBackground(this);

        // 更新蛇头动画
        const currentTime = Date.now();
        if (currentTime - this.headAnimationTimer > this.HEAD_ANIMATION_INTERVAL) {
            this.headAnimationFrame = (this.headAnimationFrame + 1) % 3;
            this.headAnimationTimer = currentTime;
            // 更新蛇头纹理为当前帧
            this.snakeHeadTexture.src = this.headFrames[this.headAnimationFrame].src;
        }

        // 绘制蛇
        this.snake.position.forEach((segment, index) => {
            if (this.snakeTextureLoaded) {
                let angle = 0;
                let texture = this.snakeBodyTexture; // 默认使用身体纹理

                if (index === 0) {  // 头部
                    texture = this.snakeHeadTexture;
                    switch(this.snake.direction) {
                        case 'up': angle = Math.PI; break;
                        case 'right': angle = -Math.PI/2; break;
                        case 'down': angle = 0; break;
                        case 'left': angle = Math.PI/2; break;
                    }
                } else if (index === this.snake.position.length - 1) {  // 尾部
                    texture = this.snakeTailTexture;
                    // 获取尾部前一个节点
                    const prevSegment = this.snake.position[index - 1];
                    // 根据前一个节点的位置确定尾部方向
                    if (prevSegment.x > segment.x) {
                        angle = Math.PI/2;   // 尾部朝左（因为前一节在右边）
                    } else if (prevSegment.x < segment.x) {
                        angle = -Math.PI/2;  // 尾部朝右（因为前一节在左边）
                    } else if (prevSegment.y > segment.y) {
                        angle = Math.PI;     // 尾部朝上（因为前一节在下边）
                    } else if (prevSegment.y < segment.y) {
                        angle = 0;           // 尾部朝下（因为前一节在上边）
                    }
                } else {  // 身体和转弯
                    const prev = this.snake.position[index - 1];
                    const curr = segment;
                    const next = this.snake.position[index + 1];

                    if (prev.x !== next.x && prev.y !== next.y) {
                        // 转弯判断
                        if (prev.y === curr.y) {  // 水平移动到转弯点
                            if (prev.x < curr.x) {  // 从左向右移动
                                if (next.y < curr.y) {  // 向上转
                                    texture = this.turnTextures.righttop;
                                } else {  // 向下转
                                    texture = this.turnTextures.rightbottom;
                                }
                            } else {  // 从右向左移动
                                if (next.y < curr.y) {  // 向上转
                                    texture = this.turnTextures.lefttop;
                                } else {  // 向下转
                                    texture = this.turnTextures.leftbottom;
                                }
                            }
                        } else {  // 垂直移动到转弯点
                            if (prev.y < curr.y) {  // 从上向下移动
                                if (next.x < curr.x) {  // 向左转
                                    texture = this.turnTextures.righttop;
                                } else {  // 向右转
                                    texture = this.turnTextures.lefttop;
                                }
                            } else {  // 从下向上移动
                                if (next.x < curr.x) {  // 向左转
                                    texture = this.turnTextures.rightbottom;
                                } else {  // 向右转
                                    texture = this.turnTextures.leftbottom;
                                }
                            }
                        }
                    } else {
                        // 直线移动部分保持不变
                        if (prev.x > curr.x) angle = Math.PI/2;
                        else if (prev.x < curr.x) angle = -Math.PI/2;
                        else if (prev.y > curr.y) angle = Math.PI;
                        else if (prev.y < curr.y) angle = 0;
                    }
                }

                // 绘制蛇的部分
                this.renderer.drawSprite(
                    texture,
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize,
                    this.gridSize,
                    angle
                );
            }
        });

        // 绘制食物
        if (this.food.images[this.food.type].complete) {
            this.renderer.drawSprite(
                this.food.images[this.food.type],
                this.food.position.x * this.gridSize,
                this.food.position.y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
        }
    }

    drawCachedBackground() {
        const currentTime = Date.now();
        
        // 检查是否需要更新背景缓存
        if (!this.backgroundCache || 
            currentTime - this.lastBackgroundUpdate > this.BACKGROUND_UPDATE_INTERVAL) {
            
            // 创建离屏画布作为缓存
            if (!this.backgroundCache) {
                this.backgroundCache = document.createElement('canvas');
                this.backgroundCache.width = this.canvas.width;
                this.backgroundCache.height = this.canvas.height;
            }
            
            const bgCtx = this.backgroundCache.getContext('2d');
            bgCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 在缓存画布上绘制背景
            this.drawCyberpunkGrid(bgCtx);
            
            this.lastBackgroundUpdate = currentTime;
        }
        
        // 直接绘制缓存的背景
        this.ctx.drawImage(this.backgroundCache, 0, 0);
    }

    // 修改背景绘制方法，接受上下文参数
    drawCyberpunkGrid(ctx = this.ctx) {
        ctx.save();
        
        // 使用预渲染的渐变背景
        if (!this.bgGradientCache) {
            this.createBackgroundGradient(ctx);
        }
        ctx.drawImage(this.bgGradientCache, 0, 0);
        
        // 简化网格线绘制
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        
        // 使用单一路径绘制所有网格线
        ctx.beginPath();
        for (let x = 0; x <= this.width; x += 4) {
            ctx.moveTo(x * this.gridSize, 0);
            ctx.lineTo(x * this.gridSize, this.canvas.height);
        }
        for (let y = 0; y <= this.height; y += 4) {
            ctx.moveTo(0, y * this.gridSize);
            ctx.lineTo(this.canvas.width, y * this.gridSize);
        }
        ctx.stroke();

        // 使用预计算的位置绘制装饰
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        this.decorationPositions.forEach(({x, y, radius}) => {
            // 同心圆
            for (let j = 0; j < 2; j++) {
                ctx.beginPath();
                ctx.arc(x, y, radius + j * 20, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // 十字线
            ctx.beginPath();
            ctx.moveTo(x - radius, y);
            ctx.lineTo(x + radius, y);
            ctx.moveTo(x, y - radius);
            ctx.lineTo(x, y + radius);
            ctx.stroke();
        });

        this.drawCornerDecorations(ctx);
        this.drawSimplifiedDataStreams(ctx);
        this.drawSimplifiedScanLines(ctx);

        ctx.restore();
    }

    // 预渲染背景渐变
    createBackgroundGradient(ctx) {
        this.bgGradientCache = document.createElement('canvas');
        this.bgGradientCache.width = this.canvas.width;
        this.bgGradientCache.height = this.canvas.height;
        const gradCtx = this.bgGradientCache.getContext('2d');
        
        const gradient = gradCtx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, this.canvas.width/2
        );
        gradient.addColorStop(0, 'rgba(0, 20, 30, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 10, 20, 0.3)');
        
        gradCtx.fillStyle = gradient;
        gradCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 优化数据流效果
    drawSimplifiedDataStreams(ctx) {
        const time = (Date.now() / 1000) % 10000;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // 使用单一路径绘制所有数据流
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const x = ((Math.sin(time * 0.3 + i) + 1) * 0.5) * this.canvas.width;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
        }
        ctx.stroke();
        
        // 批量绘制数据点
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        const pointCount = 5;
        for (let i = 0; i < 4; i++) {
            const x = ((Math.sin(time * 0.3 + i) + 1) * 0.5) * this.canvas.width;
            for (let j = 0; j < pointCount; j++) {
                const y = (j / (pointCount - 1)) * this.canvas.height;
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        }
    }

    // 添加角落装饰
    drawCornerDecorations(ctx = this.ctx) {
        const size = 40;
        const corners = [
            [0, 0], // 左上
            [this.canvas.width - size, 0], // 右上
            [0, this.canvas.height - size], // 左下
            [this.canvas.width - size, this.canvas.height - size] // 右下
        ];

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        corners.forEach(([x, y]) => {
            // L形边角
            ctx.beginPath();
            ctx.moveTo(x, y + size);
            ctx.lineTo(x, y);
            ctx.lineTo(x + size, y);
            ctx.stroke();

            // 装饰性小圆圈
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, 5, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    // 初始化装饰元素的固定位置
    initDecorationPositions() {
        // 预计算2个装饰圆的位置
        this.decorationPositions = Array(2).fill().map(() => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: Math.random() * 40 + 30
        }));
    }

    // 优化扫描线效果
    drawSimplifiedScanLines(ctx = this.ctx) {
        const currentTime = Date.now() % 3000;
        const scanPos = (currentTime / 3000) * this.canvas.height;
        
        // 只在扫描线附近绘制渐变
        const scanHeight = 10;
        const scanStart = Math.max(0, scanPos - scanHeight);
        const scanEnd = Math.min(this.canvas.height, scanPos + scanHeight);
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, scanStart, this.canvas.width, scanEnd - scanStart);

        // 使用固定间隔的闪烁点
        const pointCount = 15;
        for (let i = 0; i < pointCount; i++) {
            const x = (i / pointCount) * this.canvas.width;
            const y = (Math.sin(currentTime * 0.01 + i) + 1) * 0.5 * this.canvas.height;
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// 启动游戏
new Game(); 