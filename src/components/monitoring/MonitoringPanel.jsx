import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import MonitoringRecord from "components/monitoring/MonitoringRecord";
import { bindAll } from "components/Utils";

class MonitoringPanel extends PureComponent {
  static propTypes = {
    userId: PropTypes.string.isRequired,
    connection: PropTypes.any.isRequired
  };

  constructor(...args) {
    super(...args);
    this.state = {recordsData: {}, connectionState: null};
    this.audioRequestCallbacks = {};
    bindAll(this, "setRecordsData", "handleAudioRequestClick", "handleRemoveClick");
  }

  componentDidMount() {
    const { connection, userId } = this.props;
    this.monitoringHub = connection.monitoringHub;

    this.monitoringHub.client.onAudioResponse = (recordingId, resp) => {
      if (this.audioRequestCallbacks[recordingId]) {
        setTimeout(this.audioRequestCallbacks[recordingId], 0, resp);
        delete this.audioRequestCallbacks[recordingId];
      }
    };

    this.monitoringHub.client.onUpdate = (recordingId, jsonStr) => {
      const parsedData = JSON.parse(jsonStr);

      if (parsedData.type === "monitoring") {
        this.updateRecordData(recordingId, parsedData);
      }
    };

    // TODO move connection mumbo-jumbo to other class
    connection.hub.stateChanged((change) => {
      const { jQuery } = window,
            states = jQuery.signalR.connectionState,
            stateStr = Object.keys(states).find((key) => states[key] === change.newState);
      this.setState({connectionState: stateStr});
    });

    connection.hub.disconnected(() => {
      setTimeout(() => {
        connection.hub.start({withCredentials: false}).done(() => {
          this.monitoringHub.server.register(userId).done(this.setRecordsData);
        });
      }, 5000);
    });

    connection.hub.reconnected(() => {
      this.monitoringHub.server.register(userId).done(this.setRecordsData);
    });

    connection.hub.start({withCredentials: false, waitForPageLoad: false}).done(() => {
      this.monitoringHub.server.register(userId).done(this.setRecordsData);
    });
  }

  componentWillUnmount() {
    // TODO: unbind other hooks
    this.props.connection.hub.stop();
  }

  updateRecordData(recordingId, newRecordData) {
    const recordsData = {...this.state.recordsData, [recordingId]: newRecordData};
    this.setState({recordsData});
  }

  setRecordsData(data) {
    const recordsData = data.reduce((res, jsonStr) => {
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.type === "monitoring") {
        res[parsedData.id] = parsedData;
      }
      return res;
    }, {});
    this.setState({recordsData});
  }

  getSortedRecords() {
    const statesPriority = {
      "Saving": 0,
      "Error during upload": 0,
      "Recording": 1,
      "Downloading": 2,
      "Ready to record": 3,
      "Finished": 4
    };
    return Object.values(this.state.recordsData).sort((a, b) => {
      if (a.state === b.state) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      } else {
        return statesPriority[a.state] - statesPriority[b.state];
      }
    });
  }

  handleAudioRequestClick(recordingId, callback) {
    this.audioRequestCallbacks[recordingId] = callback;
    this.monitoringHub.server.requestAudio(recordingId);
  }

  handleRemoveClick(recordingId) {
    this.monitoringHub.server.delete(recordingId).done(() => {
      const recordsData = {...this.state.recordsData};
      delete recordsData[recordingId];
      this.setState({recordsData});
    });
  }

  render() {
    return (
      <div className="monitoring-panel">
        <h3>Connection state: <em>{this.state.connectionState}</em></h3>

        <div className="-clear">
          <div className="monitoring-panel-container">
            { this.getSortedRecords().map((recordingData, index) => {
                return (<MonitoringRecord key={recordingData.id} {...recordingData} onAudioRequest={this.handleAudioRequestClick} onRemoveClick={this.handleRemoveClick} index={index} />);
              })
            }
          </div>
        </div>
      </div>
    );
  }
};

export default MonitoringPanel;
