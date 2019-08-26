import React, { PureComponent, createRef } from "react";
import PropTypes from "prop-types";

import { bindAll, recentTime } from "components/Utils";

class MonitoringRecord extends PureComponent {
  constructor(...args) {
    super(...args);
    this.state = {
      isHidden: false,
      isAudioRequested: false,
      hasAudio: false,
      mostRecentUpdate: null
    };
    this.audioRef = createRef();
    bindAll(this, "handleToggleClick", "handleAuioRequestClick", "handleOnRemoveClick" );
  }

  componentDidMount() {
    this.timeUpdateInterval = setInterval(this.refreshMostRecentUpdate.bind(this), 30000);
    this.refreshMostRecentUpdate();
    if (this.props.state === "Finished") {
      this.setState({isHidden: true})
    }
  }

  componentWillUnmount() {
    clearInterval(this.timeUpdateInterval)
  }

  refreshMostRecentUpdate() {
    if (!this.props.updatedAt)
      return;

    const dt = new Date(this.props.updatedAt);
    this.setState({mostRecentUpdate: recentTime(dt, 30)});
  }

  handleAuioRequestClick() {
    this.setState({isAudioRequested: true});
    this.audioSample = null;
    this.props.onAudioRequest(this.props.id, (resp) => {
      this.setState({isAudioRequested: false, hasAudio: true});

      if (this.audioRef.current) {
        this.audioRef.current.src = resp;
        this.audioRef.current.load();
      }
    });
  }

  handleToggleClick() {
    this.setState({isHidden: !this.state.isHidden});
  }


  handleOnRemoveClick() {
    if (this.props.state === "Finished") {
      this.props.onRemoveClick(this.props.id);
    } else {
      if (window.confirm("Are you sure you want to remove this item?")) {
        this.props.onRemoveClick(this.props.id);
      }
    }
  }

  getStatusString(state, currentSlide, streamState) {
    if (state === "Recording") {
      let color = "-color--green";

      if (streamState === "inactive") {
        color = "-color--red";
      }

      return (<strong className={color}>Recording slide #{currentSlide}</strong>);
    }
    return state;
  }

  getHeading(roomName, name) {
    if (roomName) {
      let roomNameAndName = `${roomName} || ${name}`
      return roomNameAndName.length < 50 ? roomNameAndName : `${roomNameAndName.substring(0,50)}...`;
    }
    return name.length < 50 ? name : `${name.substring(0,50)}...`;
  }

  render() {
    const { name, hasFocus, slidesProgress, videosProgress, currentSlide, streamState, state, roomName, index } = this.props;
    if (this.state.isHidden) {
      return (
        <div className="monitoring-record monitoring-record--collapsed">
          <div className="monitoring-record--collapsed__first-line">
            <div>{this.getHeading(roomName, name)}</div>
            <div>{this.getStatusString(state, currentSlide, streamState)}</div>
            <div>
              <button onClick={this.handleToggleClick} type="button" className="monitoring-record__btn">OPEN</button><br />
              <button onClick={this.handleOnRemoveClick} type="button" className="monitoring-record__btn">REMOVE</button>
            </div>
          </div>
        </div>
      );
    }

    const updatedAt = new Date(this.props.updatedAt);

    return (
      <div className="monitoring-record">
        <div className="monitoring-record__text-background">
          {index+1}
        </div>
        <div className="monitoring-record__line">
          <div>Name</div>
          <div>{name}</div>
          <div>
            <button onClick={this.handleToggleClick} type="button" className="monitoring-record__btn">collapse</button><br />
            <button onClick={this.handleOnRemoveClick} type="button" className="monitoring-record__btn">remove</button>
          </div>
        </div>
        <div className="monitoring-record__line">
          <div>Room</div>
          <div>{roomName}</div>
        </div>
        <div className="monitoring-record__line">
          <div>Has focus</div>
          <div>{hasFocus.toString()}</div>
        </div>
        <div className="monitoring-record__line">
          <div>Status</div>
          <div>{this.getStatusString(state, currentSlide, streamState)}</div>
        </div>
        <div className="monitoring-record__line">
          <div>Slides cached</div>
          <div>{slidesProgress}</div>
        </div>
        <div className="monitoring-record__line">
          <div>Videos cached</div>
          <div>{videosProgress}</div>
        </div>
        <div className="monitoring-record__line">
          <div>Last update</div>
          <div><span title={updatedAt.toTimeString()}>{this.state.mostRecentUpdate}</span></div>
        </div>
        <div className="monitoring-record-audio">
          <div className="monitoring-record-audio__btn-group">
            <div><button onClick={this.handleAuioRequestClick} className="monitoring-record__btn">request audio</button></div>
            <div>{this.state.isAudioRequested && "Getting audio.."}</div>
          </div>
          <div className="monitoring-record-audio__btn-group">
            <div>Last sample</div>
            <div>
              <audio ref={this.audioRef} controls className={this.state.hasAudio ? "" : "-hidden"}  />
              { !this.state.hasAudio && "empty" }
            </div>
          </div>
        </div>
      </div>
    );
  }
};

MonitoringRecord.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  hasFocus: PropTypes.bool,
  slidesProgress: PropTypes.string,
  videosProgress: PropTypes.string,
  currentSlide: PropTypes.number,
  state: PropTypes.string,
  updatedAt: PropTypes.number,
  roomName: PropTypes.string,
  onAudioRequest: PropTypes.func,
  onRemoveClick: PropTypes.func,
  index: PropTypes.number,
  streamState: PropTypes.string
};

export default MonitoringRecord;
