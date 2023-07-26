const Debugger = require('homie-sdk/lib/utils/debugger');

const MQTTAdapterBridge    = require('../lib/mqtt-adapter-bridge/MQTTAdapterBridge');
const adapterConfig        = require('./fixtures/__mocks__/adapter-config');
const parseConfigTransport = require('../utils/config-parser');

// Configuration of debugger
const debug = new Debugger('');
// Initialize debugger
debug.initEvents();

let mqttAdapterBridge;
let transport;

function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

jest.setTimeout(10000);

describe('MQTT adapter', () => {
    beforeAll(async () => {
        const deviceConfig = parseConfigTransport(adapterConfig.deviceConfig, adapterConfig.extension.transform);

        const mqttAdapterBridgeConfig = {
            mqttConnection : {
                username : process.env.MQTT_USER,
                password : process.env.MQTT_PASS,
                uri      : process.env.MQTT_URI
            },
            device : {
                id   : 'mqtt-adapter-test-device-id',
                name : 'MQTT test adapter',
                ...deviceConfig
            }
        };

        mqttAdapterBridge = new MQTTAdapterBridge({ ...mqttAdapterBridgeConfig, debug });

        await mqttAdapterBridge.init();
        await wait(500); // time to publish all topics

        transport = mqttAdapterBridge.connection.transport;
    });

    afterAll(async () => {
        const { homieMigrator, deviceBridge: { homieEntity } } = mqttAdapterBridge;
        homieMigrator.deleteDevice(homieEntity);

        await wait(500);
        mqttAdapterBridge.destroy();
    });

    test('Node: publish value from state topic to node $state attribute topic', done => {
        const device = mqttAdapterBridge.deviceBridge.homieEntity;
        const node = device.getNodeById('camera');

        const dataToPublish = 'off';
        const expectedDataToReceive = adapterConfig.extension.transform['camera/$state'].state.transformer(dataToPublish);

        node._subscribeToPublish(({ field, value }) => {
            if (field === 'state') {
                try {
                    expect(value).toBe(expectedDataToReceive);
                    done();
                } catch (err) {
                    done(err);
                }
            }
        });

        transport.publish(adapterConfig.extension.transform['camera/$state'].state.topic, dataToPublish);
    });

    test('Sensor: publish value from state topic to sensor topic', done => {
        const device = mqttAdapterBridge.deviceBridge.homieEntity;
        const node = device.getNodeById('camera');
        const sensor = node.getSensorById('vertical-position');

        const dataToPublish = '123';

        sensor.onAttributePublish(({ value }) => {
            try {
                expect(value).toBe(dataToPublish);
                done();
            } catch (err) {
                done(err);
            }
        });

        transport.publish(adapterConfig.extension.transform['camera/vertical-position'].state.topic, dataToPublish);
    });

    test('Option: publish value from state topic to sensor topic', done => {
        const device = mqttAdapterBridge.deviceBridge.homieEntity;
        const node = device.getNodeById('temp');
        const sensor = node.getOptionById('availability');

        const dataToPublish = 'available';

        sensor.onAttributePublish(({ value }) => {
            try {
                expect(value).toBe(dataToPublish);
                done();
            } catch (err) {
                done(err);
            }
        });

        transport.publish(adapterConfig.extension.transform['temp/$options/availability'].state.topic, dataToPublish);
    });

    test('Sensor: send value to command topic and publish transformed value from state topic', done => {
        const device = mqttAdapterBridge.deviceBridge.homieEntity;
        const node = device.getNodeById('camera');
        const sensor = node.getSensorById('vertical-up');

        const stateTopic = adapterConfig.extension.transform['camera/vertical-up'].state.topic;
        const commandTopic = adapterConfig.extension.transform['camera/vertical-up'].command.topic;

        const dataToPublish = 'true';
        const stateData = adapterConfig.extension.transform['camera/vertical-up'].state.transformer(dataToPublish);
        const commandData = adapterConfig.extension.transform['camera/vertical-up'].command.transformer(dataToPublish);

        sensor.onAttributePublish(({ value }) => {
            expect(value).toBe(stateData);
            done();
        });
        transport.on('message', (topic, message) => {
            if (topic === commandTopic) {
                const value = message.toString();
                expect(value).toBe(commandData);
                transport.publish(stateTopic, '123');
            }
        });
        transport.subscribe(commandTopic);

        sensor.setAttribute('value', dataToPublish);
    });

    test('Sensor: send value to command topic and publish JSON parsed value from state topic', done => {
        const device = mqttAdapterBridge.deviceBridge.homieEntity;
        const node = device.getNodeById('power');
        const sensor = node.getSensorById('state');

        const stateTopic = adapterConfig.extension.transform['power/state'].state.topic;
        const commandTopic = adapterConfig.extension.transform['power/state'].command.topic;

        const dataToPublish = 'true';
        const stateResponse = JSON.stringify({ POWER: 'ON' });
        const stateData = adapterConfig.extension.transform['power/state'].state.transformer(JSON.parse(stateResponse));
        const commandData = adapterConfig.extension.transform['power/state'].command.transformer(dataToPublish);

        sensor.onAttributePublish(({ value }) => {
            expect(value).toBe(stateData.toString());
            done();
        });
        transport.on('message', (topic, message) => {
            if (topic === commandTopic) {
                const value = message.toString();
                expect(value).toBe(commandData);
                transport.publish(stateTopic, stateResponse);
            }
        });
        transport.subscribe(commandTopic);

        sensor.setAttribute('value', dataToPublish);
    });

    test('Sensor attribute: publish JSON parsed value from state topic', done => {
        const device = mqttAdapterBridge.deviceBridge.homieEntity;
        const node = device.getNodeById('temp');
        const sensor = node.getSensorById('outside-temperature');
        const attribute = 'unit';

        const stateTopic = adapterConfig.extension.transform['temp/outside-temperature/$unit'].state.topic;

        const stateResponse = JSON.stringify({ unit_of_measurement : '°C' });
        const stateData = adapterConfig.extension.transform['temp/outside-temperature/$unit'].state.transformer(JSON.parse(stateResponse));

        sensor.onAttributePublish(({ field, value }) => {
            if (field === attribute) {
                expect(value).toBe(stateData.toString());
                done();
            }
        });

        transport.publish(stateTopic, stateResponse);
    });

    test('Telemetry attribute: publish JSON parsed value from state topic', done => {
        const device = mqttAdapterBridge.deviceBridge.homieEntity;
        const node = device.getNodeById('temp');
        const sensor = node.getTelemetryById('inside-temperature');
        const attribute = 'unit';

        const stateTopic = adapterConfig.extension.transform['temp/$telemetry/inside-temperature/$unit'].state.topic;

        const stateResponse = JSON.stringify({ unit_of_measurement : '°C' });
        const stateData = adapterConfig.extension.transform['temp/$telemetry/inside-temperature/$unit'].state.transformer(JSON.parse(stateResponse));

        sensor.onAttributePublish(({ field, value }) => {
            if (field === attribute) {
                expect(value).toBe(stateData.toString());
                done();
            }
        });

        transport.publish(stateTopic, stateResponse);
    });
});
