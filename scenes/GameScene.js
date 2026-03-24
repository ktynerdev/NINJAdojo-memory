export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.round = 1;
        this.combo = [];
        this.playerInput = [];
        this.actions = ['LEFT', 'RIGHT', 'UP', 'DOWN'];
        this.acceptingInput = false;
        this.correctCount = 0;
        this.totalRounds = 0;
        this.paperLanterns = [];

        this.drawBackground();
        this.createHUD();
        this.createButtons();
        this.startRound();
    }

    drawBackground() {
        this.cameras.main.setBackgroundColor('#0b1330');

        this.add.circle(365, 70, 28, 0xfff4b3, 0.95);

        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(10, 420);
            const y = Phaser.Math.Between(10, 180);
            this.add.circle(x, y, 2, 0xffffff, 0.8);
        }

        const g = this.add.graphics();

        g.fillStyle(0x1f5b43, 1);
        g.fillRect(0, 590, 430, 170);

        g.fillStyle(0xc96c3b, 1);
        g.fillRoundedRect(40, 520, 70, 50, 8);
        g.fillStyle(0x6d2d1a, 1);
        g.fillTriangle(32, 528, 75, 498, 118, 528);

        g.fillStyle(0xd98b47, 1);
        g.fillRoundedRect(170, 500, 90, 70, 8);
        g.fillStyle(0x7f2f1f, 1);
        g.fillTriangle(160, 510, 215, 475, 270, 510);

        g.fillStyle(0xe0a056, 1);
        g.fillRoundedRect(300, 515, 70, 55, 8);
        g.fillStyle(0x702d1f, 1);
        g.fillTriangle(292, 524, 335, 492, 378, 524);
    }

    createHUD() {
        this.statusText = this.add.text(215, 70, '👀', {
            fontSize: '36px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.comboDisplay = this.add.text(215, 150, '', {
            fontSize: '44px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.feedbackText = this.add.text(215, 220, '', {
            fontSize: '30px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    createButtons() {
        const layout = [
            { action: 'UP', x: 215, y: 420, color: 0xffe066, arrow: '⬆️' },
            { action: 'LEFT', x: 123, y: 520, color: 0xff7b7b, arrow: '⬅️' },
            { action: 'DOWN', x: 215, y: 520, color: 0x6be675, arrow: '⬇️' },
            { action: 'RIGHT', x: 307, y: 520, color: 0x5dd6ff, arrow: '➡️' }
        ];

        this.buttons = [];

        layout.forEach((item) => {
            const rect = this.add.rectangle(item.x, item.y, 96, 76, item.color)
                .setStrokeStyle(4, 0xffffff)
                .setInteractive();

            this.add.text(item.x, item.y, item.arrow, {
                fontSize: '34px'
            }).setOrigin(0.5);

            rect.on('pointerdown', () => {
                if (!this.acceptingInput) return;
                this.handleInput(item.action);
            });

            this.buttons.push(rect);
        });
    }

    startRound() {
        this.acceptingInput = false;
        this.playerInput = [];
        this.feedbackText.setText('');
        this.combo = this.generateCombo();
        this.showCombo();
    }

    generateCombo() {
        const combo = [];
        const comboLength = Math.min(2 + Math.floor((this.round - 1) / 2), 5);

        for (let i = 0; i < comboLength; i++) {
            combo.push(Phaser.Utils.Array.GetRandom(this.actions));
        }

        return combo;
    }

    showCombo() {
        const symbolMap = {
            LEFT: '⬅️',
            RIGHT: '➡️',
            UP: '⬆️',
            DOWN: '⬇️'
        };

        this.statusText.setText('👀');
        this.comboDisplay.setText('');

        let index = 0;

        const showNext = () => {
            if (index < this.combo.length) {
                this.comboDisplay.setText(symbolMap[this.combo[index]]);
                this.time.delayedCall(700, () => {
                    this.comboDisplay.setText('');
                    this.time.delayedCall(180, () => {
                        index++;
                        showNext();
                    });
                });
            } else {
                this.statusText.setText('👉');
                this.acceptingInput = true;
            }
        };

        showNext();
    }

    handleInput(action) {
        const symbolMap = {
            LEFT: '⬅️',
            RIGHT: '➡️',
            UP: '⬆️',
            DOWN: '⬇️'
        };

        this.playerInput.push(action);
        this.comboDisplay.setText(this.playerInput.map(a => symbolMap[a]).join(' '));

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

        if (correct) {
            this.feedbackText.setText('✅');
            this.addPaperLantern();
            this.round++;

            if (this.round > 10) {
                this.feedbackText.setText('🎆');
                return;
            }

            this.time.delayedCall(1000, () => this.startRound());
        } else {
            this.feedbackText.setText('❌');
            this.round = 1;
            this.clearPaperLanterns();
            this.time.delayedCall(1200, () => this.startRound());
        }
    }

    addPaperLantern() {
        const x = 30 + this.paperLanterns.length * 35;
        const y = 260;

        const g = this.add.graphics();
        g.lineStyle(2, 0xd6b56f, 1);
        g.beginPath();
        g.moveTo(x, y - 16);
        g.lineTo(x, y - 4);
        g.strokePath();

        g.fillStyle(0xff4d4d, 1);
        g.fillEllipse(x, y + 6, 18, 28);

        g.fillStyle(0x49c15b, 1);
        g.fillTriangle(x - 4, y - 6, x, y - 14, x + 5, y - 6);

        this.paperLanterns.push(g);
    }

    clearpaperLanterns() {
        this.paperLanterns.forEach(g => g.destroy());
        this.paperLanterns = [];
    }
}
