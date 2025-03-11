const { Structure } = require('erela.js');

module.exports = Structure.extend('Player', Player => {
        class lavaplayer extends Player {
                constructor(...args) {
                        super(...args);
                        this.speed = 1;
                        this.pitch = 1;
                        this.rate = 1;
            this._8d = false;
                        this.nightcore = false;
                        this.vaporwave = false;
                        this.bassboost = false;
                        this.distortion = false;
                
                  
                }
        set8D(value) {
            if(typeof value !== "boolean") {throw new RangeError(`[ set8D Function Error ]: Please provide a valid value (ture/false).`);}
    
            if(!this.filters) this.filters = true;
            this._8d = value;
    
            if(this._8d) {
                this.node.send({
                    op: "filters",
                    guildId: this.guild,
                    rotation: {
                        rotationHz: 0.2
                    }
                });
            } else {
                this.node.send({
                    op: "filters",
                    guildId: this.guild,
                    rotation: {
                       rotationHz: 0.0 
                    }
                });
            };
    
            return this;
        };
                setSpeed(speed) {
                        if (isNaN(speed)) {throw new RangeError('Player#setSpeed() Speed must be a number.');}
                        this.speed = Math.max(Math.min(speed, 5), 0.05);
                        this.setTimescale(speed);
                        return this;
                }
                setPitch(pitch) {
                        if (isNaN(pitch)) {throw new RangeError('Player#setPitch() Pitch must be a number.');}
                        this.pitch = Math.max(Math.min(pitch, 5), 0.05);
                        this.setTimescale(this.speed, pitch);
                        return this;
                }

                setNightcore(nighcore) {
                        if (typeof nighcore !== 'boolean') {throw new RangeError('Player#setNighcore() Nightcore can only be "true" or "false".');}

                        this.nightcore = nighcore;
                        if(nighcore) {
                                this.bassboost = false;
                                this.distortion = false;
                                this.vaporwave = false;
                                this.setVaporwave(false);
                                this.setBassboost(false);
                                this.setDistortion(false);
                                this.setTimescale(1.2999999523162842, 1.2999999523162842, 1);
                        } else {
                                this.setTimescale(1, 1, 1);
                        }
                        return this;
                }

                setVaporwave(vaporwave) {
                        if (typeof vaporwave !== 'boolean') {throw new RangeError('Player#setVaporwave() Vaporwave can only be "true" or "false".');}

                        this.vaporwave = vaporwave;
                        if(vaporwave) {
                                this.nightcore = false;
                                this.bassboost = false;
                                this.distortion = false;
                                this.setBassboost(false);
                                this.setNightcore(false);
                                this.setDistortion(false);
                                this.setTimescale(0.8500000238418579, 0.800000011920929, 1);
                        } else {
                                this.setTimescale(1, 1, 1);
                        }
                        return this;
                }

                setDistortion(distortion) {
                        if (typeof distortion !== 'boolean') {throw new RangeError('Player#setDistortion() Distortion can only be "true" or "false"');}

                        this.distortion = distortion;
                        if(distortion) {
                                this.nightcore = false;
                                this.vaporwave = false;
                                this.bassboost = false;
                                this.setBassboost(false);
                                this.setNightcore(false);
                                this.setVaporwave(false);
                                this.setDistort(0.5);
                        } else {
                                this.clearEffects();
                        }
                        return this;
                }

                setBassboost(bassboost) {
                        if (typeof bassboost !== 'boolean') {throw new RangeError('Player#setBassboost() Bassboost can only be "true" or "false".');}

                        this.bassboost = bassboost;
                        if(bassboost) {
                                this.nightcore = false;
                                this.vaporwave = false;
                                this.setVaporwave(false);
                                this.setNightcore(false);
                                
                                // Enhanced bassboost with multiple bands for better quality
                                this.node.send({
                                        op: 'filters',
                                        guildId: this.guild,
                                        equalizer: [
                                                { band: 0, gain: 0.6 },  // 25 Hz
                                                { band: 1, gain: 0.7 },  // 40 Hz
                                                { band: 2, gain: 0.8 },  // 63 Hz
                                                { band: 3, gain: 0.8 },  // 100 Hz
                                                { band: 4, gain: 0.6 },  // 160 Hz
                                                { band: 5, gain: 0.3 },  // 250 Hz
                                                { band: 6, gain: 0.0 },  // 400 Hz
                                                { band: 7, gain: 0.0 },  // 630 Hz
                                                { band: 8, gain: 0.0 },  // 1 kHz
                                                { band: 9, gain: 0.0 },  // 1.6 kHz
                                                { band: 10, gain: 0.0 }, // 2.5 kHz
                                                { band: 11, gain: 0.0 }, // 4 kHz
                                                { band: 12, gain: 0.0 }, // 6.3 kHz
                                                { band: 13, gain: 0.0 }, // 10 kHz
                                                { band: 14, gain: 0.0 }, // 16 kHz
                                        ],
                                });
                        } else {
                                this.clearEffects();
                        }
                        return this;
                }

                setDistort(value) {
                        this.value = value || this.value;

                        this.node.send({
                                op: 'filters',
                                guildId: this.guild,
                                distortion: {
                                        distortion: this.value,
                                },
                        });
                        return this;
                }

                setEqualizer(band, gain) {
                        this.band = band || this.band;
                        this.gain = gain || this.gain;

                        this.node.send({
                                op: 'filters',
                                guildId: this.guild,
                                equalizer: [
                                        {
                                                band: this.band,
                                                gain: this.gain,
                                        },
                                        {
                                                band: this.band,
                                                gain: this.gain,
                                        },
                                        {
                                                band: this.band,
                                                gain: this.gain,
                                        },
                                        {
                                                band: this.band,
                                                gain: this.gain,
                                        },
                                        {
                                                band: this.band,
                                                gain: this.gain,
                                        },
                                        {
                                                band: this.band,
                                                gain: this.gain,
                                        },
                                ],
                        });
                        return this;
                }

                setTimescale(speed, pitch, rate) {
                        this.speed = speed || this.speed;
                        this.pitch = pitch || this.pitch;
                        this.rate = rate || this.rate;

                        this.node.send({
                                op: 'filters',
                                guildId: this.guild,
                                timescale: {
                                        speed: this.speed,
                                        pitch: this.pitch,
                                        rate: this.rate,
                                },
                        });
                        return this;
                }
                clearEffects() {
                        this.speed = 1;
                        this.pitch = 1;
                        this.rate = 1;
                        this.bassboost = false;
                        this.nightcore = false;
                        this.vaporwave = false;
                        this.distortion = false;
                        this.clearEQ();

                        this.node.send({
                                op: 'filters',
                                guildId: this.guild,
                        });
                        return this;
                }
        }
        return lavaplayer;
});