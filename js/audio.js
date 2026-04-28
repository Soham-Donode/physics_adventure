'use strict';

// ZZFX - Zuper Zmall Zound Zynth v1.3.2 by Frank Force (Modified for non-module use)
const ZZFX = {
    volume: .3,
    sampleRate: 44100,
    audioContext: null, // Created on first interaction
    
    init: function() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    play: function(...parameters) {
        this.init();
        return this.playSamples([this.buildSamples(...parameters)]);
    },

    playSamples: function(sampleChannels, volumeScale=1, rate=1, pan=0, loop=false) {
        if (!this.audioContext) return;
        const channelCount = sampleChannels.length;
        const sampleLength = sampleChannels[0].length;
        const buffer = this.audioContext.createBuffer(channelCount, sampleLength, this.sampleRate);
        const source = this.audioContext.createBufferSource();

        sampleChannels.forEach((c,i)=> buffer.getChannelData(i).set(c));
        source.buffer = buffer;
        source.playbackRate.value = rate;
        source.loop = loop;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.volume*volumeScale;
        gainNode.connect(this.audioContext.destination);

        const pannerNode = this.audioContext.createStereoPanner ? 
                           this.audioContext.createStereoPanner() : null;
        if (pannerNode) {
            pannerNode.pan.value = pan;
            source.connect(pannerNode).connect(gainNode);
        } else {
            source.connect(gainNode);
        }
        source.start();
        return source;
    },

    buildSamples: function(volume=1, randomness=.05, frequency=220, attack=0, sustain=0, release=.1, shape=0, shapeCurve=1, slide=0, deltaSlide=0, pitchJump=0, pitchJumpTime=0, repeatTime=0, noise=0, modulation=0, bitCrush=0, delay=0, sustainVolume=1, decay=0, tremolo=0, filter=0) {
        let sampleRate = this.sampleRate, PI2 = Math.PI*2, abs = Math.abs, sign = v => v<0?-1:1, 
            startSlide = slide *= 500 * PI2 / sampleRate / sampleRate,
            startFrequency = frequency *= (1 + randomness*2*Math.random() - randomness) * PI2 / sampleRate,
            modOffset = 0, repeat = 0, crush = 0, jump = 1, length, b = [], t = 0, i = 0, s = 0, f,
            quality = 2, w = PI2 * abs(filter) * 2 / sampleRate, cos = Math.cos(w), alpha = Math.sin(w) / 2 / quality,
            a0 = 1 + alpha, a1 = -2*cos / a0, a2 = (1 - alpha) / a0, b0 = (1 + sign(filter) * cos) / 2 / a0, 
            b1 = -(sign(filter) + cos) / a0, b2 = b0, x2 = 0, x1 = 0, y2 = 0, y1 = 0;

        const minAttack = 9;
        attack = attack * sampleRate || minAttack; decay *= sampleRate; sustain *= sampleRate; release *= sampleRate; delay *= sampleRate;
        deltaSlide *= 500 * PI2 / sampleRate**3; modulation *= PI2 / sampleRate; pitchJump *= PI2 / sampleRate; pitchJumpTime *= sampleRate;
        repeatTime = repeatTime * sampleRate | 0; volume *= this.volume;

        for(length = attack + decay + sustain + release + delay | 0; i < length; b[i++] = s * volume) {
            if (!(++crush%(bitCrush*100|0))) {
                s = shape? shape>1? shape>2? shape>3? shape>4? 
                    (t/PI2%1 < shapeCurve/2? 1 : -1) : Math.sin(t**3) : Math.max(Math.min(Math.tan(t),1),-1): 
                    1-(2*t/PI2%2+2)%2: 1-4*abs(Math.round(t/PI2)-t/PI2): Math.sin(t);

                s = (repeatTime ? 1 - tremolo + tremolo*Math.sin(PI2*i/repeatTime) : 1) *
                    (shape>4?s:sign(s)*abs(s)**shapeCurve) *
                    (i < attack ? i/attack : i < attack + decay ? 1-((i-attack)/decay)*(1-sustainVolume) : 
                    i < attack  + decay + sustain ? sustainVolume : i < length - delay ? 
                    (length - i - delay)/release * sustainVolume : 0);

                s = delay ? s/2 + (delay > i ? 0 : (i<length-delay? 1 : (length-i)/delay) * b[i-delay|0]/2/volume) : s;
                if (filter) s = y1 = b2*x2 + b1*(x2=x1) + b0*(x1=s) - a2*y2 - a1*(y2=y1);
            }
            f = (frequency += slide += deltaSlide) * Math.cos(modulation*modOffset++);
            t += f + f*noise*Math.sin(i**5);
            if (jump && ++jump > pitchJumpTime) { frequency += pitchJump; startFrequency += pitchJump; jump = 0; } 
            if (repeatTime && !(++repeat % repeatTime)) { frequency = startFrequency; slide = startSlide; jump ||= 1; }
        }
        return b;
    }
};

