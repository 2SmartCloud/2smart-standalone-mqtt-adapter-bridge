const EventEmitter = require('events');

const MQTTtransport = require('homie-sdk/lib/Broker/mqtt');

class MQTTAdapterConnection extends EventEmitter {
    constructor({ uri, username, password }) {
        super();
        this.setMaxListeners(0);

        this.transport = new MQTTtransport({
            uri,
            username,
            password
        });
        this.transport.on('connect', () => this.emit('connected'));
        this.transport.on('disconnect', () => this.emit('disconnected'));
    }

    async connect() {
        await this.transport.connect();
    }

    disconnect(force = false) {
        this.transport.end(force);
    }
}

module.exports = MQTTAdapterConnection;
