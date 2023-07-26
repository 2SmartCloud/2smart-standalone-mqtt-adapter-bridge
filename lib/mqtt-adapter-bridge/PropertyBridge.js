const BasePropertyBridge = require('homie-sdk/lib/Bridge/BaseProperty');

class PropertyBridge extends BasePropertyBridge {
    constructor(config, { type, transport, parser, debug }) {
        super(config, { type, transport, parser, debug });
    }
}

module.exports = PropertyBridge;
