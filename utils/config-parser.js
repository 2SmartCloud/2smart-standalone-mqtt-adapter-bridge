/* eslint-disable no-param-reassign */
function parseConfigTransform(deviceConfig, transform) {
    deviceConfig.nodes.forEach(node => {
        const { id: nodeId, sensors, options, telemetry } = node;

        const transformNodeStateTopic = `${nodeId}/$state`; // current supported node attribute topic
        node.nodeTransforms = {};

        Object.keys(transform).forEach(transformTopic => {
            if (transformTopic  === transformNodeStateTopic) {
                node.nodeTransforms[transformTopic] = transform[transformTopic];
            }
        });

        if (sensors) {
            sensors.forEach(sensor => {
                const { id: sensorId } = sensor;
                const transformSensorTopic = `${nodeId}/${sensorId}`;
                sensor.transforms = {};

                Object.keys(transform).forEach(transformTopic => {
                    // if transformSensorTopic is a substring of transformTopic
                    // example: "temp/outside-temperature" is a substring of "temp/outside-temperature/$unit"
                    if (transformTopic.includes(transformSensorTopic)) {
                        sensor.transforms[transformTopic] = transform[transformTopic];
                    }
                });
            });
        }

        if (options) {
            options.forEach(option => {
                const { id: optionId } = option;
                const transformOptionTopic = `${nodeId}/$options/${optionId}`;
                option.transforms = {};

                Object.keys(transform).forEach(transformTopic => {
                    // if transformSensorTopic is a substring of transformTopic
                    // example: "temp/outside-temperature" is a substring of "temp/outside-temperature/$unit"
                    if (transformTopic.includes(transformOptionTopic)) {
                        option.transforms[transformTopic] = transform[transformTopic];
                    }
                });
            });
        }

        if (telemetry) {
            telemetry.forEach(telemetryEl => {
                const { id: telemetryId } = telemetryEl;
                const transformTelemetryTopic = `${nodeId}/$telemetry/${telemetryId}`;
                telemetryEl.transforms = {};

                Object.keys(transform).forEach(transformTopic => {
                    // if transformSensorTopic is a substring of transformTopic
                    // example: "temp/outside-temperature" is a substring of "temp/outside-temperature/$unit"
                    if (transformTopic.includes(transformTelemetryTopic)) {
                        telemetryEl.transforms[transformTopic] = transform[transformTopic];
                    }
                });
            });
        }
    });

    return deviceConfig;
}

module.exports = parseConfigTransform;

