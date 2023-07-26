# MQTT adapter

## Configuration object format
```javascript
module.exports = {
    extension: {     // required field
        // transform describes adapter rules: how homie convention topics correlates with any other MQTT convention topics
        // transform is an object or dictionary, where key is one of the subtopics of the next formats:
        //   - <node-id>/$<node-attribute>
        //   - <node-id>/<sensor-id>
        //   - <node-id>/<sensor-id>/$<attribute>
        //   - <node-id>/$<property-type>/<property-id>
        //   - <node-id>/$<property-type>/<property-id>/$<attribute>
        // where:
        //   <node-attribute> - "state"
        //   <property-type> - "options" or "telemetry"
        //   <attribute> - one of the available property attributes
        // examples:
        //   - camera/$state
        //   - camera/vertical-position
        //   - temperature/outside-temperature/$unit
        //   - temperature/$options/availability 
        //   - temperature/$telemetry/inside-temperature/$unit
        // 
        // key describe to which homie topic apply the rule
        // the value by key is an object that has next format:
        // {
        //     state: { // object that explain from which topic get the value and how to transform it before setting
        //         topic: 'your/mqtt/convention/state/topic', // topic from which get the value
        //         transformer: (value) => { // function that will be applied to the value received from the state topic
        //              return value;
        //         }
        //     },
        //     command: { // object that explain to which topic publish the value and how to transform it 
        //         topic : 'your/mqtt/convention/command/topic' // topic to which publish the value
        //         transformer: (value) => { // function that will be applied to the value that we published to the command topic
        //             return value;
        //         }
        //     }
        // }
        transform: { // required field
            'node-id/$state': {
                state: {
                    topic: 'your/mqtt/convention/node/state/attribute/topic',
                    transformer: (state) => {
                        const statesMapping = {
                            'off': 'lost',
                            'on': 'ready'
                        };

                        return statesMapping[state];
                    }
                }
            },
            'node-id/sensor-id': {
                state: {
                    topic: 'your/mqtt/convention/sensor/state/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }
                },
                command: {
                    topic: 'your/mqtt/convention/sensor/command/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }                
                }
            },
            'node-id/sensor-id/$unit': { // may be another sensor attribute you want
                state: {
                    topic: 'your/mqtt/convention/sensor/unit/state/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }
                },
                command: {
                    topic: 'your/mqtt/convention/sensor/unit/command/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }                
                }
            },
            'node-id/$options/option-id': {
                state: {
                    topic: 'your/mqtt/convention/option/state/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }
                },
                command: {
                    topic: 'your/mqtt/convention/option/command/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }                
                }
            },
            'node-id/$options/option-id/$unit': { // may be another option attribute you want 
                state: {
                    topic: 'your/mqtt/convention/option/unit/state/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }
                },
                command: {
                    topic: 'your/mqtt/convention/option/unit/command/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }                
                }
            },
            'node-id/$telemetry/telemetry-id': {
                state: {
                    topic: 'your/mqtt/convention/telemetry/state/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }
                },
                command: {
                    topic: 'your/mqtt/convention/telemetry/command/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }                
                }
            },
            'node-id/$telemetry/telemetry-id/$unit': { // may be another telemetry attribute you want
                state: {
                    topic: 'your/mqtt/convention/telemetry/unit/state/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }
                },
                command: {
                    topic: 'your/mqtt/convention/telemetry/unit/command/topic',
                    transformer: (value) => {
                        // make some value modification if needed
                        return value;
                    }                
                }
            }
        }
    },
    deviceConfig: { // required field
        nodes: [    // required field, must contain one node object at least
            {
                id: 'node-id',     // required field
                name: 'node-name', // required field
                sensors: [         // optional field(if is present, must contain one sensor object at least)
                    {
                        id: 'sensor-id', // required field
                        name: 'sensor-name',
                        dataType: 'integer',
                        settable: 'true',
                        retained: 'true'
                    },
                    // put another sensors here
                ],
                options: [         // optional field(if is present, must contain one option object at least)
                    {
                        id: 'option-id', // required field
                        name: 'option-name',
                        dataType: 'integer',
                        settable: 'true',
                        retained: 'true'
                    },
                    // put another options here
                ],
                telemetry: [       // optional field(if is present, must contain one telemetry object at least)
                    {
                        id: 'telemetry-id', // required field
                        name: 'telemetry-name',
                        dataType: 'integer',
                        settable: 'true',
                        retained: 'true'
                    },
                    // put another telemetry here
                ]
            } 
        ]
    }
};
```

## Node state attribute topic configuration
Node state attribute value can be one of the next types by Homie convention:

