import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import MonitoringRecord from "components/monitoring/MonitoringRecordRedesigned";

class MonitoringPanel extends PureComponent {
  static propTypes = {
    userId: PropTypes.string.isRequired,
    connection: PropTypes.any.isRequired
  };

  constructor(...args) {
    super(...args);
    this.state = {recordsData: {}, connectionState: null, filtered: [], toggle: false, data: [], recordsWithNoRoom: 0, noRoomExpand: true};
    this.audioRequestCallbacks = {};
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

  filterData = () => {
    let filtered = [...this.state.filtered];
    let recordsWithNoRoom = 0;
    this.getSortedRecords().forEach( (item, i) => {
      if(!item.roomName) {
        recordsWithNoRoom += 1;
      } else if(filtered.indexOf(item.roomName) === -1) {
        filtered.push(item.roomName);
      }
    });
    this.setState({filtered, recordsWithNoRoom, data: this.getSortedRecords()});
  }

  createRooms = (roomName) => {
    const { data } = this.state;
    let response = [], recording = 0, total = 0, idle = false;
    if(!data) return {idle: true, response};
    data.forEach(item => {
      const updatedAt = new Date(item.updatedAt);
      const delay = Math.floor((new Date() - updatedAt) / 1000);
      if(item.roomName === roomName) {
        total += 1;
        if(item.state.indexOf("Recording") === -1) {
          recording += 1;
        }
        if(!item.slidesCompleted || !item.videosCompleted || !item.hasFocus || item.streamState || delay > 60) {
          response.push(item);
        }
      }
    });
    if (total === recording) idle = true;
    return {idle, response};
  }

  updateRecordData(recordingId, newRecordData) {
    const recordsData = {...this.state.recordsData, [recordingId]: newRecordData};
    this.setState({recordsData}, this.filterData);
  }

  setRecordsData = (data) => {
    const recordsData = data.reduce((res, jsonStr) => {
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.type === "monitoring") {
        res[parsedData.id] = parsedData;
      }
      return res;
    }, {});
    this.setState({recordsData}, this.filterData);
  }

  getSortedRecords = () => {
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

  handleAudioRequestClick = (recordingId, callback) => {
    this.audioRequestCallbacks[recordingId] = callback;
    this.monitoringHub.server.requestAudio(recordingId);
  }

  handleRemoveClick = (recordingId) => {
    let promise = new Promise((resolve, reject) => {
      this.monitoringHub.server.delete(recordingId).done(() => {
        const recordsData = {...this.state.recordsData};
        delete recordsData[recordingId];
        this.setState({recordsData}, () => {
          this.filterData();
          resolve();
        });
      });
    });
    return promise;
  }

  handleToggleSwitch = () => {
    this.setState({toggle: !this.state.toggle})
  }

  handleAddRoom = (e) => {
    e.preventDefault();
    const { value } = e.target.elements["monitoring-room-name-input"];
    if(value === "") return;
    let newFiltered = [...this.state.filtered];
    if(this.state.filtered.indexOf(value) === -1) {
      newFiltered.push(value);
      this.setState({filtered: newFiltered});
    } else {
      alert('Room with this name is already exists');
    }
  }

  handleRemoveRoom = (e) => {
    const value = e.target.dataset.item;
    let newFiltered = [...this.state.filtered];
    const position = newFiltered.indexOf(value);
    newFiltered.splice(position, 1);

    const promises = [];
    this.state.data.forEach(item => {
        if (item.roomName === value) {
            promises.push(this.handleRemoveClick(item.id));
        }
    });

    Promise.all(promises)
        .then(() => this.setState({ filtered: newFiltered }));
  }

  noSessionsCheck = (room) => {
    return !this.state.data.some(record => record.roomName === room);
  }

  handleExpand = () => {
    this.setState({noRoomExpand: !this.state.noRoomExpand});
  }

  render() {
    const { filtered, toggle, data, recordsWithNoRoom, noRoomExpand } = this.state;
    const color = this.state.connectionState === "connected" ? "green" : this.state.connectionState === "connecting" ? "yellow" : "red";
    return (
      <div className="monitoring-panel">
        <h3>Connection state: <em>{this.state.connectionState}</em></h3>
        <div className="-clear">
          <div className="monitoring-panel-container">
            <div className="monitoring-panel-container-top">
              <div className="monitoring-panel-container-top-header">
                <div className={`redesigned-status-container__circle redesigned-status-container__circle-${color}`} />
                Monitoring: {filtered.length} Room{filtered.length > 1 && "s"}
              </div>
              <div>All statuses<input type="checkbox" id="switch" onClick={this.handleToggleSwitch} checked={toggle} /><label htmlFor="switch">Toggle</label>Recording only</div>
            </div>
            {
              filtered.map((item, i) => {
                const rooms = this.createRooms(item);
                let show = toggle ? !rooms.idle : true;
                let color = rooms.idle ? "red" : rooms.response.length === 0 ? "green" : "yellow";
                if(show) {
                  return (
                    <div className="redesigned-monitoring-room-container" key={i}>
                      <div className="redesigned-status-container" >
                        <div className={`redesigned-status-container__circle redesigned-status-container__circle-${color}`} />
                        Room: {item}
                      </div>
                      <div className="redesigned-monitoring-record-container">
                        {
                          this.noSessionsCheck(item) && (
                            <div className="redesigned-record">
                              <div className="monitoring-record-nosessions">
                                No Sessions
                              </div>
                            </div>
                          )
                        }
                        {
                          data
                            .filter(filterItem => filterItem.roomName === item && (!toggle || filterItem.state === "Recording"))
                            .map((recordingData, index) => {
                              return <MonitoringRecord key={recordingData.id} {...recordingData} onAudioRequest={this.handleAudioRequestClick} onRemoveClick={this.handleRemoveClick} index={index} />
                            })
                        }
                      </div>
                    </div>
                  )
                } else {
                    return (
                      <div key={i} className="redesigned-monitoring-room-container monitoring-room-container--no-recording">
                        <div className="monitoring-room-container__room-status">{this.noSessionsCheck(item) ? "No Sessions" : `Room "${item}" is not recording now.`}</div>
                        <div className="monitoring-room-container__remove-button" data-item={item} onClick={this.handleRemoveRoom}>Remove room</div>
                      </div>
                    )
                }
              })
            }
            {
              !!recordsWithNoRoom &&
              <div className="redesigned-monitoring-room-container" >
                <div className="redesigned-status-container" >
                  <div className={`redesigned-status-container__expand ${!noRoomExpand ? "status-container--expanded" : ""}`} onClick={this.handleExpand} />Recordings with no room name set: {recordsWithNoRoom}
                </div>
                { !noRoomExpand &&
                  <div className="redesigned-monitoring-record-container">
                    {
                      this.getSortedRecords()
                        .filter(filterItem => !filterItem.roomName && (!toggle || filterItem.state === "Recording"))
                        .map((recordingData, index) => {
                          return <MonitoringRecord key={recordingData.id} {...recordingData} onAudioRequest={this.handleAudioRequestClick} onRemoveClick={this.handleRemoveClick} index={index} />
                        })
                    }
                  </div>
                }
              </div>
            }
            <div>
              <form onSubmit={this.handleAddRoom} className="redesigned-monitoring-addroom">
                <button type="submit" />
                <span>Add room</span>
                <input type="text" name="monitoring-room-name-input" placeholder="Please enter a room name" />
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default MonitoringPanel;
