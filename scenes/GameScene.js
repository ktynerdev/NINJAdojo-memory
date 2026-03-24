export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // ===== Core game state =====
        this.round = 1;
        this.combo = [];
        this.playerInput = [];
        this.actions = ['LEFT', 'RIGHT', 'UP', 'DOWN'];
        this.acceptingInput = false;
        this.correctCount = 0;
        this.totalRounds = 0;

        // ===== Data / scoring hooks kept for later dashboard =====
        this.sessionMetrics = {
            rounds: [],
            bestComboLength: 0,
            averageReactionMs: 0,
            reactionTimes: [],
            completionStatus: 'in_progress'
        };
        this.currentRoundStartTime = null;
        this.currentInputTimes = [];
        this.pepperLanterns = [];
        this.fireworks = [];

        // ===== Layout =====
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        this.centerX = this.gameWidth / 2;

        this.drawBackground();
        this.createHUD();
        this.createButtons();
        this.startMusic();
        this.startRound();
    }

    // --------------------------------------------------
    // BACKGROUND
    // --------------------------------------------------
    drawBackground() {
        this.cameras.main.setBackgroundColor('#0b1330');

        // Sky gradient
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x09122b, 0x09122b, 0x203a7a, 0x203a7a, 1);
        sky.fillRect(0, 0, this.gameWidth, this.gameHeight);

        // Moon
        this.add.circle(this.gameWidth - 65, 70, 28, 0xfff4b3, 0.95);
        this.add.circle(this.gameWidth - 55, 62, 24, 0x0b1330, 0.2);

        // Stars
        for (let i = 0; i < 35; i++) {
            const x = Phaser.Math.Between(10, this.gameWidth - 10);
            const y = Phaser.Math.Between(10, 170);
            const r = Phaser.Math.Between(1, 3);
            this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.4, 1));
        }

        // Mountains
        const mountains = this.add.graphics();
        mountains.fillStyle(0x17264f, 1);
        mountains.fillTriangle(0, 260, 90, 150, 180, 260);
        mountains.fillTriangle(120, 260, 220, 140, 320, 260);
        mountains.fillTriangle(250, 260, 345, 165, 440, 260);

        mountains.fillStyle(0x243a72, 1);
        mountains.fillTriangle(-20, 290, 80, 200, 180, 290);
        mountains.fillTriangle(130, 290, 240, 190, 350, 290);
        mountains.fillTriangle(290, 290, 390, 215, 490, 290);

        // Village ground
        const ground = this.add.graphics();
        ground.fillStyle(0x1f5b43, 1);
        ground.fillRect(0, this.gameHeight - 170, this.gameWidth, 170);

        // Village buildings
        this.drawHouse(30, this.gameHeight - 200, 78, 55, 0xc96c3b, 0x6d2d1a);
        this.drawHouse(120, this.gameHeight - 215, 92, 70, 0xd98b47, 0x7f2f1f);
        this.drawHouse(235, this.gameHeight - 205, 82, 60, 0xc8793a, 0x5e2618);
        this.drawHouse(330, this.gameHeight - 220, 72, 75, 0xe0a056, 0x702d1f);

        // Hanging starter lantern string
        const rope = this.add.graphics();
        rope.lineStyle(2, 0xc9a35f, 1);
        rope.beginPath();
        rope.moveTo(10, 160);
        rope.quadraticCurveTo(this.centerX, 125, this.gameWidth - 10, 160);
        rope.strokePath();

        // Decorative lanterns on string
        const decoXs = [45, 110, 180, 250, 320, 385];
        decoXs.forEach((x, i) => {
            const color = [0xff5f6d, 0xffb84d, 0xffe066, 0x7ee081, 0x5dd6ff, 0xc68bff][i % 6];
            this.drawSmallLantern(x, 158 + Math.sin(i) * 4, color);
        });
    }

    drawHouse(x, y, w, h, wallColor, roofColor) {
        const g = this.add.graphics();

        // Wall
        g.fillStyle(wallColor, 1);
        g.fillRoundedRect(x, y, w, h, 8);

        // Roof
        g.fillStyle(roofColor, 1);
        g.fillTriangle(x - 8, y + 10, x + w / 2, y - 22, x + w + 8, y + 10);

        // Door
        g.fillStyle(0x4c2a1e, 1);
        g.fillRoundedRect(x + w / 2 - 10, y + h - 26, 20, 26, 4);

        // Windows
        g.fillStyle(0xffe79a, 0.9);
        g.fillRoundedRect(x + 10, y + 16, 14, 14, 4);
        g.fillRoundedRect(x + w - 24, y + 16, 14, 14, 4);
    }

    drawSmallLantern(x, y, color) {
        const g = this.add.graphics();
        g.lineStyle(2, 0xc9a35f, 1);
        g.beginPath();
        g.moveTo(x, y - 12);
        g.lineTo(x, y - 4);
        g.strokePath();

        g.fillStyle(color, 1);
        g.fillRoundedRect(x - 8, y - 4, 16, 20, 5);

        g.lineStyle(1, 0xfff5d2, 0.7);
        g.strokeRoundedRect(x - 8, y - 4, 16, 20, 5);

        g.lineStyle(1, 0xc9a35f, 1);
        g.beginPath();
        g.moveTo(x, y + 16);
        g.lineTo(x, y + 23);
        g.strokePath();
    }

    // --------------------------------------------------
    // HUD
    // --------------------------------------------------
    createHUD() {
        this.titleText = this.add.text(this.centerX, 28, 'NINJAdojo-memory', {
            fontSize: '24px',
            color: '#fff7d6',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Minimal non-reading prompts
        this.statusText = this.add.text(this.centerX, 78, '👀', {
            fontSize: '34px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.comboDisplay = this.add.text(this.centerX, 132, '', {
            fontSize: '44px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.feedbackText = this.add.text(this.centerX, 200, '', {
            fontSize: '30px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.progressIcons = this.add.container(0, 0);

        // Decorative dojo platform behind buttons
        const platform = this.add.graphics();
        platform.fillStyle(0x2a1e14, 0.7);
        platform.fillRoundedRect(30, 360, this.gameWidth - 60, 320, 26);

        platform.lineStyle(4, 0xd1a15d, 0.7);
        platform.strokeRoundedRect(30, 360, this.gameWidth - 60, 320, 26);
    }

    // --------------------------------------------------
    // BUTTONS
    // --------------------------------------------------
    createButtons() {
        this.buttonData = [];

        const layout = [
            { action: 'UP', x: this.centerX, y: 430, bg: 0xffe066, arrow: '⬆️' },
            { action: 'LEFT', x: this.centerX - 92, y: 530, bg: 0xff7b7b, arrow: '⬅️' },
            { action: 'DOWN', x: this.centerX, y: 530, bg: 0x6be675, arrow: '⬇️' },
            { action: 'RIGHT', x: this.centerX + 92, y: 530, bg: 0x5dd6ff, arrow: '➡️' }
        ];

        layout.forEach((item) => {
            const container = this.add.container(item.x, item.y);

            const shadow = this.add.graphics();
            shadow.fillStyle(0x000000, 0.25);
            shadow.fillRoundedRect(-44, -34, 88, 76, 22);

            const button = this.add.graphics();
            button.fillStyle(item.bg, 1);
            button.fillRoundedRect(-48, -38, 96, 76, 24);
            button.lineStyle(4, 0xffffff, 0.9);
            button.strokeRoundedRect(-48, -38, 96, 76, 24);

            const arrow = this.add.text(0, -2, item.arrow, {
                fontSize: '34px'
            }).setOrigin(0.5);

            const hitZone = this.add.zone(0, 0, 100, 82)
                .setRectangleDropZone(100, 82)
                .setInteractive({ useHandCursor: true });

            hitZone.on('pointerdown', () => {
                if (!this.acceptingInput) return;

                container.setScale(0.92);
                this.time.delayedCall(120, () => container.setScale(1));
                this.playTapTone(item.action);
                this.handleInput(item.action);
            });

            container.add([shadow, button, arrow, hitZone]);
            this.buttonData.push({ action: item.action, container, hitZone });
        });
    }

    // --------------------------------------------------
    // ROUND FLOW
    // --------------------------------------------------
    startRound() {
        this.acceptingInput = false;
        this.playerInput = [];
        this.feedbackText.setText('');
        this.currentInputTimes = [];
        this.currentRoundStartTime = null;

        this.combo = this.generateCombo();
        this.sessionMetrics.bestComboLength = Math.max(this.sessionMetrics.bestComboLength, this.combo.length);

        this.showCombo();
    }

    generateCombo() {
        const combo = [];
        const comboLength = Math.min(2 + Math.floor((this.round - 1) / 2), 6);

        for (let i = 0; i < comboLength; i++) {
            combo.push(Phaser.Utils.Array.GetRandom(this.actions));
        }

        return combo;
    }

    showCombo() {
        this.statusText.setText('👀');
        this.comboDisplay.setText('');
        this.feedbackText.setText('');

        const symbolMap = {
            LEFT: '⬅️',
            RIGHT: '➡️',
            UP: '⬆️',
            DOWN: '⬇️'
        };

        let index = 0;

        const showNext = () => {
            if (index < this.combo.length) {
                const symbol = symbolMap[this.combo[index]];
                const colors = ['#ff7b7b', '#5dd6ff', '#ffe066', '#6be675'];
                this.comboDisplay.setColor(colors[index % colors.length]);
                this.comboDisplay.setText(symbol);

                this.tweens.add({
                    targets: this.comboDisplay,
                    scale: { from: 0.7, to: 1.15 },
                    duration: 180,
                    yoyo: true
                });

                this.playPromptTone(index);

                this.time.delayedCall(700, () => {
                    this.comboDisplay.setText('');
                    this.time.delayedCall(180, () => {
                        index++;
                        showNext();
                    });
                });
            } else {
                this.statusText.setText('👉');
                this.feedbackText.setText('🥷');
                this.acceptingInput = true;
                this.currentRoundStartTime = performance.now();
            }
        };

        showNext();
    }

    handleInput(action) {
        this.playerInput.push(action);
        this.currentInputTimes.push(performance.now());

        const symbolMap = {
            LEFT: '⬅️',
            RIGHT: '➡️',
            UP: '⬆️',
            DOWN: '⬇️'
        };

        this.comboDisplay.setText(this.playerInput.map(a => symbolMap[a]).join(' '));
        this.comboDisplay.setColor('#fff7d6');

        if (this.playerInput.length >= this.combo.length) {
            this.acceptingInput = false;
            this.checkResult();
        }
    }

    checkResult() {
        let correct = true;

        for (let i = 0; i < this.combo.length; i++) {
            if (this.combo[i] !== this.playerInput[i]) {
                correct = false;
                break;
            }
        }

        this.totalRounds++;
        if (correct) this.correctCount++;

        const roundReactionMs = this.computeAverageReaction();
        this.sessionMetrics.reactionTimes.push(roundReactionMs);

        this.sessionMetrics.rounds.push({
            roundNumber: this.round,
            comboLength: this.combo.length,
            targetCombo: [...this.combo],
            playerCombo: [...this.playerInput],
            correct,
            reactionTimeMs: roundReactionMs
        });

        if (correct) {
            this.feedbackText.setColor('#a8ffb1');
            this.feedbackText.setText('✅');
            this.addPepperLantern();
            this.playSuccessFanfare();

            if (this.round === 5) {
                this.addFestivalLantern();
            }

            if (this.round === 10) {
                this.launchFireworks();
            }

            this.round++;

            // keep going; round count can exceed 10
            this.time.delayedCall(1000, () => this.startRound());
        } else {
            this.feedbackText.setColor('#ff9f9f');
            this.feedbackText.setText('❌');
            this.playMissTone();
            this.round = 1;
            this.clearRoundDisplayLanterns();

            this.time.delayedCall(1200, () => this.startRound());
        }

        this.sessionMetrics.averageReactionMs = this.average(this.sessionMetrics.reactionTimes);
    }

    computeAverageReaction() {
        if (!this.currentRoundStartTime || this.currentInputTimes.length === 0) return 0;

        let total = 0;
        let prev = this.currentRoundStartTime;

        this.currentInputTimes.forEach((t) => {
            total += (t - prev);
            prev = t;
        });

        return Math.round(total / this.currentInputTimes.length);
    }

    average(arr) {
        if (!arr.length) return 0;
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }

    // --------------------------------------------------
    // VISUAL PROGRESS
    // --------------------------------------------------
    addPepperLantern() {
        const index = this.pepperLanterns.length;
        const x = 36 + (index % 8) * 46;
        const y = 235 + Math.floor(index / 8) * 42;

        const container = this.add.container(x, y);

        const rope = this.add.graphics();
        rope.lineStyle(2, 0xd6b56f, 1);
        rope.beginPath();
        rope.moveTo(0, -16);
        rope.lineTo(0, -4);
        rope.strokePath();

        const pepper = this.add.graphics();
        pepper.fillStyle(0xff4d4d, 1);
        pepper.fillEllipse(0, 6, 18, 28);
        pepper.fillStyle(0x49c15b, 1);
        pepper.fillTriangle(-4, -6, 0, -14, 5, -6);

        const glow = this.add.circle(0, 6, 12, 0xffb347, 0.18);

        container.add([glow, rope, pepper]);
        this.pepperLanterns.push(container);

        this.tweens.add({
            targets: container,
            y: y + 4,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    addFestivalLantern() {
        const x = this.gameWidth - 58;
        const y = 235;

        const container = this.add.container(x, y);

        const rope = this.add.graphics();
        rope.lineStyle(3, 0xe0c27a, 1);
        rope.beginPath();
        rope.moveTo(0, -24);
        rope.lineTo(0, -8);
        rope.strokePath();

        const lantern = this.add.graphics();
        lantern.fillStyle(0xff7be5, 1);
        lantern.fillRoundedRect(-18, -8, 36, 46, 10);
        lantern.lineStyle(3, 0xfff1b8, 1);
        lantern.strokeRoundedRect(-18, -8, 36, 46, 10);

        lantern.lineStyle(2, 0xfff1b8, 0.8);
        lantern.beginPath();
        lantern.moveTo(-12, 4);
        lantern.lineTo(12, 4);
        lantern.moveTo(-12, 14);
        lantern.lineTo(12, 14);
        lantern.moveTo(-12, 24);
        lantern.lineTo(12, 24);
        lantern.strokePath();

        const star = this.add.text(0, 14, '🏮', { fontSize: '24px' }).setOrigin(0.5);

        container.add([rope, lantern, star]);

        this.tweens.add({
            targets: container,
            angle: { from: -4, to: 4 },
            duration: 1200,
            yoyo: true,
            repeat: -1
        });
    }

    clearRoundDisplayLanterns() {
        this.pepperLanterns.forEach(item => item.destroy());
        this.pepperLanterns = [];
    }

    launchFireworks() {
        const colors = [0xff5f6d, 0xffe066, 0x6be675, 0x5dd6ff, 0xc68bff];

        for (let b = 0; b < 4; b++) {
            this.time.delayedCall(b * 250, () => {
                const x = Phaser.Math.Between(60, this.gameWidth - 60);
                const y = Phaser.Math.Between(70, 220);
                this.makeFireworkBurst(x, y, colors);
            });
        }
    }

    makeFireworkBurst(x, y, colors) {
        for (let i = 0; i < 14; i++) {
            const particle = this.add.circle(x, y, Phaser.Math.Between(3, 6), Phaser.Utils.Array.GetRandom(colors), 1);

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(35, 85);
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            this.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0.4,
                duration: 900,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    // --------------------------------------------------
    // MUSIC + SFX (generated in code)
    // --------------------------------------------------
    startMusic() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            this.audioCtx = this.audioCtx || new AudioCtx();

            // iPhone often requires resume after interaction;
            // also try once on create
            if (this.audioCtx.state === 'suspended') {
                this.input.once('pointerdown', () => {
                    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
                    this.playMusicLoop();
                });
            } else {
                this.playMusicLoop();
            }
        } catch (e) {
            console.log('Audio init skipped', e);
        }
    }

    playMusicLoop() {
        if (!this.audioCtx || this.musicStarted) return;
        this.musicStarted = true;

        // Pentatonic notes for gentle dojo vibe
        const notes = [523.25, 587.33, 698.46, 783.99, 880.0, 783.99];
        let step = 0;

        this.musicTimer = this.time.addEvent({
            delay: 900,
            loop: true,
            callback: () => {
                if (!this.audioCtx) return;
                this.playSoftNote(notes[step % notes.length], 0.12, 0.22);
                if (step % 2 === 0) {
                    this.playSoftNote(notes[(step + 2) % notes.length] / 2, 0.06, 0.3);
                }
                step++;
            }
        });
    }

    playSoftNote(freq, volume = 0.1, duration = 0.2) {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.03);
    }

    playPromptTone(index) {
        const tones = [523.25, 659.25, 783.99, 1046.5];
        this.playSoftNote(tones[index % tones.length], 0.06, 0.12);
    }

    playTapTone(action) {
        const map = {
            LEFT: 392.0,
            RIGHT: 493.88,
            UP: 587.33,
            DOWN: 349.23
        };
        this.playSoftNote(map[action], 0.08, 0.08);
    }

    playSuccessFanfare() {
        [659.25, 783.99, 987.77].forEach((freq, i) => {
            this.time.delayedCall(i * 80, () => this.playSoftNote(freq, 0.12, 0.16));
        });
    }

    playMissTone() {
        [349.23, 293.66].forEach((freq, i) => {
            this.time.delayedCall(i * 90, () => this.playSoftNote(freq, 0.08, 0.18));
        });
    }
}
