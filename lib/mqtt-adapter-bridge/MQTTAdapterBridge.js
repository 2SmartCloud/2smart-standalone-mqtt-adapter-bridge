const BaseBridge = require('homie-sdk/lib/Bridge/Base');

const DeviceBridge          = require('./DeviceBridge');
const MQTTAdapterConnection = require('./MQTTAdapterConnection');

class MQTTAdapterBridge extends BaseBridge {
    constructor(config) {
        super({ ...config, device: null });
        this.connection = new MQTTAdapterConnection({ ...config.mqttConnection });

        if (config.device) {
            const deviceBridge = new DeviceBridge({ ...config.device }, { debug: config.debug });
            this.setDeviceBridge(deviceBridge);
        }
    }

    async init() {
        this.debug.info('MQTTAdapterBridge.init', 'start init');
        super.init();
        await this.connection.connect();
        this.debug.info('MQTTAdapterBridge.init', 'finish init');
    }

    destroy() {
        this.connection.disconnect();
        super.destroy();
    }
}

module.exports = MQTTAdapterBridge;
