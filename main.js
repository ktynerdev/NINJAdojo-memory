import GameScene from './scenes/GameScene.js';

const SUPABASE_URL = 'https://qjyoivpepfmnkoogvtao.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TfymH3Mi6DjDmlaYfrxS1w_hkFZU8oP';

let supabaseClient = null;

if (window.supabase && SUPABASE_URL !== 'https://qjyoivpepfmnkoogvtao.supabase.co' && SUPABASE_ANON_KEY !== 'sb_publishable_TfymH3Mi6DjDmlaYfrxS1w_hkFZU8oP') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

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

window.addEventListener('ninjadojo-session-update', async (event) => {
    const payload = event.detail;
    console.log('APP_RECEIVED_SESSION_UPDATE', payload);

    localStorage.setItem('ninjadojo_last_session', JSON.stringify(payload));

    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('game_sessions')
            .upsert([{
                session_id: payload.session_id,
                child_id: payload.child_id,
                age_band: payload.age_band,
                game_id: payload.game_id,
                started_at: payload.started_at,
                updated_at: payload.updated_at,
                round: payload.round,
                score: payload.score,
                accuracy_percent: payload.accuracy_percent,
                correct_rounds: payload.correct_rounds,
                total_rounds: payload.total_rounds,
                best_round: payload.best_round,
                best_combo_length: payload.best_combo_length,
                average_reaction_ms: payload.average_reaction_ms,
                lantern_count: payload.lantern_count,
                completion_status: payload.completion_status,
                event_type: payload.event_type,
                round_data: payload.round_data
            }], { onConflict: 'session_id' });

        if (error) {
            console.error('Supabase session upsert failed:', error);
        }
    } catch (err) {
        console.error('Supabase logging error:', err);
    }
});

window.NinjaDojoDebug = {
    getLastSession() {
        const raw = localStorage.getItem('ninjadojo_last_session');
        return raw ? JSON.parse(raw) : null;
    },
    clearLogs() {
        localStorage.removeItem('ninjadojo_last_session');
        localStorage.removeItem('ninjadojo_round_logs');
        console.log('NINJAdojo-memory logs cleared');
    }
};
