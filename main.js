import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 430,
    height: 760,
    parent: 'game',
    backgroundColor: '#0b1330',
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
