const BaseNodeBridge     = require('homie-sdk/lib/Bridge/BaseNode');
const BasePropertyBridge = require('homie-sdk/lib/Bridge/BaseProperty');

const PropertyBridge  = require('./PropertyBridge');
const StaticTransport = require('./transports/MQTTAdapterTransport');

const NODE_STATES = [ 'init', 'ready', 'disconnected', 'sleeping', 'lost', 'alert' ];

const PARSERS = {
    'PLAIN' : (value) => value,
    'JSON'  : (value) => JSON.parse(value)
};

class NodeBridge extends BaseNodeBridge {
    constructor(config, { debug } = {}) {
        super({
            ...config,
            transports : null,
            options    : null,
            telemetry  : null,
            sensors    : null
        }, { debug });

        this.transforms = config.nodeTransforms;
        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);

        if (config.options) {
            for (let option of config.options) {
                if (!(option instanceof BasePropertyBridge)) {
                    const options = {
                        type      : 'option',
                        transport : new StaticTransport({ id: option.name }, option.transforms)
                    };

                    option = new PropertyBridge(option, options);
                    option.transport.attachProperty(option);
                }

                this.addOption(option);
            }
        }

        if (config.telemetry) {
            for (let telemetry of config.telemetry) {
                if (!(telemetry instanceof BasePropertyBridge)) {
                    const options = {
                        type      : 'telemetry',
                        transport : new StaticTransport({ id: telemetry.name }, telemetry.transforms)
                    };

                    telemetry = new PropertyBridge(telemetry, options);
                    telemetry.transport.attachProperty(telemetry);
                }

                this.addTelemetry(telemetry);
            }
        }

        if (config.sensors) {
            for (let sensor of config.sensors) {
                if (!(sensor instanceof BasePropertyBridge)) {
                    const options = {
                        type      : 'sensor',
                        transport : new StaticTransport({ id: sensor.name }, sensor.transforms)
                    };

                    sensor = new PropertyBridge(sensor, options);
                    sensor.transport.attachProperty(sensor);
                }

                this.addSensor(sensor);
            }
        }
    }

    async defaultStateTransformer(value) {
        return value;
    }

    initTransforms() {
        const connectionTransport = this.bridge.connection.transport;

        Object.keys(this.transforms).forEach(transformTopic => {
            const transform = this.transforms[transformTopic];

            if (!transform.state) {
                this.debug.warning(
                    'MQTTAdapterTransport.handleConnected',
                    `Transport object for node with id "${this.id}" must contain state field`
                );

                return;
            }

            const [ , attribute ] = transformTopic.split('/');
            const attributeName = attribute.replace('$', '');

            if (attributeName === 'state') { // current supported node attribute
                connectionTransport.on('message', async (topic, message) => {
                    if (topic === transform.state.topic) {
                        const valueParser = transform.state.parser ?
                            PARSERS[transform.state.parser] :
                            PARSERS.PLAIN;
                        const parsedValue = valueParser(message.toString());
                        const stateTransformer = transform.state.transformer || this.defaultStateTransformer;
                        const newData = await stateTransformer(parsedValue);
                        // Publish "lost" state if state transformer returns not homie convention state type
                        const stateToPublish = NODE_STATES.includes(newData) ? newData : 'alert';
                        this.homieEntity.publishAttribute(attributeName, stateToPublish, true);
                    }
                });
                connectionTransport.subscribe(transform.state.topic);
            }
        });
    }

    attachBridge(bridge) {
        super.attachBridge(bridge);
        this.bridge.connection.on('connected', this.handleConnected);
        this.bridge.connection.on('disconnected', this.handleDisconnected);
    }

    detachBridge() {
        this.bridge.connection.off('connected', this.handleConnected);
        this.bridge.connection.off('disconnected', this.handleDisconnected);
        super.detachBridge();
    }

    async handleConnected() {
        this.connected = true;
        this.debug.info('NodeBridge.handleConnected', `init transport for node with id "${this.id}"`);
        this.initTransforms();
        this.debug.info('NodeBridge.handleConnected', `finish init transport for node with id "${this.id}"`);
    }

    async handleDisconnected() {
        this.connected = false;
    }
}

module.exports = NodeBridge;
