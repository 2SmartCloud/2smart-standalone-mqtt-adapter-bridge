const BaseTransport = require('homie-sdk/lib/Bridge/BasePropertyTransport');

const PARSERS = {
    'PLAIN' : (value) => value,
    'JSON'  : (value) => JSON.parse(value)
};

class MQTTAdapterTransport extends BaseTransport {
    constructor(config, transforms = {}) {
        super({ ...config, pollInterval: 0 });
        this.transforms = transforms;
        this.handleConnected = this.handleConnected.bind(this);
    }

    attachProperty(property) {
        this.property = property;
    }

    async defaultStateTransformer(value) {
        return value;
    }

    async defaultCommandTransformer(value) {
        return value;
    }

    async set() {} // this method is empty because all values are set through adapter handlers in init method

    attachBridge(bridge) {
        super.attachBridge(bridge);
        this.debug = bridge.debug;
        this.bridge.connection.once('connected', this.handleConnected);
    }

    detachBridge() {
        this.bridge.connection.off('connected', this.handleConnected);
        super.detachBridge();
    }

    initTransforms() {
        const connectionTransport = this.bridge.connection.transport;

        Object.keys(this.transforms).forEach(transformTopic => {
            const transform = this.transforms[transformTopic];

            if (!transform.state && !transform.command) {
                this.debug.warning(
                    'MQTTAdapterTransport.handleConnected',
                    `Transport object for ${this.id} property must contain state or command field`
                );

                return;
            }

            const topicLevels = transformTopic.split('/');

            const handlersByNumberOfTopicLevels = {
                2 : () => {
                    if (transform.state) {
                        connectionTransport.on('message', async (topic, message) => {
                            if (topic === transform.state.topic) {
                                const valueParser = transform.state.parser ?
                                    PARSERS[transform.state.parser] :
                                    PARSERS.PLAIN;
                                const parsedValue = valueParser(message.toString());
                                const stateTransformer = transform.state.transformer || this.defaultStateTransformer;
                                const newData = await stateTransformer(parsedValue);
                                await this.handleNewData(newData, true);
                            }
                        });
                        connectionTransport.subscribe(transform.state.topic);
                    }

                    if (transform.command) {
                        this.property.homieEntity.onAttributeSet(async ({ field, value }) => {
                            if (field === 'value') {
                                const valueParser = transform.command.parser ?
                                    PARSERS[transform.command.parser] :
                                    PARSERS.PLAIN;
                                const parsedValue = valueParser(value);
                                const commandTransformer = transform.command.transformer
                                    || this.defaultCommandTransformer;
                                const transformedData = await commandTransformer(parsedValue);

                                connectionTransport.publish(transform.command.topic, transformedData, {
                                    retain : this.property.retained
                                });

                                const successTopic = transform.state.topic;
                                const errorTopic = this.property.homieEntity._getErrorEventName();

                                return this.bridge.homie.createPromisedEvent(
                                    successTopic,
                                    errorTopic,
                                    (data) => !!data.value,
                                    (data) => !!data.value
                                );
                            }
                        });
                    }
                },
                3 : (nodeId, propertyTypeOrSensorId, propertyIdOrSensorAttribute) => {
                    const isPropertyType = propertyTypeOrSensorId.charAt(0) === '$';
                    // if second level is property type than it is option or telemetry
                    // topic and it must be processed same as sensor topic(with 2 topic levels)
                    if (isPropertyType) return handlersByNumberOfTopicLevels['2']();

                    const sensorAttribute = propertyIdOrSensorAttribute.replace('$', '');

                    if (transform.state) {
                        connectionTransport.on('message', async (topic, message) => {
                            if (topic === transform.state.topic) {
                                const valueParser = transform.state.parser ?
                                    PARSERS[transform.state.parser] :
                                    PARSERS.PLAIN;
                                const parsedValue = valueParser(message.toString());
                                const stateTransformer = transform.state.transformer || this.defaultStateTransformer;
                                const newData = await stateTransformer(parsedValue);
                                this.property.publishAttribute(sensorAttribute, newData, true);
                            }
                        });
                        connectionTransport.subscribe(transform.state.topic);
                    }
                },
                4 : (nodeId, propertyType, propertyId, attribute) => {
                    const propertyAttribute = attribute.replace('$', '');

                    if (transform.state) {
                        connectionTransport.on('message', async (topic, message) => {
                            if (topic === transform.state.topic) {
                                const valueParser = transform.state.parser ?
                                    PARSERS[transform.state.parser] :
                                    PARSERS.PLAIN;
                                const parsedValue = valueParser(message.toString());
                                const stateTransformer = transform.state.transformer || this.defaultStateTransformer;
                                const newData = await stateTransformer(parsedValue);
                                this.property.publishAttribute(propertyAttribute, newData, true);
                            }
                        });
                        connectionTransport.subscribe(transform.state.topic);
                    }
                }
            };

            const handler = handlersByNumberOfTopicLevels[topicLevels.length];
            handler(...topicLevels);
        });
    }

    handleConnected() {
        this.debug.info('MQTTAdapterTransport.handleConnected', `init transport for ${this.id} property`);
        this.initTransforms();
        this.debug.info('MQTTAdapterTransport.handleConnected', `finish init transport for ${this.id} property`);
    }
}

module.exports = MQTTAdapterTransport;
