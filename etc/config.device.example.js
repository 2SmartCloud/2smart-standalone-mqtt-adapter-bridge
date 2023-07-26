module.exports = {
    extension : {
        transform : {
            'camera/$state' : {
                state : {
                    topic       : 'myhome/dafang/motors/state',
                    transformer : (state) => {
                        const statesMapping = {
                            'off' : 'lost',
                            'on'  : 'ready'
                        };

                        return statesMapping[state];
                    }
                }
            },
            'camera/vertical-position' : {
                state : {
                    topic       : 'myhome/dafang/motors/vertical',
                    transformer : (value) => {
                        return +value;
                    }
                }
            },
            'camera/vertical-up' : {
                state : {
                    topic       : 'myhome/dafang/motors/vertical',
                    transformer : (value) => {
                        return 'true';
                    }
                },
                command : {
                    topic       : 'myhome/dafang/motors/vertical/set',
                    transformer : (value) => {
                        return 'UP';
                    }
                }
            },
            'camera/vertical-down' : {
                state : {
                    topic       : 'myhome/dafang/motors/vertical',
                    transformer : (value) => {
                        return 'true';
                    }
                },
                command : {
                    topic       : 'myhome/dafang/motors/vertical/set',
                    transformer : (value) => {
                        return 'DOWN';
                    }
                }
            },
            'leds/blue' : {
                state : {
                    topic       : 'myhome/dafang/leds/blue',
                    transformer : (value) => {
                        if (value === 'ON') return true;

                        return false;
                    }
                },
                command : {
                    topic       : 'myhome/dafang/leds/blue/set',
                    transformer : (value) => {
                        if (value === 'true') return 'ON';

                        return 'OFF';
                    }
                }
            },
            'power/state' : {
                state : {
                    topic       : 'stat/tasmota/RESULT', // -> {"POWER":"OFF"}
                    transformer : (value) => {
                        const { POWER } = value;

                        return POWER === 'ON'; // -> true | false
                    },
                    parser : 'JSON'
                },
                command : {
                    topic       : 'cmnd/tasmota/POWER',
                    transformer : (value) => { // -> true | false
                        return value === 'true' ? 'ON' : 'OFF';
                    }
                }
            },
            'temp/outside-temperature' : {
                state : {
                    topic       : 'test1/sensor/outside_temperature/state',
                    transformer : (value) => {
                        return +value;
                    }
                }
            },
            'temp/outside-temperature/$unit' : {
                state : {
                    topic       : 'homeassistant/sensor/test1/outside_temperature/config',
                    transformer : (value) => {
                        return value.unit_of_measurement;
                    },
                    parser : 'JSON'
                }
            },
            'temp/$options/availability' : {
                state : {
                    topic       : 'test1/status',
                    transformer : (value) => {
                        return value;
                    }
                }
            }
        }
    },
    deviceConfig : {
        nodes : [
            {
                id      : 'leds',
                name    : 'leds',
                sensors : [
                    {
                        id       : 'blue',
                        name     : 'blue',
                        dataType : 'boolean',
                        settable : 'true',
                        retained : 'true'
                    }
                ]
            },
            {
                id      : 'camera',
                name    : 'camera',
                sensors : [
                    {
                        id       : 'vertical-position',
                        name     : 'vertical-position',
                        dataType : 'integer',
                        settable : 'false',
                        retained : 'true'
                    },
                    {
                        id       : 'vertical-up',
                        name     : 'vertical-up',
                        dataType : 'boolean',
                        settable : 'true',
                        retained : 'false'
                    },
                    {
                        id       : 'vertical-down',
                        name     : 'vertical-down',
                        dataType : 'boolean',
                        settable : 'true',
                        retained : 'false'
                    }
                ]
            },
            {
                id      : 'power',
                name    : 'Power',
                sensors : [
                    {
                        id       : 'state',
                        name     : 'state',
                        dataType : 'boolean',
                        settable : 'true',
                        retained : 'true'
                    }
                ]
            },
            {
                id      : 'temp',
                name    : 'Outside Temperature',
                options : [
                    {
                        id       : 'availability',
                        name     : 'availability',
                        dataType : 'string',
                        settable : 'false',
                        retained : 'true'
                    }
                ],
                sensors : [
                    {
                        id       : 'outside-temperature',
                        name     : 'outside-temperature',
                        dataType : 'integer',
                        settable : 'false',
                        retained : 'true',
                        unit     : '°C'
                    }
                ]
            }
        ]
    }
};