function zzfx(...parameters) { return ZZFX.play(...parameters) }

// --- Game Specific Sounds ---
window.sounds = {
    // Jump sound
    jump: () => zzfx(1,0.05,220,0,0.05,0.1,1,1.5,10,0,0,0,0,0,0,0,0,1,0,0,0),
    // Shoot / Cannon fire
    shoot: () => zzfx(1,0.05,150,0,0,0.3,4,1,-5,0,0,0,0,0.5,0,0,0,1,0.1,0,0),
    // Explosion / Hit
    explode: () => zzfx(1,0.05,100,0,0,0.6,4,0,-2,0,0,0,0,1,0,0,0,1,0.2,0,0),
    // Click / Select
    click: () => zzfx(0.6,0.05,800,0,0,0.05,1,1,0,0,0,0,0,0,0,0,0,1,0,0,0),
    // Win / Success
    win: () => zzfx(1,0.05,400,0,0.1,0.5,0,1,0,0,200,0.1,0,0,0,0,0,1,0,0,0),
    // Lose / Error
    lose: () => zzfx(1,0.05,200,0,0,0.5,2,1,-10,0,0,0,0,0,0,0,0,1,0,0,0),
    // Step (footstep)
    step: () => zzfx(0.1,0.05,150,0,0,0.05,4,0,0,0,0,0,0,0.5,0,0,0,1,0,0,0)
};

// Auto-play click sound on all buttons
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        window.sounds.click();
    }
    // Try to play background music on first click if not playing
    if (window.bgMusic && window.bgMusic.paused) {
        window.bgMusic.play().catch(e => console.log("Autoplay blocked"));
    }
});

// --- Background Music Persistence ---
(function() {
    // Robust path detection for the music file
    let musicPath = "assets/audio/bg-track.mp3";
    const loc = window.location.href;
    if (loc.includes('/levels/')) {
        musicPath = "../../assets/audio/bg-track.mp3";
    }
    
    // Check if bgMusic already exists (to avoid double playing if script is loaded twice)
    if (window.bgMusic) return;

    const bgMusic = new Audio(musicPath);
    bgMusic.loop = true;
    bgMusic.volume = 0.25; // Slightly louder as requested
    window.bgMusic = bgMusic;

    // Restore position from localStorage
    const savedTime = localStorage.getItem('bgMusicTime');
    if (savedTime) {
        bgMusic.currentTime = parseFloat(savedTime);
    }

    // Save position periodically and before unload
    setInterval(() => {
        if (!bgMusic.paused) {
            localStorage.setItem('bgMusicTime', bgMusic.currentTime);
        }
    }, 1000);

    window.addEventListener('beforeunload', () => {
        localStorage.setItem('bgMusicTime', bgMusic.currentTime);
    });

    // Handle resume after interaction
    const resumeMusic = () => {
        bgMusic.play().catch(e => console.log("Still blocked:", e));
        // We don't remove the listener immediately in case first click doesn't work
        if (!bgMusic.paused) {
            document.removeEventListener('click', resumeMusic);
            document.removeEventListener('keydown', resumeMusic);
        }
    };
    document.addEventListener('click', resumeMusic);
    document.addEventListener('keydown', resumeMusic);
    
    // Also try to play immediately (might work if already interacted in session)
    bgMusic.play().catch(() => {});
})();