* **init**: this is the state the node is in when it is connected to the MQTT broker, but has not yet sent all Homie messages and is not yet ready to operate. This state is optional, and may be sent if the node takes a long time to initialize, but wishes to announce to consumers that it is coming online.
* **ready**: this is the state the node is in when it is connected to the MQTT broker, has sent all Homie messages and is ready to operate. A Homie Controller can assume default values for all optional topics.
* **disconnected**: this is the state the node is in when it is cleanly disconnected from the MQTT broker. You must send this message before cleanly disconnecting.
* **sleeping**: this is the state the node is in when the node is sleeping. You have to send this message before sleeping.
* **lost**: this is the state the node is in when the node has been “badly” disconnected. You must define this message as LWT.
* **alert**: this is the state the node is when connected to the MQTT broker, but something wrong is happening. E.g. a sensor is not providing data and needs human intervention. You have to send this message when something is wrong.

The main goal is to map state what you receive from state topic in transformer function to one of the Homie convention state types according to description above 
####Important: if transformer function returns type different from Homie convention types above then "alert" state will be published

### Example
```javascript
   // let assume that state topic can take two state values:
   //   "on"  - if node is successfully connected and ready for work
   //   "off" - if node is disconnected from MQTT broker 
   'node-id/$state': {
       state: {
           topic: 'your/mqtt/convention/node/state/attribute/topic',
           transformer: (state) => { 
               const statesMapping = {
                   'off': 'lost',     // mapping for "off" value according to Homie state type
                   'on': 'ready'      // mapping for "on" value according to Homie state type
               };

               return statesMapping[state];
           }
       }
   }
```

## Xiaomi Dafang camera configuration example
```javascript
module.exports = {
    extension : {
        transform : {
            'camera-vertical-motors/vertical-position' : {
                state : {
                    topic       : 'myhome/dafang/motors/vertical',
                    transformer : (value) => {
                        return +value;
                    }
                }
            },
            'camera-vertical-motors/vertical-up' : {
                state : {
                    topic       : 'myhome/dafang/motors/vertical',
                    transformer : (value) => {
                        return 'true';
                    }
                },
                command : {
                    topic       : 'myhome/dafang/motors/vertical/set',
                    transformer : (value) => {
                        return 'up';
                    }
                }
            },
            'camera-vertical-motors/vertical-down' : {
                state : {
                    topic       : 'myhome/dafang/motors/vertical',
                    transformer : (value) => {
                        return 'true';
                    }
                },
                command : {
                    topic       : 'myhome/dafang/motors/vertical/set',
                    transformer : (value) => {
                        return 'down';
                    }
                }
            },
            'camera-horizontal-motors/horizontal-position' : {
                state : {
                    topic       : 'myhome/dafang/motors/horizontal',
                    transformer : (value) => {
                        return +value;
                    }
                }
            },
            'camera-horizontal-motors/horizontal-right' : {
                state : {
                    topic       : 'myhome/dafang/motors/horizontal',
                    transformer : (value) => {
                        return 'true';
                    }
                },
                command : {
                    topic       : 'myhome/dafang/motors/horizontal/set',
                    transformer : (value) => {
                        return 'right';
                    }
                }
            },
            'camera-horizontal-motors/horizontal-left' : {
                state : {
                    topic       : 'myhome/dafang/motors/horizontal',
                    transformer : (value) => {
                        return 'true';
                    }
                },
                command : {
                    topic       : 'myhome/dafang/motors/horizontal/set',
                    transformer : (value) => {
                        return 'left';
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
            'call-the-police/call' : {
                state : {
                    topic       : 'myhome/dafang/play',
                    transformer : (value) => {

                        return false;
                    }
                },
                command : {
                    topic       : 'myhome/dafang/play',
                    transformer : (value) => {
                        return '';
                    }
                }
            },
            'leds/yellow' : {
                state : {
                    topic       : 'myhome/dafang/leds/yellow',
                    transformer : (value) => {
                        if (value === 'ON') return true;

                        return false;
                    }
                },
                command : {
                    topic       : 'myhome/dafang/leds/yellow/set',
                    transformer : (value) => {
                        if (value === 'true') return 'ON';

                        return 'OFF';
                    }
                }
            }
        }
    },
    deviceConfig : {
        nodes : [
          {
                id      : 'call-the-police',
                name    : 'Call the Police',
                sensors : [
                    {
                        id       : 'call',
                        name     : 'CALL',
                        dataType : 'boolean',
                        settable : 'true',
                        retained : 'false'
                    }
                ]
            },
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
                    },
                    {
                        id       : 'yellow',
                        name     : 'blue',
                        dataType : 'boolean',
                        settable : 'true',
                        retained : 'true'
                    }
                ]
            },
            {
                id      : 'camera-horizontal-motors',
                name    : 'camera',
                sensors : [
                    {
                        id       : 'horizontal-position',
                        name     : 'horizontal-position',
                        dataType : 'integer',
                        settable : 'false',
                        retained : 'true'
                    },
                    {
                        id       : 'horizontal-left',
                        name     : 'horizontal-left',
                        dataType : 'boolean',
                        settable : 'true',
                        retained : 'false'
                    },
                    {
                        id       : 'horizontal-right',
                        name     : 'horizontal-right',
                        dataType : 'boolean',
                        settable : 'true',
                        retained : 'false'
                    }
                ]
            },
            {
                id      : 'camera-vertical-motors',
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
            }
        ]
    }
};
```

