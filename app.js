/* eslint-disable no-param-reassign */
const Debugger = require('homie-sdk/lib/utils/debugger');
const X        = require('homie-sdk/lib/utils/X');
const LIVR     = require('livr');

const parseConfigTransform       = require('./utils/config-parser');
const configValidationExtraRules = require('./utils/config-validation-extra-rules');
const MQTTAdapterBridge          = require('./lib/mqtt-adapter-bridge/MQTTAdapterBridge');

const {
    MQTT_USER,
    MQTT_PASS,
    MQTT_URI,
    DEVICE_NAME,
    DEBUG
} = process.env;

const PROPERTY_DATATYPES = [ 'integer', 'float', 'boolean', 'string', 'enum', 'color' ];

// Configuration of LIVR
LIVR.Validator.defaultAutoTrim(true);
LIVR.Validator.registerDefaultRules(configValidationExtraRules);

// Configuration of debugger
const debug = new Debugger(DEBUG || '');
// Initialize debugger
debug.initEvents();

(async () => {
    try {
        const config = require('/etc/config.device.js');

        const propertiesValidation =  { 'list_of_objects' : {
            id       : [ 'required', 'string' ],
            name     : 'string',
            dataType : { 'one_of': PROPERTY_DATATYPES },
            settable : { 'one_of': [ 'true', 'false' ] },
            retained : { 'one_of': [ 'true', 'false' ] },
            unit     : 'string'
        } };

        const validator = new LIVR.Validator({
            extension : [ 'required', {
                'nested_object' : {
                    transform : 'transform_dictionary'
                }
            } ],
            deviceConfig : [ 'required', {
                'nested_object' :
                {
                    nodes : [ 'not_empty_list', { 'list_of_objects' : {
                        id        : [ 'required', 'string' ],
                        name      : [ 'required', 'string' ],
                        sensors   : propertiesValidation,
                        options   : propertiesValidation,
                        telemetry : propertiesValidation
                    } } ]
                }
            } ]
        });
        const validated = validator.validate(config);

        if (!validated) {
            throw new X({
                message : 'Wrong config',
                code    : 'WRONG_CONFIG',
                fields  : {
                    ...validator.getErrors()
                }
            });
        }

        // eslint-disable-next-line prefer-const
        let { deviceConfig, extension: { transform } } = validated;

        deviceConfig = parseConfigTransform(deviceConfig, transform);

        const mqttAdapterBridgeConfig = {
            mqttConnection : {
                username : MQTT_USER,
                password : MQTT_PASS,
                uri      : MQTT_URI
            },
            device : {
                id   : MQTT_USER,
                name : DEVICE_NAME,
                ...deviceConfig
            }
        };

        const mqttAdapterBridge = new MQTTAdapterBridge({ ...mqttAdapterBridgeConfig, debug });

        mqttAdapterBridge.on('error', err => {
            debug.error(err);
        });

        mqttAdapterBridge.on('exit', (reason, exitCode) => {
            debug.error(reason);
            process.exit(exitCode);
        });

        // Initialize MQTT adapter bridge
        await mqttAdapterBridge.init();
    } catch (err) {
        debug.error(err);

        const timeoutToExit = 3000;
        setTimeout(() => process.exit(1), timeoutToExit); // wait for a while to write error to logs
    }
})();

