const BaseDeviceBridge = require('homie-sdk/lib/Bridge/BaseDevice');
const BaseNodeBridge = require('homie-sdk/lib/Bridge/BaseNode');

const NodeBridge = require('./NodeBridge');

class DeviceBridge extends  BaseDeviceBridge {
    constructor(config, { debug } = {}) {
        super({
            ...config,
            transports : null,
            options    : null,
            telemetry  : null,
            nodes      : null
        }, { debug });

        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);

        if (config.nodes) {
            for (let node of config.nodes) {
                if (!(node instanceof BaseNodeBridge)) {
                    node = new NodeBridge({ ...node }, { debug });
                }

                this.addNode(node);
            }
        }
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
    }

    async handleDisconnected() {
        this.connected = false;
    }
}

module.exports = DeviceBridge;
