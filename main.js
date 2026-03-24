import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 430,
    height: 760,
    parent: 'game',
    backgroundColor: '#08122c',
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

// Optional app-side listener for parent dashboard testing
window.addEventListener('ninjadojo-session-update', (event) => {
    console.log('APP_RECEIVED_SESSION_UPDATE', event.detail);
});

// Helper functions you can call from browser console during testing
window.NinjaDojoDebug = {
    getLastSession() {
        const raw = localStorage.getItem('ninjadojo_last_session');
        return raw ? JSON.parse(raw) : null;
    },
    getRoundLogs() {
        const raw = localStorage.getItem('ninjadojo_round_logs');
        return raw ? JSON.parse(raw) : [];
    },
    clearLogs() {
        localStorage.removeItem('ninjadojo_last_session');
        localStorage.removeItem('ninjadojo_round_logs');
        console.log('NINJAdojo-memory logs cleared');
    }
};
