const CONFIG_ERROR_CODES = {
    WRONG_TRANSPORT_TYPE                  : 'WRONG_TRANSPORT_TYPE',
    WRONG_TRANSPORT_TOPIC                 : 'WRONG_TRANSPORT_TOPIC',
    WRONG_TRANSPORT_ELEMENT               : 'WRONG_TRANSPORT_ELEMENT',
    STATE_TOPIC_REQUIRED                  : 'STATE_TOPIC_REQUIRED',
    COMMAND_TOPIC_REQUIRED                : 'COMMAND_TOPIC_REQUIRED',
    STATE_TRANSFORMER_IS_NOT_A_FUNCTION   : 'STATE_TRANSFORMER_IS_NOT_A_FUNCTION',
    COMMAND_TRANSFORMER_IS_NOT_A_FUNCTION : 'COMMAND_TRANSFORMER_IS_NOT_A_FUNCTION',
    NOT_SUPPORTED_STATE_PARSER_TYPE       : 'NOT_SUPPORTED_STATE_PARSER_TYPE',
    NOT_SUPPORTED_COMMAND_PARSER_TYPE     : 'NOT_SUPPORTED_COMMAND_PARSER_TYPE'
};

const SUPPORTED_PARSER_TYPES = [ 'JSON', 'PLAIN' ];

function transform_dictionary() {
    return dictionary => {
        if ((typeof dictionary) !== 'object') return CONFIG_ERROR_CODES.WRONG_TRANSPORT_TYPE;

        for (const [ topic, { state, command } ] of Object.entries(dictionary)) {
            const topicLevels = topic.split('/');

            // eslint-disable-next-line func-style
            const isValidTopicLevel = topicLevel =>
                topicLevel.charAt(0) !== '-' &&
                topicLevel.charAt(topicLevel.length - 1) !== '-' &&
                /^\$?[a-z0-9-]+$/.test(topicLevel);

            const topicLevelsValidators = {
                // topics like either "node-id/sensor-id" or "node-id/$attribute"
                2 : (nodeId, sensorIdOrNodeAttribute) => {
                    return (
                        nodeId.charAt(0) !== '$' &&
                        sensorIdOrNodeAttribute.charAt(0) !== '$' &&
                        isValidTopicLevel(nodeId) &&
                        isValidTopicLevel(sensorIdOrNodeAttribute)
                    ) || (
                        nodeId.charAt(0) !== '$' &&
                        sensorIdOrNodeAttribute.charAt(0) === '$' &&
                        isValidTopicLevel(nodeId) &&
                        isValidTopicLevel(sensorIdOrNodeAttribute)
                    );
                },
                // topics like either "node-id/$property-type/property-id" or "node-id/sensor-id/$attribute"
                3 : (nodeId, propertyTypeOrSensorId, propertyIdOrSensorAttribute) => {
                    return (
                        isValidTopicLevel(nodeId) &&
                        isValidTopicLevel(propertyTypeOrSensorId) &&
                        isValidTopicLevel(propertyIdOrSensorAttribute)
                    ) && (
                        nodeId.charAt(0) !== '$' &&
                        propertyTypeOrSensorId.charAt(0) === '$' &&
                        propertyIdOrSensorAttribute.charAt(0) !== '$'
                        ||
                        nodeId.charAt(0) !== '$' &&
                        propertyTypeOrSensorId.charAt(0) !== '$' &&
                        propertyIdOrSensorAttribute.charAt(0) === '$'
                    );
                },
                // topics like "node-id/$property-type/property-id/$attribute"
                4 : (nodeId, propertyType, propertyId, attribute) => {
                    return (
                        nodeId.charAt(0) !== '$' &&
                        propertyType.charAt(0) === '$' &&
                        propertyId.charAt(0) !== '$' &&
                        attribute.charAt(0) === '$' &&
                        isValidTopicLevel(nodeId) &&
                        isValidTopicLevel(propertyType) &&
                        isValidTopicLevel(propertyId) &&
                        isValidTopicLevel(attribute)
                    );
                }
            };

            const topicLevelsValidator = topicLevelsValidators[topicLevels.length];
            // number of topic levels is not in range 2-4
            if (!topicLevelsValidator) return CONFIG_ERROR_CODES.WRONG_TRANSPORT_TOPIC;

            const isValidTopic = topicLevelsValidator(...topicLevels);
            if (!isValidTopic) return CONFIG_ERROR_CODES.WRONG_TRANSPORT_TOPIC;

            if (!state && !command) return CONFIG_ERROR_CODES.WRONG_TRANSPORT_ELEMENT;

            if (state) {
                if (!state.topic) return CONFIG_ERROR_CODES.STATE_TOPIC_REQUIRED;

                if (state.transformer !== undefined && ((typeof state.transformer) !== 'function')) {
                    return CONFIG_ERROR_CODES.STATE_TRANSFORMER_IS_NOT_A_FUNCTION;
                }

                if (state.parser) {
                    if (!SUPPORTED_PARSER_TYPES.includes(state.parser)) {
                        return CONFIG_ERROR_CODES.NOT_SUPPORTED_STATE_PARSER_TYPE;
                    }
                }
            }

            if (command) {
                if (!command.topic) return CONFIG_ERROR_CODES.COMMAND_TOPIC_REQUIRED;

                if (command.transformer !== undefined && ((typeof command.transformer) !== 'function')) {
                    return CONFIG_ERROR_CODES.COMMAND_TRANSFORMER_IS_NOT_A_FUNCTION;
                }

                if (command.parser) {
                    if (!SUPPORTED_PARSER_TYPES.includes(state.parser)) {
                        return CONFIG_ERROR_CODES.NOT_SUPPORTED_COMMAND_PARSER_TYPE;
                    }
                }
            }
        }
    };
}

module.exports = {
    transform_dictionary
};
