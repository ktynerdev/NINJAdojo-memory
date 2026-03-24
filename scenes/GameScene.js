export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.combo = [];
        this.playerInput = [];
        this.round = 1;

        this.actions = ['LEFT', 'RIGHT', 'UP', 'DOWN'];

        this.text = this.add.text(100, 50, 'Watch the combo', {
            fontSize: '20px',
            fill: '#ffffff'
        });

        this.createButtons();
        this.startRound();
    }

    createButtons() {
        this.buttons = [];

        this.actions.forEach((action, index) => {
            let btn = this.add.text(150, 200 + index * 50, action, {
                fontSize: '24px',
                backgroundColor: '#444',
                padding: { x: 10, y: 5 }
            })
            .setInteractive()
            .on('pointerdown', () => this.handleInput(action));

            this.buttons.push(btn);
        });
    }

    startRound() {
        this.playerInput = [];
        this.combo = this.generateCombo();

        this.text.setText('Watch...');
        this.showCombo(this.combo);
    }

    generateCombo() {
        let combo = [];
        for (let i = 0; i < 2 + this.round; i++) {
            combo.push(Phaser.Utils.Array.GetRandom(this.actions));
        }
        return combo;
    }

    showCombo(combo) {
        let i = 0;

        this.time.addEvent({
            delay: 800,
            repeat: combo.length - 1,
            callback: () => {
                this.text.setText(combo[i]);
                i++;

                if (i === combo.length) {
                    this.time.delayedCall(500, () => {
                        this.text.setText('Your turn');
                    });
                }
            }
        });
    }

    handleInput(action) {
        this.playerInput.push(action);

        if (this.playerInput.length === this.combo.length) {
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
            this.text.setText('Correct!');
            this.round++;

            this.time.delayedCall(1000, () => this.startRound());
        } else {
            this.text.setText('Wrong! Try again');
            this.round = 1;

            this.time.delayedCall(1000, () => this.startRound());
        }
    }
}
