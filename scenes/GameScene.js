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

        this.cameras.main.setBackgroundColor('#111111');

        this.titleText = this.add.text(200, 40, 'NINJAdojo-memory', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.statusText = this.add.text(200, 90, 'Watch the combo', {
            fontSize: '22px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.roundText = this.add.text(200, 130, 'Round 1', {
            fontSize: '18px',
            color: '#cccccc'
        }).setOrigin(0.5);

        this.feedbackText = this.add.text(200, 520, '', {
            fontSize: '20px',
            color: '#90ee90'
        }).setOrigin(0.5);

        this.createButtons();
        this.startRound();
    }

    createButtons() {
        this.buttonData = [];
        const startY = 220;
        const gap = 85;

        this.actions.forEach((action, index) => {
            const y = startY + index * gap;

            const button = this.add.rectangle(200, y, 260, 60, 0x444444)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true });

            const label = this.add.text(200, y, action, {
                fontSize: '28px',
                color: '#ffffff'
            }).setOrigin(0.5);

            button.on('pointerdown', () => {
                if (!this.acceptingInput) return;

                button.setFillStyle(0x666666);
                this.time.delayedCall(120, () => {
                    button.setFillStyle(0x444444);
                });

                this.handleInput(action);
            });

            this.buttonData.push({ action, button, label });
        });
    }

    startRound() {
        this.acceptingInput = false;
        this.playerInput = [];
        this.feedbackText.setText('');
        this.roundText.setText(`Round ${this.round}`);
        this.combo = this.generateCombo();

        this.showCombo();
    }

    generateCombo() {
        const combo = [];
        const comboLength = Math.min(2 + this.round, 6);

        for (let i = 0; i < comboLength; i++) {
            combo.push(Phaser.Utils.Array.GetRandom(this.actions));
        }

        return combo;
    }

    showCombo() {
        this.statusText.setText('Watch...');

        let index = 0;

        const showNext = () => {
            if (index < this.combo.length) {
                this.statusText.setText(this.combo[index]);

                this.time.delayedCall(700, () => {
                    this.statusText.setText('...');
                    this.time.delayedCall(250, () => {
                        index++;
                        showNext();
                    });
                });
            } else {
                this.statusText.setText('Your turn');
                this.acceptingInput = true;
            }
        };

        showNext();
    }

    handleInput(action) {
        this.playerInput.push(action);

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

        if (correct) {
            this.feedbackText.setColor('#90ee90');
            this.feedbackText.setText('Correct!');
            this.round++;

            if (this.round > 5) {
                this.statusText.setText('Session Complete');
                this.feedbackText.setText('Nice job!');
                return;
            }

            this.time.delayedCall(1000, () => this.startRound());
        } else {
            this.feedbackText.setColor('#ff6b6b');
            this.feedbackText.setText('Wrong! Try again');
            this.round = 1;

            this.time.delayedCall(1200, () => this.startRound());
        }
    }
}
