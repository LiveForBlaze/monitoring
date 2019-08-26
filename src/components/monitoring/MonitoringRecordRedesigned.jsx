import React, { PureComponent, createRef, Fragment } from "react";
import PropTypes from "prop-types";

import { bindAll, recentTime } from "components/Utils";

class MonitoringRecord extends PureComponent {
  constructor(...args) {
    super(...args);
    this.state = {
      isHidden: false,
      isAudioRequested: false,
      hasAudio: false,
      mostRecentUpdate: null,
      checkAudio: false,
      audioCheckedAt: ""
    };
    this.audioRef = createRef();
    bindAll(this, "handleToggleClick", "handleAuioRequestClick", "handleOnRemoveClick", "handleAudioRequestClose" );
  }

  componentDidMount() {
    this.timeUpdateInterval = setInterval(this.refreshMostRecentUpdate.bind(this), 30000);
    this.refreshMostRecentUpdate();
    if (this.props.state === "Finished") {
      this.setState({isHidden: false})
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
    this.setState({isAudioRequested: true, checkAudio: true});
    this.audioSample = null;
    this.props.onAudioRequest(this.props.id, (resp) => {
      this.setState({isAudioRequested: false, hasAudio: true, audioCheckedAt: Date.now()});

      if (this.audioRef.current) {
        this.audioRef.current.src = resp;
        this.audioRef.current.load();
      }
    });
  }

  handleAudioRequestClose() {
    this.setState({checkAudio: false});
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

  getStatusString(state, isPaused, currentSlide, streamState) {
    if (state === "Recording") {
      let color = "-color--green";

      if (isPaused) {
        color = "-color--clementine";
      }

      if (streamState === "inactive") {
        color = "-color--red";
      }

      return (<strong className={color}>Recording slide #{currentSlide}{isPaused ? " (on pause)" : ""}</strong>);
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
    const { hasFocus, slidesProgress, slidesCompleted, videosProgress, videosCompleted, currentSlide, streamState, isPaused, name, state } = this.props,
          { checkAudio, mostRecentUpdate, isAudioRequested, hasAudio, audioCheckedAt } = this.state;
    const updatedAt = new Date(this.props.updatedAt);
    const delay = Math.floor((new Date() - updatedAt) / 1000);
    return (
      <div className="redesigned-record">
        <div className="redesigned-monitoring-record">
          <div>"{name.length > 45 ? `${name.substring(0,45)}...` : name}"</div>
          <div>Updated: <span className={`redesigned-monitoring-record-update-${delay < 60 ? "green" : delay < 300 ? "yellow" : "red"}`} title={updatedAt.toTimeString()}>{mostRecentUpdate}</span></div>
          <div>Audio quality checked: <span> {audioCheckedAt ? recentTime(audioCheckedAt, 30) : "Never"}</span></div>
          <div>Focus: <span style={{color: `${hasFocus ? "green" : "red"}`}}>{hasFocus ? "Yes" : "No"}</span><span className="redesigned-monitoring-record__margin_left">Status: {streamState ? <span style={{color: "red"}}>Mic Disconnected</span> : this.getStatusString(state, isPaused, currentSlide, streamState)}</span></div>
          <div>Slides: <span style={{color: `${slidesCompleted ? "green" : "red"}`}}>{slidesProgress}</span> <span className="redesigned-monitoring-record__margin_left">Videos: <span style={{color: `${videosCompleted ? "green" : "red"}`}}>{videosProgress}</span></span></div>
        </div>
        <div className="monitoring-record-hover">
        {
          !checkAudio ? (
            <Fragment>
              <div className="monitoring-record-hover__refresh monitoring-icons" />
              <div className="monitoring-record-hover__audio monitoring-icons" onClick={this.handleAuioRequestClick} />
              <div className="monitoring-record-hover__remove monitoring-icons" onClick={this.handleOnRemoveClick} />
            </Fragment>
          ) : (
            <Fragment>
              <div className="monitoring-record-hover__close" onClick={this.handleAudioRequestClose}>Back</div>
              {isAudioRequested && <div className="monitoring-record-hover__getting">Getting audio...</div>}
              <audio ref={this.audioRef} controls className={hasAudio ? "" : "-hidden"}  />
            </Fragment>
          )
        }
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
  isPaused: PropTypes.bool,
  updatedAt: PropTypes.number,
  roomName: PropTypes.string,
  onAudioRequest: PropTypes.func,
  onRemoveClick: PropTypes.func,
  index: PropTypes.number,
  streamState: PropTypes.string
};

export default MonitoringRecord;
